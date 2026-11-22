// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "alify",
    platforms: [.iOS(.v15)],
    products: [.library(name: "alify", type: .static, targets: ["AlifyDeviceAudio"])],
    dependencies: [.package(name: "Tauri", path: "../.tauri/tauri-api")],
    targets: [.target(name: "AlifyDeviceAudio", dependencies: ["Tauri"], path: "Sources")]
)
