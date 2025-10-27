module.exports = {
  // ... other webpack configurations
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  ignoreWarnings: [/Failed to parse source map/],
}
