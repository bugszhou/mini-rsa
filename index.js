if (process.env.NODE_ENV === 'development') {
  module.exports = require('./dist/mini-rsa.js')
} else {
  module.exports = require('./dist/mini-rsa.common.js')
}
