import SwiftUI
import UIKit
import WidgetKit

struct PlayerEntry: TimelineEntry {
    let date = Date()
    var title = "Elige un audio en Alify"
    var skin = "alify-original"
    var accent = "#ffffff"
    var playing = false
    var ready = false
}

struct PlayerTimeline: TimelineProvider {
    func placeholder(in context: Context) -> PlayerEntry {
        PlayerEntry(title: "Alify", ready: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (PlayerEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : current())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PlayerEntry>) -> Void) {
        completion(Timeline(entries: [current()], policy: .never))
    }

    private func current() -> PlayerEntry {
        let group = Bundle.main.object(forInfoDictionaryKey: "AlifyAppGroup") as? String
        let values = group.flatMap { UserDefaults(suiteName: $0) }?.dictionary(forKey: "alify.widget")
        return PlayerEntry(title: values?["title"] as? String ?? "Elige un audio en Alify",
                           skin: values?["skin"] as? String ?? "alify-original",
                           accent: values?["accent"] as? String ?? "#ffffff",
                           playing: values?["playing"] as? Bool ?? false,
                           ready: values?["ready"] as? Bool ?? false)
    }
}

struct PlayerWidgetView: View {
    var entry: PlayerEntry

    private var art: UIImage? {
        guard entry.skin.range(of: "^[a-z0-9-]+$", options: .regularExpression) != nil else { return nil }
        let url = Bundle.main.url(forResource: entry.skin, withExtension: "webp", subdirectory: "Skins")
        return url.flatMap { UIImage(contentsOfFile: $0.path) }
    }

    private var tint: Color {
        guard let value = UInt32(entry.accent.dropFirst(), radix: 16), entry.accent.count == 7 else { return .white }
        return Color(red: Double((value >> 16) & 255) / 255, green: Double((value >> 8) & 255) / 255,
                     blue: Double(value & 255) / 255)
    }

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = min(width * 187 / 480, geometry.size.height)
            let artWidth = height * 480 / 187
            ZStack(alignment: .trailing) {
                if let art {
                    Image(uiImage: art).resizable().accessibilityHidden(true)
                }
                if entry.skin == "alify-original" {
                    HStack {
                        Image(systemName: "music.note").font(.title2.bold()).foregroundStyle(.white)
                            .frame(width: artWidth * 0.34).accessibilityHidden(true)
                        Spacer(minLength: 0)
                    }
                }
                VStack(spacing: 3) {
                    Text(entry.title)
                        .font(.caption.bold())
                        .lineLimit(1)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                        .background(.black.opacity(0.85), in: RoundedRectangle(cornerRadius: 5))
                        .accessibilityLabel("Canción: \(entry.title)")
                    HStack(spacing: 4) {
                        key(.previous, "backward.end.fill", "Anterior")
                        key(.toggle, entry.playing ? "pause.fill" : "play.fill", entry.playing ? "Pausar" : "Reproducir")
                        key(.next, "forward.end.fill", "Siguiente")
                    }
                }
                .foregroundStyle(.white)
                .frame(width: artWidth * 0.57)
                .padding(.trailing, artWidth * 0.07)
            }
            .frame(width: artWidth, height: height)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .padding(6)
        .containerBackground(.black, for: .widget)
    }

    private func key(_ action: WidgetPlaybackAction, _ symbol: String, _ label: String) -> some View {
        Button(intent: WidgetPlaybackIntent(action)) {
            Image(systemName: symbol)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(tint)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(.black.opacity(0.78), in: RoundedRectangle(cornerRadius: 6).inset(by: 3))
        }
        .buttonStyle(.plain)
        .disabled(!entry.ready)
        .accessibilityLabel(Text(label))
    }
}

@main
struct AlifyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AlifyPlayer", provider: PlayerTimeline()) { PlayerWidgetView(entry: $0) }
            .configurationDisplayName("Alify")
            .description("Controla tu música local en la pantalla de inicio.")
            .supportedFamilies([.systemMedium])
            .contentMarginsDisabled()
    }
}
