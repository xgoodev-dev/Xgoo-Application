const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

/**
 * Preview/debug APKs talk to the local XGoo server over HTTP.
 * Android 9+ blocks that unless the release network security config allows it.
 */
function withCleartextTraffic(config) {
  config = withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const dir = path.join(
        modConfig.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "network_security_config.xml"), NETWORK_SECURITY_CONFIG);
      return modConfig;
    },
  ]);

  return withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    application.$["android:usesCleartextTraffic"] = "true";
    application.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return modConfig;
  });
}

module.exports = withCleartextTraffic;
