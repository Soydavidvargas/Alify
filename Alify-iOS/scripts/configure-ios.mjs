import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { parse, stringify } from "yaml";

const root = resolve(import.meta.dirname, "../src-tauri/gen/apple");
const spec = resolve(root, "project.yml");
const project = parse(readFileSync(spec, "utf8"));
const { version, bundle } = JSON.parse(readFileSync(resolve(root, "../../tauri.ios.conf.json"), "utf8"));
const app = Object.values(project.targets).find(target =>
  target.type === "application" || target.templates?.includes("app"));
if (!app) throw new Error("No se encontró el target de aplicación generado por Tauri.");

const group = "group.app.alify.player";
const groupEntitlement = { "com.apple.security.application-groups": [group] };
const intent = { path: "../../ios/Widget/WidgetPlaybackIntent.swift" };

app.sources = [...(app.sources || []), ...((app.sources || []).some(source => source.path === intent.path) ? [] : [intent])];
app.dependencies = [...(app.dependencies || []).filter(dependency => dependency.target !== "AlifyWidget"),
  { target: "AlifyWidget", embed: true, codeSign: true }];

const appTemplate = project.targetTemplates?.app;
app.settings ??= {};
app.settings.base = { ...app.settings.base, ENABLE_USER_SCRIPT_SANDBOXING: false };
if (process.env.APPLE_DEVELOPMENT_TEAM) app.settings.base.DEVELOPMENT_TEAM = process.env.APPLE_DEVELOPMENT_TEAM;

const appInfo = app.info ?? appTemplate?.info;
if (!appInfo) throw new Error("No se encontró el Info.plist generado por Tauri.");
appInfo.properties = { ...appInfo.properties, UIBackgroundModes: ["audio"], AlifyAppGroup: group };

const appEntitlements = app.entitlements ?? appTemplate?.entitlements ?? { path: "Alify.entitlements" };
appEntitlements.properties = { ...appEntitlements.properties, ...groupEntitlement };
app.entitlements = appEntitlements;

project.targets.AlifyWidget = {
  type: "app-extension",
  platform: "iOS",
  deploymentTarget: "17.0",
  sources: [
    intent,
    { path: "../../ios/Widget/AlifyWidget.swift" },
    { path: "../../ios/Widget/Skins", type: "folder", buildPhase: "resources" },
  ],
  info: {
    path: "AlifyWidget-Info.plist",
    properties: {
      CFBundleDisplayName: "Alify",
      CFBundleShortVersionString: "$(MARKETING_VERSION)",
      CFBundleVersion: "$(CURRENT_PROJECT_VERSION)",
      NSExtension: { NSExtensionPointIdentifier: "com.apple.widgetkit-extension" },
      AlifyAppGroup: group,
    },
  },
  entitlements: { path: "AlifyWidget.entitlements", properties: groupEntitlement },
  settings: {
    base: {
      PRODUCT_BUNDLE_IDENTIFIER: "app.alify.player.widget",
      MARKETING_VERSION: version,
      CURRENT_PROJECT_VERSION: bundle.iOS.bundleVersion,
      CODE_SIGN_STYLE: "Automatic",
      SWIFT_VERSION: "5.0",
      SKIP_INSTALL: true,
      APPLICATION_EXTENSION_API_ONLY: true,
      ...(process.env.APPLE_DEVELOPMENT_TEAM ? { DEVELOPMENT_TEAM: process.env.APPLE_DEVELOPMENT_TEAM } : {}),
    },
  },
};

writeFileSync(spec, stringify(project));
const result = spawnSync("xcodegen", ["generate", "--spec", "project.yml"], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
