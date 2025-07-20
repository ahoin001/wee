const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      'public/sounds'
    ],
    ignore: [
      /^\/public\/sounds\/.*\.md$/  // Ignore README files
    ],
    afterCopy: [
      (buildPath, electronVersion, platform, arch) => {
        console.log('Copying sounds to build directory...');
        const fs = require('fs-extra');
        const path = require('path');
        
        // Copy sounds to the resources directory
        const sourceSoundsPath = path.join(__dirname, 'public', 'sounds');
        const targetSoundsPath = path.join(buildPath, 'resources', 'public', 'sounds');
        
        try {
          fs.ensureDirSync(path.dirname(targetSoundsPath));
          fs.copySync(sourceSoundsPath, targetSoundsPath);
          console.log(`Sounds copied to: ${targetSoundsPath}`);
        } catch (error) {
          console.error('Failed to copy sounds:', error);
        }
      }
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ahoin001',
          name: 'WiiDesktopLauncher'
        },
        prerelease: false,
        draft: false
      }
    }
  ],
};
