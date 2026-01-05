const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    // Исключаем node_modules из сборки
    externals: [
      nodeExternals({
        modulesDir: path.resolve(__dirname, '../../node_modules'),
      }),
    ],
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
      buildDependencies: {
        config: [__filename],
      },
      // Максимизируем эффективность кэша
      compression: 'gzip',
      hashAlgorithm: 'md4',
      name: 'api-build-cache',
      version: '1.0.0',
    },
    optimization: {
      ...options.optimization,
      // Включаем модульное кэширование
      moduleIds: 'deterministic',
      runtimeChunk: false,
      // Улучшаем производительность сборки
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    },
    snapshot: {
      // Настраиваем стратегию отслеживания изменений
      managedPaths: [path.resolve(__dirname, '../../node_modules')],
      immutablePaths: [],
      buildDependencies: {
        timestamp: true,
        hash: true,
      },
      module: {
        timestamp: true,
        hash: true,
      },
      resolve: {
        timestamp: true,
        hash: true,
      },
      resolveBuildDependencies: {
        timestamp: true,
        hash: true,
      },
    },
  };
};
