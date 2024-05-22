import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.topocart.siga.mobile",
  appName: "siga-mobile",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  loggingBehavior: "none",
};

export default config;
