const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withGalaxyOptimizations(config) {
  return withAndroidManifest(config, (androidConfig) => {
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
      application.$["android:usesCleartextTraffic"] = "false";
    }

    if (mainActivity?.$) {
      mainActivity.$["android:resizeableActivity"] = "true";
      mainActivity.$["android:launchMode"] = "singleTop";
      mainActivity.$["android:windowSoftInputMode"] = "adjustResize";
    }

    const features = manifest["uses-feature"] ?? [];
    if (!features.some((feature) => feature.$["android:name"] === "android.hardware.camera.any")) {
      features.push({
        $: {
          "android:name": "android.hardware.camera.any",
          "android:required": "false",
        },
      });
    }
    manifest["uses-feature"] = features;

    return androidConfig;
  });
};
