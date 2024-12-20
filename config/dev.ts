import type { UserConfigExport } from '@tarojs/cli'

export default {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {},
  h5: {
    // output: {
    //   filename: 'js/[name].js', // No hash in development
    //   chunkFilename: 'js/[name].js', // No hash in development
    // },
    // miniCssExtractPluginOption: {
    //   filename: 'css/[name].css', // No hash in development
    //   chunkFilename: 'css/[name].css', // No hash in development
    // },
  },
} satisfies UserConfigExport<'webpack5'>
