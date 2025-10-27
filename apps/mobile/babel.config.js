module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.json'],
          root: ['./src'],
          alias: {
            '@api': './src/api',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
            '@theme': './src/theme'
          }
        }
      ]
    ]
  };
};
