import AppIntents
import Foundation

enum WidgetPlaybackAction: String, AppEnum {
    case previous, toggle, next

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Control de reproducción")
    static let caseDisplayRepresentations: [Self: DisplayRepresentation] = [
        .previous: "Anterior", .toggle: "Reproducir o pausar", .next: "Siguiente"
    ]
}

struct WidgetPlaybackIntent: AudioPlaybackIntent {
    static let title: LocalizedStringResource = "Controlar Alify"

    @Parameter(title: "Acción") var action: WidgetPlaybackAction

    init() {}
    init(_ action: WidgetPlaybackAction) { self.action = action }

    @MainActor
    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set(action.rawValue, forKey: "ios.widget.pending")
        NotificationCenter.default.post(name: Notification.Name("AlifyWidgetPlayback"), object: nil)
        return .result()
    }
}
