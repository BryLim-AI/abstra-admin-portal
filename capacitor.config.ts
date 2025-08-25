import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hestia360.app',
  appName: 'Hestia Rent360',
  webDir: 'public',
  server: {
    url: 'https://rent-alley-web.vercel.app/',
  }
};

export default config;
