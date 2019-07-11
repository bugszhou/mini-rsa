/**
 * mgf1 padding
 */
const createHash = require('create-hash'),
  randomBytes = require('./randomBytes'),
  mgfFn = require('./mgf'),
  xor = require('./xor');

function getHashLength(hash = 'sha256') {
  hash = hash.toLowerCase();
  let len = 0;
  switch (hash) {
    case 'md5-96':
    case 'sha1-96':
    case 'sha256-96':
    case 'sha512-96':
      hash = hash.substr(0, -3);
      len = 12; // 96 / 8 = 12
      break;
    case 'md2':
    case 'md5':
      len = 16;
      break;
    case 'sha1':
      len = 20;
      break;
    case 'sha256':
      len = 32;
      break;
    case 'sha384':
      len = 48;
      break;
    case 'sha512':
      len = 64;
  }
  return len;
}

module.exports = function({data = '', mgf = 'sha1', pad1 = '', hash = 'sha256', encryptedDataLength = 256} = {}) {
  const _pad1 = createHash(hash).update(pad1, 'utf8').digest(),
    hlen = getHashLength(hash);
  let filled = Buffer.alloc(encryptedDataLength - data.length - (2 * hlen) - 2);
  let rand = randomBytes(32);
  for (var i = 0; i < rand.length; i++) {
    var r = rand[i];
    while (r === 0) { // non-zero only
      r = randomBytes(1)[0];
    }
    rand[i] = r;
  }
  let $db = Buffer.concat([_pad1, filled, Buffer.from(String.fromCharCode(1)), data]);
  let $dbMask = mgfFn(rand, encryptedDataLength - hlen - 1, mgf);
  let $maskedDB = xor($db, $dbMask);
  let $seedMask = mgfFn($maskedDB, hlen, mgf);
  let $maskedSeed = xor(rand, $seedMask);
  let $em = Buffer.concat([Buffer.from(String.fromCharCode(0)), $maskedSeed, $maskedDB]);

  return $em;
}

