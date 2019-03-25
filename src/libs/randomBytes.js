/**
 * 获取随机字节
 * @param size
 * @param cb
 * @returns {*}
 */

module.exports = function randomBytes(size, cb) {
// limit of Crypto.getRandomValues()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
  var MAX_BYTES = 65536

// Node supports requesting up to this number of bytes
// https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48
  var MAX_UINT32 = 4294967295
  // phantomjs needs to throw
  if (size > MAX_UINT32) throw new RangeError('requested too many random bytes')

  var bytes = Buffer.allocUnsafe(size)

  if (size > 0) {  // getRandomValues fails on IE if size == 0
    if (size > MAX_BYTES) { // this is the max bytes crypto.getRandomValues
      // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
      for (var generated = 0; generated < size; generated += MAX_BYTES) {
        // buffer.slice automatically checks if the end is past the end of
        // the buffer so we don't have to here
        getRandomValues(bytes.slice(generated, generated + MAX_BYTES))
      }
    } else {
      getRandomValues(bytes)
    }
  }
  return bytes;
}

function getRandomValues(ar) {
  for (var i = 0; i < ar.length; i++) {
    ar[i] = Math.floor(256 * Math.random());
  }
}
