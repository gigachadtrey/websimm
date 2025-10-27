module.exports = {
  esbuild: {
    external: [
      "@smithery/sdk",
      "@smithery/sdk/server/stateful.js",
      "@smithery/sdk/server/stateless.js"
    ]
  }
};