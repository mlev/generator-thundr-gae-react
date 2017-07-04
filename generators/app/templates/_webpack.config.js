const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const parseString = require('xml2js').parseString;

const sourceDir = path.resolve(__dirname, 'src/main/static');

const targetDir = (function getTargetDir() {
  const pomXml = fs.readFileSync('pom.xml', 'utf8');

  let artifactId;
  let version;
  parseString(pomXml, (err, result) => {
    artifactId = result.project.artifactId[0];
    version = result.project.version[0];
  });

  return path.resolve(__dirname, `target/${artifactId}-${version}`);
}());


/**
 * Common Webpack configuration.
 */
const commonConfig = {
  output: {
    filename: '[name].js',
    path: `${targetDir}/static`,
    publicPath: '/static/',
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'inline-source-map',

  resolve: {
    extensions: ['.webpack.js', '.web.js', '.js', '.jsx'],
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks(module) {
        // this assumes your vendor imports exist in the node_modules directory
        return module.context && module.context.indexOf('node_modules') !== -1;
      },
    }),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest', // But since there are no more common modules between them we end up with just the runtime code included in the manifest file
    }),

    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      },
      DEVELOPMENT: process.env.NODE_ENV !== 'production',
    }),

    new FaviconsWebpackPlugin({
      // The source icon
      logo: path.resolve(sourceDir, 'images/favicon/original.png'),

      // The prefix for all image files (might be a folder or a name)
      prefix: 'images/favicon-[hash]/',

      // Generate a cache file with control hashes and
      // don't rebuild the favicons until those hashes change
      persistentCache: true,

      // Inject the html into the html-webpack-plugin
      inject: true,
    }),

    // Automatically generates index.html
    new HtmlWebpackPlugin({
      title: '<%= project %>',

      template: path.resolve(sourceDir, 'index.ejs'),

      filename: `${targetDir}/index.html`,

      alwaysWriteToDisk: true,
    }),

    // Support for alwaysWriteToDisk config in HtmlWebpackPlugin
    new HtmlWebpackHarddiskPlugin(),
  ],

  module: {
    rules: [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        use: [
          { loader: 'eslint-loader', options: { emitWarning: true } },
          'source-map-loader',
        ],
      },

      // Load library CSS styles
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { sourceMap: true } },
        ],
        include: /node_modules/,
      },

      // Load Less files
      {
        test: /\.less$/,
        include: [
          path.resolve(sourceDir, 'less'),
        ],
        use: [
          'style-loader',
          { loader: 'css-loader', options: { sourceMap: true, importLoaders: 1 } },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              plugins() {
                return [require('autoprefixer')];  // eslint-disable-line global-require
              },
            },
          },
          { loader: 'less-loader', options: { sourceMap: true } },
        ],
      },

      // Image loading. Inlines small images as data URIs (i.e. < 10k).
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        loader: 'url-loader',
        options: {
          name: 'images/[name].[hash].[ext]',
          limit: 10000,
        },
      },

      // Inline small woff files and output them at fonts/.
      {
        test: /\.woff2?$/,
        loader: 'url-loader',
        options: {
          name: 'fonts/[hash].[ext]',
          limit: 50000,
          mimetype: 'application/font-woff',
        },
      },

      // Load other font file types at fonts/
      {
        test: /\.(ttf|svg|eot)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[hash].[ext]',
        },
      },
    ],
  },
};


/**
 * Development server configuration overrides.
 */
const developmentConfig = {
  entry: [
    'react-hot-loader/patch', // activate HMR for React

    'webpack-dev-server/client?http://localhost:3000',  // bundle the client for webpack-dev-serve

    'webpack/hot/only-dev-server', // bundle the client for hot reloading

    './src/main/static/javascript/index.jsx',
  ],

  plugins: [
    // Enable HMR globally
    new webpack.HotModuleReplacementPlugin(),

    // Prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin(),
  ],

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: path.resolve(sourceDir, 'javascript'),
        use: [
          'react-hot-loader/webpack',  // Enable HMR support in loader chain
          'babel-loader',
        ],
      },
    ],
  },

  devServer: {
    port: 3000,
    contentBase: targetDir,
    hot: true,
    historyApiFallback: true,
    proxy: {
      '/_ah': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
      '/system': 'http://localhost:8080',
    },
    overlay: {
      errors: true,
      warnings: false,
    },
  },
};


/**
 * Production/deployment configuration overrides.
 */
const productionConfig = {
  entry: [
    './src/main/static/javascript/index.jsx',
  ],

  output: {
    // Hash bundles for easy and agressive caching
    filename: '[name].[hash].js',
  },

  plugins: [
    // Ensure old builds are cleaned out
    new CleanWebpackPlugin([
      path.join(targetDir, 'static'),
    ]),

    // Minify JS in non-development environments
    new webpack.optimize.UglifyJsPlugin(),
  ],

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: path.resolve(sourceDir, 'javascript'),
        use: [
          'babel-loader',
        ],
      },
    ],
  },
};

// Grab the appropriate configuration for the environment
const environmentConfig = process.env.NODE_ENV === 'production'
  ? productionConfig
  : developmentConfig;

// Merge common config with environment specific configuration
module.exports = merge(commonConfig, environmentConfig);
