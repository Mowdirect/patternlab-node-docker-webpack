// webpack.config.js
const webpack = require('webpack');
const { resolve } = require('path');
const globby = require('globby');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const EventHooksPlugin = require('event-hooks-webpack-plugin');
const Config = require('./patternlab-config.json');
const patternlab = require('@pattern-lab/core')(Config);
const patternEngines = require('@pattern-lab/core/src/lib/pattern_engines');
const merge = require('webpack-merge');
const customization = require(`${Config.paths.source.app}/webpack.app.js`);
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = env => {
  const { ifProduction, ifDevelopment } = getIfUtils(env);

  const config = merge.smartStrategy(Config.app.webpackMerge)(
    {
      devtool: ifDevelopment('source-map'),
      context: resolve(__dirname, Config.paths.source.root),
      node: {
        fs: 'empty'
      },
      entry: {
        // Gathers any Source JS files and creates a bundle
        //NOTE: This name can be changed, if so, make sure to update _meta/01-foot.mustache
        'js/pl-source': globby
          .sync([
            resolve(__dirname, `${Config.paths.source.js}**/*.js`),
            '!**/*.test.js'
          ])
          .map(function(filePath) {
            return filePath;
          })
      },
      output: {
        path: resolve(__dirname, Config.paths.public.root),
        filename: '[name].js'
      },
      optimization: {
        minimizer: [new UglifyJsPlugin(Config.app.uglify)],
        splitChunks: {
          cacheGroups: {
            vendor: {
              test: /node_modules/,
              chunks: 'initial',
              name: 'js/pl-source-vendor',
              priority: 10,
              enforce: true
            }
          }
        }
      },
      plugins: removeEmpty([
        ifDevelopment(
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NamedModulesPlugin()
        ),
        // Remove with PL Core 3.x
        new CopyWebpackPlugin([
          {
            // Copy all images from source to public
            context: resolve(Config.paths.source.images),
            from: './**/*.*',
            to: resolve(Config.paths.public.images)
          },
          {
            // Copy favicon from source to public
            context: resolve(Config.paths.source.root),
            from: './*.ico',
            to: resolve(Config.paths.public.root)
          },
          {
            // Copy all web fonts from source to public
            context: resolve(Config.paths.source.fonts),
            from: './*',
            to: resolve(Config.paths.public.fonts)
          },
          {
            // Copy all css from source to public
            context: resolve(Config.paths.source.css),
            from: './*.css',
            to: resolve(Config.paths.public.css)
          },
          {
            // Styleguide Copy everything but css
            context: resolve(Config.paths.source.styleguide),
            from: './**/*',
            to: resolve(Config.paths.public.root),
            ignore: ['*.css']
          },
          {
            // Styleguide Copy and flatten css
            context: resolve(Config.paths.source.styleguide),
            from: './**/*.css',
            to: resolve(Config.paths.public.styleguide, 'css'),
            flatten: true
          }
        ]),
        ifDevelopment(
          new EventHooksPlugin({
            afterEmit: function(compilation) {
              const supportedTemplateExtensions = patternEngines.getSupportedFileExtensions();
              const templateFilePaths = supportedTemplateExtensions.map(
                function(dotExtension) {
                  return `${Config.paths.source.patterns}**/*${dotExtension}`;
                }
              );

              // additional watch files
              const watchFiles = [
                `${Config.paths.source.patterns}**/*.(json|md|yaml|yml)`,
                `${Config.paths.source.data}**/*.(json|md|yaml|yml)`,
                `${Config.paths.source.fonts}**/*`,
                `${Config.paths.source.images}**/*`,
                `${Config.paths.source.meta}**/*`,
                `${Config.paths.source.annotations}**/*`
              ];

              const allWatchFiles = watchFiles.concat(templateFilePaths);

              allWatchFiles.forEach(function(globPath) {
                const patternFiles = globby
                  .sync(globPath)
                  .map(function(filePath) {
                    return resolve(__dirname, filePath);
                  });
                patternFiles.forEach(item => {
                  compilation.fileDependencies.add(item);
                });
              });
            }
          })
        ),
        new EventHooksPlugin({
          done: function(stats) {
            let cleanPublic = Config.cleanPublic;
            process.argv.forEach((val, index) => {
              if (val.includes('cleanPublic')) {
                val = val.split('=');
                cleanPublic = JSON.parse(val[1]);
              }
            });

            patternlab.build(() => {}, cleanPublic);
          }
        })
      ]),
      devServer: {
        contentBase: resolve(__dirname, Config.paths.public.root),
        publicPath: `${Config.app.webpackDevServer.url}:${Config.app.webpackDevServer.port}`,
        port: Config.app.webpackDevServer.port,
        open: true,
        hot: true,
        watchContentBase: Config.app.webpackDevServer.watchContentBase,
        watchOptions: Config.app.webpackDevServer.watchOptions
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  cacheDirectory: true
                }
              }
            ]
          }
        ]
      }
    },
    customization(env)
  );

  return config;
};
