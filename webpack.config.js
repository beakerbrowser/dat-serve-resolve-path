module.exports = {
  entry: './index.js',
  output: {
    libraryTarget: 'window',
    library: 'datServeResolvePath',
    path: __dirname,
    filename: 'dist.js'
  }
};