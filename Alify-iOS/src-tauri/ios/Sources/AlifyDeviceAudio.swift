import AVFoundation
import MediaPlayer
import Tauri
import UIKit
import UniformTypeIdentifiers
import UserNotifications
import WidgetKit

private struct Song: Codable {
    let id: String
    let title: String
    let artist: String
    let album: String
    let duration: Int
}

private struct TransferManifest: Decodable {
    struct Track: Decodable {
        let file: String
        let title: String?
        let artist: String?
        let album: String?
        let lyrics: String?
    }

    let format: String
    let name: String
    let tracks: [Track]
}

private enum AudioError: LocalizedError {
    case unavailable, unsupported, busy

    var errorDescription: String? {
        switch self {
        case .unavailable: return "El archivo de audio ya no está disponible."
        case .unsupported: return "Alify no pudo abrir este archivo."
        case .busy: return "Ya hay una selección de archivos en curso."
        }
    }
}

private final class Player: NSObject, AVAudioPlayerDelegate {
    let defaults = UserDefaults.standard
    let files = FileManager.default
    var player: AVAudioPlayer?
    var songs = [Song]()
    var queue = [Song]()
    var index = 0
    var shuffle = false
    var pending = [String]()
    var resumeAfterInterruption = false
    var failure = ""
    private var loaded = false
    private var widgetKey: String?

    var directory: URL {
        files.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("AlifyAudio", isDirectory: true)
    }

    var song: Song? { queue.indices.contains(index) ? queue[index] : nil }
    var playing: Bool { player?.isPlaying == true }
    var position: Int { Int((player?.currentTime ?? 0) * 1000) }

    func load() {
        guard !loaded else { return }
        loaded = true
        if let data = defaults.data(forKey: "ios.songs"),
           let library = try? JSONDecoder().decode([Song].self, from: data) {
            songs = library.filter { files.fileExists(atPath: url($0).path) }
        }
        let ids = defaults.stringArray(forKey: "ios.queue") ?? []
        let byID = Dictionary(uniqueKeysWithValues: songs.map { ($0.id, $0) })
        queue = ids.compactMap { byID[$0] }
        guard let savedID = defaults.string(forKey: "ios.current"),
              let savedIndex = queue.firstIndex(where: { $0.id == savedID }) else {
            queue = []
            return
        }
        index = savedIndex
        shuffle = defaults.bool(forKey: "ios.shuffle")
        resetShuffle()
        try? select(index, at: defaults.integer(forKey: "ios.position"), autoplay: false)
    }

    func url(_ song: Song) -> URL { directory.appendingPathComponent(song.id) }

    func saveLibrary() throws {
        defaults.set(try JSONEncoder().encode(songs), forKey: "ios.songs")
    }

    func savePlayback() {
        defaults.set(queue.map(\.id), forKey: "ios.queue")
        defaults.set(song?.id, forKey: "ios.current")
        defaults.set(position, forKey: "ios.position")
        defaults.set(shuffle, forKey: "ios.shuffle")
    }

    static func importSong(_ source: URL, to directory: URL) throws -> Song {
        let files = FileManager.default
        try files.createDirectory(at: directory, withIntermediateDirectories: true)
        let id = UUID().uuidString + "." + source.pathExtension.lowercased()
        let destination = directory.appendingPathComponent(id)
        try files.copyItem(at: source, to: destination)
        do {
            let audio = try AVAudioPlayer(contentsOf: destination)
            guard audio.duration.isFinite, audio.duration > 0 else { throw AudioError.unsupported }
            let metadata = AVURLAsset(url: destination).commonMetadata
            func value(_ key: AVMetadataKey) -> String? {
                metadata.first { $0.commonKey == key }?.stringValue
            }
            return Song(id: id, title: value(.commonKeyTitle) ?? source.deletingPathExtension().lastPathComponent,
                        artist: value(.commonKeyArtist) ?? "", album: value(.commonKeyAlbumName) ?? "",
                        duration: Int(audio.duration * 1000))
        } catch {
            try? files.removeItem(at: destination)
            throw error
        }
    }

    func add(_ tracks: [Song]) throws {
        let count = songs.count
        songs.append(contentsOf: tracks)
        do { try saveLibrary() }
        catch {
            songs.removeLast(songs.count - count)
            for track in tracks {
                let destination = url(track)
                try? files.removeItem(at: destination)
                try? files.removeItem(at: destination.deletingPathExtension().appendingPathExtension("lrc"))
            }
            throw error
        }
    }

    func select(_ next: Int, at position: Int = 0, autoplay: Bool = true) throws {
        guard queue.indices.contains(next) else { throw AudioError.unavailable }
        if autoplay { try activateSession() }
        let audio = try AVAudioPlayer(contentsOf: url(queue[next]))
        audio.delegate = self
        audio.currentTime = min(audio.duration, Double(max(0, position)) / 1000)
        player?.stop()
        player = audio
        index = next
        failure = ""
        if autoplay && !audio.play() {
            failure = "No se pudo iniciar la reproducción."
        }
        publish()
    }

    private func activateSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback)
        try session.setActive(true)
    }

    func setPlaying(_ desired: Bool) throws {
        guard let player else { throw AudioError.unavailable }
        if desired {
            try activateSession()
            guard player.play() else { throw AudioError.unavailable }
        } else {
            player.pause()
        }
        publish()
    }

    func resetShuffle() {
        pending = queue.map(\.id).filter { $0 != song?.id }.shuffled()
    }

    func skip(_ offset: Int) throws {
        guard !queue.isEmpty else { throw AudioError.unavailable }
        if offset > 0 && shuffle {
            if pending.isEmpty { resetShuffle() }
            if let id = pending.popLast(), let next = queue.firstIndex(where: { $0.id == id }) {
                try select(next)
                return
            }
        }
        try select((index + offset + queue.count) % queue.count)
    }

    func remove(_ ids: Set<String>) throws -> Int {
        var removed = Set<String>()
        for track in songs where ids.contains(track.id) {
            if !files.fileExists(atPath: url(track).path) || (try? files.removeItem(at: url(track))) != nil {
                let sidecar = url(track).deletingPathExtension().appendingPathExtension("lrc")
                try? files.removeItem(at: sidecar)
                removed.insert(track.id)
            }
        }
        let currentID = song?.id
        songs.removeAll { removed.contains($0.id) }
        queue.removeAll { removed.contains($0.id) }
        if let currentID, let current = queue.firstIndex(where: { $0.id == currentID }) {
            index = current
        } else {
            player?.stop()
            player = nil
            queue = []
            index = 0
        }
        resetShuffle()
        publish()
        try saveLibrary()
        return removed.count
    }

    func publish() {
        savePlayback()
        if let song {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = [
                MPMediaItemPropertyTitle: song.title, MPMediaItemPropertyArtist: song.artist,
                MPMediaItemPropertyPlaybackDuration: Double(song.duration) / 1000,
                MPNowPlayingInfoPropertyElapsedPlaybackTime: Double(position) / 1000,
                MPNowPlayingInfoPropertyPlaybackRate: playing ? 1 : 0
            ]
        } else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        }
        let appearance = defaults.dictionary(forKey: "ios.theme") ?? [:]
        let skin = appearance["skin"] as? String ?? "alify-original"
        let title = song?.title ?? "Elige un audio en Alify"
        let accent = appearance["customPalette"] as? Bool == true ? appearance["accent"] as? String ?? "#ffffff" : "#ffffff"
        let key = [title, skin, accent, String(playing), String(song != nil)].joined(separator: "\u{001F}")
        if key != widgetKey, let shared = widgetDefaults() {
            shared.set(["title": title, "skin": skin, "accent": accent, "playing": playing,
                        "ready": song != nil], forKey: "alify.widget")
            widgetKey = key
            WidgetCenter.shared.reloadTimelines(ofKind: "AlifyPlayer")
        }
    }

    private func widgetDefaults() -> UserDefaults? {
        guard let group = Bundle.main.object(forInfoDictionaryKey: "AlifyAppGroup") as? String,
              !group.isEmpty else { return nil }
        return UserDefaults(suiteName: group)
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        guard player === self.player else { return }
        if flag, shuffle || index + 1 < queue.count {
            do { try skip(1); return } catch { failure = error.localizedDescription }
        }
        player.currentTime = 0
        publish()
    }
}

final class AlifyDeviceAudio: Plugin, UIDocumentPickerDelegate {
    private let audio = Player()
    private var pickerCompletion: ((URL?) -> Void)?
    private let pickerQueue = DispatchQueue(label: "app.alify.files", qos: .userInitiated)
    private let noValue = NSNull()
    private let reminderID = "alify.listen-later"

    override init() {
        super.init()
        DispatchQueue.main.async { [weak self] in
            self?.audio.load()
            self?.audio.publish()
            self?.configureSystemControls()
            self?.runPendingWidgetAction()
        }
    }

    @objc func dispatch(_ invoke: Invoke) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { invoke.reject("Alify no está disponible."); return }
            do {
                let data = Data(invoke.getRawArgs().utf8)
                guard let input = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let action = input["action"] as? String else { throw AudioError.unsupported }
                try self.handle(action, input["args"] as? [String: Any] ?? [:], invoke)
            } catch { invoke.reject(error.localizedDescription) }
        }
    }

    private func reply(_ value: Any, _ invoke: Invoke) {
        do {
            let data: Data
            if let songs = value as? [Song] {
                data = try JSONEncoder().encode(songs)
            } else {
                data = try JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed)
            }
            invoke.resolve(["json": String(decoding: data, as: UTF8.self)])
        } catch { invoke.reject(error.localizedDescription) }
    }

    private func handle(_ action: String, _ args: [String: Any], _ invoke: Invoke) throws {
        audio.load()
        let defaults = audio.defaults
        switch action {
        case "scan": reply(audio.songs, invoke)
        case "status":
            reply(["id": audio.song?.id ?? "", "playing": audio.playing, "position": audio.position,
                   "shuffle": audio.shuffle, "error": audio.failure] as [String: Any], invoke)
        case "control": try control(args, invoke)
        case "theme":
            if args["skin"] is String {
                defaults.set(args, forKey: "ios.theme")
                audio.publish()
            }
            reply(defaults.dictionary(forKey: "ios.theme") ?? ["skin": "alify-original"], invoke)
        case "migrationState":
            if let data = args["data"] as? String { defaults.set(data, forKey: "ios.collections") }
            if let data = defaults.string(forKey: "ios.collections") { reply(data, invoke) }
            else { reply(noValue, invoke) }
        case "artwork", "coverThumb":
            if let song = audio.songs.first(where: { $0.id == args["id"] as? String }) {
                reply(audio.url(song).path, invoke)
            } else { reply(noValue, invoke) }
        case "migrationExtras":
            guard let song = audio.songs.first(where: { $0.id == args["id"] as? String }) else {
                reply([String: String](), invoke); return
            }
            let sidecar = audio.url(song).deletingPathExtension().appendingPathExtension("lrc")
            reply(["lyrics": (try? String(contentsOf: sidecar, encoding: .utf8)) ?? ""], invoke)
        case "pickList", "pickFolder", "pickLyrics", "profilePhoto":
            try pick(action, invoke)
        case "reminder":
            guard let enabled = args["enabled"] as? Bool else {
                reply(defaults.bool(forKey: "ios.reminder"), invoke)
                return
            }
            let center = UNUserNotificationCenter.current()
            if enabled {
                center.requestAuthorization(options: [.alert, .sound]) { [weak self] allowed, _ in
                    DispatchQueue.main.async {
                        guard let self else { invoke.reject("Alify no está disponible."); return }
                        self.audio.defaults.set(allowed, forKey: "ios.reminder")
                        if allowed { self.scheduleReminder() }
                        self.reply(allowed, invoke)
                    }
                }
            } else {
                defaults.set(false, forKey: "ios.reminder")
                center.removePendingNotificationRequests(withIdentifiers: [reminderID])
                reply(false, invoke)
            }
        case "deleteSongs":
            reply(try audio.remove(Set(args["ids"] as? [String] ?? [])), invoke)
        case "fullscreen", "sharedLink", "transferProgress": reply(noValue, invoke)
        case "pin": reply(false, invoke)
        default: throw AudioError.unsupported
        }
    }

    private func control(_ args: [String: Any], _ invoke: Invoke) throws {
        switch args["command"] as? String {
        case "queue":
            let rows = args["queue"] as? [[String: Any]] ?? []
            let lookup = Dictionary(uniqueKeysWithValues: audio.songs.map { ($0.id, $0) })
            let tracks = rows.compactMap { row in (row["id"] as? String).flatMap { lookup[$0] } }
            let selection = args["index"] as? Int ?? 0
            guard tracks.count == rows.count, tracks.indices.contains(selection) else { throw AudioError.unavailable }
            let oldQueue = audio.queue
            audio.queue = tracks
            do { try audio.select(selection) } catch { audio.queue = oldQueue; throw error }
            audio.resetShuffle()
        case "toggle": try audio.setPlaying(!audio.playing)
        case "previous": try audio.skip(-1)
        case "next": try audio.skip(1)
        case "seek":
            if let player = audio.player {
                player.currentTime = min(player.duration, Double(max(0, args["position"] as? Int ?? 0)) / 1000)
                audio.publish()
            }
        case "shuffle":
            audio.shuffle.toggle()
            audio.resetShuffle()
            audio.publish()
        case "random":
            if let index = audio.queue.indices.filter({ $0 != audio.index }).randomElement() {
                try audio.select(index)
                audio.resetShuffle()
            }
        case "playNext":
            let row = args["song"] as? [String: Any]
            guard let song = audio.songs.first(where: { $0.id == row?["id"] as? String }) else {
                throw AudioError.unavailable
            }
            if audio.queue.isEmpty { audio.queue = [song]; try audio.select(0) }
            else { audio.queue.insert(song, at: audio.index + 1); audio.publish() }
            audio.resetShuffle()
        case "upcoming":
            let upcoming = Array(audio.queue.dropFirst(audio.index + 1))
            reply(upcoming, invoke)
            return
        default: throw AudioError.unsupported
        }
        reply(noValue, invoke)
    }

    private func pick(_ action: String, _ invoke: Invoke) throws {
        guard pickerCompletion == nil else { throw AudioError.busy }
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene })
                  .first(where: { $0.activationState == .foregroundActive }),
              let root = scene.windows.first(where: \.isKeyWindow)?.rootViewController else {
            throw AudioError.unavailable
        }
        var presenter = root
        while let presented = presenter.presentedViewController { presenter = presented }
        let types: [UTType]
        switch action {
        case "pickFolder": types = [.folder]
        case "pickLyrics": types = [.plainText, UTType(filenameExtension: "lrc") ?? .data]
        case "profilePhoto": types = [.image]
        default: types = [.audio, .plainText, .commaSeparatedText] +
            ["m3u", "m3u8", "flac", "opus"].compactMap { UTType(filenameExtension: $0) }
        }
        let directory = audio.directory
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types)
        picker.delegate = self
        pickerCompletion = { [weak self] source in
            guard let self else { invoke.reject("Alify no está disponible."); return }
            guard let source else { self.reply(self.noValue, invoke); return }
            self.pickerQueue.async {
                let access = source.startAccessingSecurityScopedResource()
                defer { if access { source.stopAccessingSecurityScopedResource() } }
                do {
                    try self.importSelection(action, source: source, directory: directory, invoke: invoke)
                } catch {
                    DispatchQueue.main.async { invoke.reject(error.localizedDescription) }
                }
            }
        }
        presenter.present(picker, animated: true)
    }

    private func importSelection(_ action: String, source: URL, directory: URL, invoke: Invoke) throws {
        let ext = source.pathExtension.lowercased()
        if action == "pickLyrics" || (action == "pickList" && ["m3u", "m3u8", "csv", "txt"].contains(ext)) {
            guard let bytes = try? source.resourceValues(forKeys: [.fileSizeKey]).fileSize, bytes <= 4_000_000 else {
                throw AudioError.unsupported
            }
            let text = try String(contentsOf: source, encoding: .utf8)
            let result: Any = action == "pickLyrics" ? text : ["text": text, "filename": source.lastPathComponent]
            DispatchQueue.main.async { self.reply(result, invoke) }
            return
        }
        if action == "profilePhoto" {
            guard let image = UIImage(contentsOfFile: source.path) else { throw AudioError.unsupported }
            let factor = min(1, 512 / max(image.size.width, image.size.height))
            let size = CGSize(width: image.size.width * factor, height: image.size.height * factor)
            let format = UIGraphicsImageRendererFormat()
            format.scale = 1
            let scaled = UIGraphicsImageRenderer(size: size, format: format).image { _ in
                image.draw(in: CGRect(origin: .zero, size: size))
            }
            guard let data = scaled.jpegData(compressionQuality: 0.83) else { throw AudioError.unsupported }
            DispatchQueue.main.async { self.reply("data:image/jpeg;base64," + data.base64EncodedString(), invoke) }
            return
        }
        let files = FileManager.default
        let folder = action == "pickFolder"
        var candidates = folder ? (try files.contentsOfDirectory(at: source, includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsHiddenFiles])).filter {
                (try? $0.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true &&
                (UTType(filenameExtension: $0.pathExtension)?.conforms(to: .audio) == true ||
                    ["flac", "opus", "ogg"].contains($0.pathExtension.lowercased()))
            }.sorted { $0.lastPathComponent.localizedStandardCompare($1.lastPathComponent) == .orderedAscending } : [source]
        var transferByName = [String: TransferManifest.Track]()
        var importName = source.lastPathComponent
        if folder {
            let manifestURL = source.appendingPathComponent("alify-transfer.json")
            if let bytes = try? manifestURL.resourceValues(forKeys: [.fileSizeKey]).fileSize,
               bytes <= 8_000_000,
               let manifest = try? JSONDecoder().decode(TransferManifest.self, from: Data(contentsOf: manifestURL)),
               manifest.format == "alify-transfer-v1" {
                let candidatesByName = Dictionary(uniqueKeysWithValues: candidates.map { ($0.lastPathComponent, $0) })
                candidates = manifest.tracks.compactMap { track in
                    guard let file = candidatesByName[track.file], transferByName[track.file] == nil else { return nil }
                    transferByName[track.file] = track
                    return file
                }
                importName = manifest.name
            }
        }
        var imported = [Song]()
        var failed = 0
        for candidate in candidates {
            do {
                let song = try Player.importSong(candidate, to: directory)
                let lrc = candidate.deletingPathExtension().appendingPathExtension("lrc")
                let dest = directory.appendingPathComponent(song.id).deletingPathExtension().appendingPathExtension("lrc")
                let meta = transferByName[candidate.lastPathComponent]
                if let lyrics = meta?.lyrics, !lyrics.isEmpty {
                    try? lyrics.write(to: dest, atomically: true, encoding: .utf8)
                } else if let bytes = try? lrc.resourceValues(forKeys: [.fileSizeKey]).fileSize, bytes <= 4_000_000 {
                    try? files.copyItem(at: lrc, to: dest)
                }
                imported.append(Song(id: song.id, title: meta?.title ?? song.title,
                                     artist: meta?.artist ?? song.artist, album: meta?.album ?? song.album,
                                     duration: song.duration))
            } catch { failed += 1 }
        }
        if !folder && imported.isEmpty { throw AudioError.unsupported }
        let payload = try JSONSerialization.jsonObject(with: JSONEncoder().encode(imported)) as? [[String: Any]] ?? []
        let tracks = imported, failures = failed, name = importName
        DispatchQueue.main.async {
            do {
                try self.audio.add(tracks)
                let value: [String: Any] = folder ? ["name": name, "songs": payload, "failed": failures] :
                    ["song": payload[0]]
                self.reply(value, invoke)
            } catch { invoke.reject(error.localizedDescription) }
        }
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { finishPick(nil) }
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) { finishPick(urls.first) }
    private func finishPick(_ url: URL?) {
        let completion = pickerCompletion
        pickerCompletion = nil
        completion?(url)
    }

    private func scheduleReminder() {
        guard audio.defaults.bool(forKey: "ios.reminder") else { return }
        let content = UNMutableNotificationContent()
        content.title = "Alify"
        content.body = "Tu música está lista cuando quieras volver a escucharla."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 7 * 24 * 60 * 60, repeats: false)
        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: reminderID,
                                                                       content: content, trigger: trigger))
    }

    private func configureSystemControls() {
        NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification,
                                               object: nil, queue: .main) { [weak self] _ in self?.scheduleReminder() }
        let commands = MPRemoteCommandCenter.shared()
        func bind(_ command: MPRemoteCommand, _ operation: @escaping (Player) throws -> Void) {
            command.addTarget { [weak self] _ in
                guard let self else { return .commandFailed }
                DispatchQueue.main.async { try? operation(self.audio) }
                return .success
            }
        }
        bind(commands.playCommand) { try $0.setPlaying(true) }
        bind(commands.pauseCommand) { try $0.setPlaying(false) }
        bind(commands.togglePlayPauseCommand) { try $0.setPlaying(!$0.playing) }
        bind(commands.previousTrackCommand) { try $0.skip(-1) }
        bind(commands.nextTrackCommand) { try $0.skip(1) }
        commands.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let self, let event = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            DispatchQueue.main.async {
                self.audio.player?.currentTime = event.positionTime
                self.audio.publish()
            }
            return .success
        }
        NotificationCenter.default.addObserver(forName: UIApplication.didEnterBackgroundNotification,
                                               object: nil, queue: .main) { [weak self] _ in self?.audio.savePlayback() }
        NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification,
                                               object: nil, queue: .main) { [weak self] event in
            guard let audio = self?.audio,
                  let raw = event.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
            if type == .began {
                audio.resumeAfterInterruption = audio.playing
                try? audio.setPlaying(false)
            } else {
                let rawOptions = event.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
                if audio.resumeAfterInterruption && AVAudioSession.InterruptionOptions(rawValue: rawOptions).contains(.shouldResume) {
                    try? audio.setPlaying(true)
                }
                audio.resumeAfterInterruption = false
            }
        }
        NotificationCenter.default.addObserver(forName: Notification.Name("AlifyWidgetPlayback"),
                                               object: nil, queue: .main) { [weak self] _ in
            self?.runPendingWidgetAction()
        }
    }

    private func runPendingWidgetAction() {
        let key = "ios.widget.pending"
        let action = audio.defaults.string(forKey: key)
        audio.defaults.removeObject(forKey: key)
        switch action {
        case "previous": try? audio.skip(-1)
        case "next": try? audio.skip(1)
        case "toggle": try? audio.setPlaying(!audio.playing)
        default: break
        }
    }
}

@_cdecl("init_alify_device_audio")
func initAlifyDeviceAudio() -> Plugin { AlifyDeviceAudio() }
