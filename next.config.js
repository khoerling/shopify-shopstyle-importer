// next.config.js
const
  withCSS  = require('@zeit/next-css'),
  withSASS = require('@zeit/next-sass')

module.exports =
  withSASS(
    withCSS({
      target: 'serverless',
      cssLoaderOptions: {url: false}
    }))
