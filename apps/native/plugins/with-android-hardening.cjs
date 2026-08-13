const fs = require("node:fs/promises");
const path = require("node:path");
const {
  withAndroidManifest,
  withAndroidStyles,
  withAppBuildGradle,
  withDangerousMod,
} = require("expo/config-plugins");

const BACKUP_DOMAINS = ["root", "file", "database", "sharedpref", "external", "device_root", "device_file", "device_database", "device_sharedpref"];

function exclusionRules(indent) {
  return BACKUP_DOMAINS.map((domain) => `${indent}<exclude domain="${domain}" path="."/>`).join("\n");
}

const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup disableIfNoEncryptionCapabilities="true">
${exclusionRules("    ")}
  </cloud-backup>
  <device-transfer>
${exclusionRules("    ")}
  </device-transfer>
</data-extraction-rules>
`;

const BACKUP_RULES = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
${exclusionRules("  ")}
</full-backup-content>
`;

function findGradleBlock(contents, name, from = 0, to = contents.length) {
  const pattern = new RegExp(`\\b${name}\\s*\\{`, "g");
  pattern.lastIndex = from;
  const match = pattern.exec(contents);
  if (!match || match.index >= to) return null;
  const openingBrace = contents.indexOf("{", match.index);
  let depth = 0;
  for (let index = openingBrace; index < to; index += 1) {
    if (contents[index] === "{") depth += 1;
    if (contents[index] === "}") depth -= 1;
    if (depth === 0) return { start: match.index, openingBrace, end: index + 1 };
  }
  return null;
}

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (androidConfig) => {
    let contents = androidConfig.modResults.contents;
    if (!contents.includes('exclude group: "com.revenuecat.purchases", module: "purchases-store-amazon"')) {
      const reactNativeDependency = /implementation\(["']com\.facebook\.react:react-android["']\)\r?\n/;
      if (!reactNativeDependency.test(contents)) throw new Error("Could not remove the Amazon billing backend.");
      contents = contents.replace(
        reactNativeDependency,
        (match) => `${match}    configurations.configureEach {
        exclude group: "com.revenuecat.purchases", module: "purchases-store-amazon"
    }
`,
      );
    }

    if (!contents.includes("def releaseStoreFilePath =")) {
      const projectRoot = /def projectRoot = .*\r?\n/;
      if (!projectRoot.test(contents)) throw new Error("Could not add Berkas release signing variables.");
      contents = contents.replace(projectRoot, (match) => `${match}def releaseStoreFilePath = System.getenv("BERKAS_RELEASE_STORE_FILE")
def releaseStorePassword = System.getenv("BERKAS_RELEASE_STORE_PASSWORD")
def releaseKeyAlias = System.getenv("BERKAS_RELEASE_KEY_ALIAS")
def releaseKeyPassword = System.getenv("BERKAS_RELEASE_KEY_PASSWORD")
def releaseSigningValues = [releaseStoreFilePath, releaseStorePassword, releaseKeyAlias, releaseKeyPassword]
def releaseTaskRequested = gradle.startParameter.taskNames.any { it.toLowerCase().contains("release") }
def easBuild = System.getenv("EAS_BUILD") in ["1", "true"]

if (releaseTaskRequested && !easBuild && releaseSigningValues.any { !it }) {
    throw new GradleException("Release signing requires BERKAS_RELEASE_STORE_FILE, BERKAS_RELEASE_STORE_PASSWORD, BERKAS_RELEASE_KEY_ALIAS, and BERKAS_RELEASE_KEY_PASSWORD.")
}

`);
    }

    let signingConfigs = findGradleBlock(contents, "signingConfigs");
    if (!signingConfigs) throw new Error("Could not find Android signing configs.");
    if (!findGradleBlock(contents, "release", signingConfigs.openingBrace + 1, signingConfigs.end)) {
      const closingLineStart = contents.lastIndexOf("\n", signingConfigs.end - 1) + 1;
      const releaseSigning = `        release {
            if (releaseSigningValues.every { it }) {
                storeFile file(releaseStoreFilePath)
                storePassword releaseStorePassword
                keyAlias releaseKeyAlias
                keyPassword releaseKeyPassword
            }
        }
`;
      contents = contents.slice(0, closingLineStart) + releaseSigning + contents.slice(closingLineStart);
    }

    const buildTypes = findGradleBlock(contents, "buildTypes");
    const releaseBuild = buildTypes && findGradleBlock(
      contents,
      "release",
      buildTypes.openingBrace + 1,
      buildTypes.end,
    );
    if (!releaseBuild) throw new Error("Could not find the Android release build type.");
    const releaseContents = contents.slice(releaseBuild.start, releaseBuild.end).replace(
      "signingConfig signingConfigs.debug",
      "signingConfig signingConfigs.release",
    );
    if (!releaseContents.includes("signingConfig signingConfigs.release")) {
      throw new Error("Could not enforce the Berkas release signing config.");
    }
    contents = contents.slice(0, releaseBuild.start) + releaseContents + contents.slice(releaseBuild.end);

    androidConfig.modResults.contents = contents;
    return androidConfig;
  });
}

function withBackupRules(config) {
  return withDangerousMod(config, ["android", async (androidConfig) => {
    const xmlDirectory = path.join(androidConfig.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
    await fs.mkdir(xmlDirectory, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(xmlDirectory, "data_extraction_rules.xml"), DATA_EXTRACTION_RULES),
      fs.writeFile(path.join(xmlDirectory, "backup_rules.xml"), BACKUP_RULES),
    ]);
    return androidConfig;
  }]);
}

module.exports = function withAndroidHardening(config) {
  config = withReleaseSigning(config);
  config = withBackupRules(config);
  config = withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    const application = manifest.application?.[0];
    const activities = application?.activity ?? [];
    const mainActivity = activities.find((activity) =>
      activity["intent-filter"]?.some((filter) =>
        filter.action?.some((action) => action.$["android:name"] === "android.intent.action.MAIN"),
      ),
    );

    if (application?.$) {
      application.$["android:allowBackup"] = "false";
      application.$["android:dataExtractionRules"] = "@xml/data_extraction_rules";
      application.$["android:fullBackupContent"] = "@xml/backup_rules";
      application.$["android:usesCleartextTraffic"] = "false";
    }

    if (mainActivity?.$) {
      mainActivity.$["android:resizeableActivity"] = "true";
      mainActivity.$["android:launchMode"] = "singleTop";
      mainActivity.$["android:windowSoftInputMode"] = "adjustResize";
      mainActivity["intent-filter"] = mainActivity["intent-filter"]?.filter((filter) =>
        filter.action?.some((action) => action.$["android:name"] === "android.intent.action.MAIN"),
      );
    }

    const features = manifest["uses-feature"] ?? [];
    const optionalCameraFeatures = ["android.hardware.camera", "android.hardware.camera.any"];
    for (const name of optionalCameraFeatures) {
      const feature = features.find((item) => item.$["android:name"] === name);
      if (feature) {
        feature.$["android:required"] = "false";
      } else {
        features.push({ $: { "android:name": name, "android:required": "false" } });
      }
    }
    manifest["uses-feature"] = features;

    return androidConfig;
  });

  return withAndroidStyles(config, (androidConfig) => {
    const styles = androidConfig.modResults.resources.style ?? [];
    const splashStyle = styles.find((style) => style.$.name === "Theme.App.SplashScreen");
    const splashIcon = splashStyle?.item?.find(
      (item) => item.$.name === "windowSplashScreenAnimatedIcon",
    );
    if (splashIcon) splashIcon._ = "@android:color/transparent";
    return androidConfig;
  });
};
