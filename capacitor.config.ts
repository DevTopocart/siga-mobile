import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.topocart.app.cadastro",
  appName: "siga-mobile",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  loggingBehavior: "none",
};

export default config;
