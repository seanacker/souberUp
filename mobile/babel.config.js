module.exports = {
    presets: ['babel-preset-expo'], // or 'module:metro-react-native-babel-preset' if not using Expo
    plugins: [
      'react-native-reanimated/plugin', // MUST be last
    ],
  };