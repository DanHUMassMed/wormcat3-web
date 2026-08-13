module.exports = {
  devServer: (devServerConfig) => {
    // Disable watching the public/ directory to prevent live-reloading on runtime file generation
    if (devServerConfig.static && typeof devServerConfig.static === 'object') {
      devServerConfig.static.watch = false;
    }
    return devServerConfig;
  },
};
