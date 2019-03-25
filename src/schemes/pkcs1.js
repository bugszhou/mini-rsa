/**
 * PKCS1 padding and signature scheme
 */

var BigInteger = require('../libs/jsbn');
var crypt = require('crypto');
var constants = require('constants');
var SIGN_INFO_HEAD = {
  md2: Buffer.from('3020300c06082a864886f70d020205000410', 'hex'),
  md5: Buffer.from('3020300c06082a864886f70d020505000410', 'hex'),
  sha1: Buffer.from('3021300906052b0e03021a05000414', 'hex'),
  sha224: Buffer.from('302d300d06096086480165030402040500041c', 'hex'),
  sha256: Buffer.from('3031300d060960864801650304020105000420', 'hex'),
  sha384: Buffer.from('3041300d060960864801650304020205000430', 'hex'),
  sha512: Buffer.from('3051300d060960864801650304020305000440', 'hex'),
  ripemd160: Buffer.from('3021300906052b2403020105000414', 'hex'),
  rmd160: Buffer.from('3021300906052b2403020105000414', 'hex')
};

var SIGN_ALG_TO_HASH_ALIASES = {
  'ripemd160': 'rmd160'
};

var DEFAULT_HASH_FUNCTION = 'sha256';

module.exports = {
  isEncryption: true,
  isSignature: true
};

module.exports.makeScheme = function(key, options) {
  function Scheme(key, options) {
    this.key = key;
    this.options = options;
  }

  Scheme.prototype.maxMessageLength = function() {
    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      return this.key.encryptedDataLength;
    }
    return this.key.encryptedDataLength - 11;
  };

  /**
   * Pad input Buffer to encryptedDataLength bytes, and return Buffer.from
   * alg: PKCS#1
   * @param buffer
   * @returns {Buffer}
   */
  Scheme.prototype.encPad = function(buffer, options) {
    options = options || {};
    var filled;
    if (buffer.length > this.key.maxMessageLength) {
      throw new Error("Message too long for RSA (n=" + this.key.encryptedDataLength + ", l=" + buffer.length + ")");
    }
    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      //RSA_NO_PADDING treated like JAVA left pad with zero character
      filled = Buffer.alloc(this.key.maxMessageLength - buffer.length);
      filled.fill(0);
      return Buffer.concat([filled, buffer]);
    }

    /* Type 1: zeros padding for private key encrypt */
    if (options.type === 1) {
      filled = Buffer.alloc(this.key.encryptedDataLength - buffer.length - 1);
      filled.fill(0xff, 0, filled.length - 1);
      filled[0] = 1;
      filled[filled.length - 1] = 0;

      return Buffer.concat([filled, buffer]);
    } else {
      const $lHash = crypt.createHash('sha256').update('', 'utf8').digest();
      /* random padding for public key encrypt */
      filled = Buffer.alloc(this.key.encryptedDataLength - buffer.length - (2 * 32) - 2);
      var rand = this.randomBytes(32);
      for (var i = 0; i < rand.length; i++) {
        var r = rand[i];
        while (r === 0) { // non-zero only
          r = this.randomBytes(1)[0];
        }
        rand[i] = r;
      }
      let $db = Buffer.concat([$lHash, filled, Buffer.from(String.fromCharCode(1)), buffer]);
      let $dbMask = this._mgf1(rand, this.key.encryptedDataLength - 32 - 1);
      let $maskedDB = Buffer.from(this.binToHex(this.yihuo(this.hexToBin($db.toString('hex')), this.hexToBin($dbMask.toString('hex')))), 'hex');
      let $seedMask = this._mgf1($maskedDB, 32);
      let $maskedSeed = Buffer.from(this.binToHex(this.yihuo(this.hexToBin(rand.toString('hex')), this.hexToBin($seedMask.toString('hex')))), 'hex');
      let $em = Buffer.concat([Buffer.from(String.fromCharCode(0)), $maskedSeed, $maskedDB]);

      return $em;
    }
  };

  Scheme.prototype.yihuo = function (bin1, bin2) {
    return bin1.split('').map((bit, i) => {
      if (bit !== bin2[i]) {
        return 1;
      }
      return 0;
    }).join('');
  };

  Scheme.prototype.hexToBin = function (str) {
    let hex_array = [{key:0,val:"0000"},{key:1,val:"0001"},{key:2,val:"0010"},{key:3,val:"0011"},{key:4,val:"0100"},{key:5,val:"0101"},{key:6,val:"0110"},{key:7,val:"0111"},
      {key:8,val:"1000"},{key:9,val:"1001"},{key:'a',val:"1010"},{key:'b',val:"1011"},{key:'c',val:"1100"},{key:'d',val:"1101"},{key:'e',val:"1110"},{key:'f',val:"1111"}]

    let value=""
    for(let i=0;i<str.length;i++){
      for(let j=0;j<hex_array.length;j++){
        if(str.charAt(i)== hex_array[j].key){
          value = value.concat(hex_array[j].val)
          break;
        }
      }
    }
    return value;
  };


  Scheme.prototype.binToHex = function (str) {
    let hex_array = [{key:0,val:"0000"},{key:1,val:"0001"},{key:2,val:"0010"},{key:3,val:"0011"},{key:4,val:"0100"},{key:5,val:"0101"},{key:6,val:"0110"},{key:7,val:"0111"},
      {key:8,val:"1000"},{key:9,val:"1001"},{key:'a',val:"1010"},{key:'b',val:"1011"},{key:'c',val:"1100"},{key:'d',val:"1101"},{key:'e',val:"1110"},{key:'f',val:"1111"}]
    let value = ''
    let list=[]
    if(str.length%4!==0){
      let a = "0000"
      let b=a.substring(0,4-str.length%4)
      str = b.concat(str)
    }
    while (str.length > 4) {
      list.push(str.substring(0, 4))
      str = str.substring(4);
    }
    list.push(str)
    for(let i=0;i<list.length;i++){
      for(let j=0;j<hex_array.length;j++){
        if(list[i]==hex_array[j].val){
          value = value.concat(hex_array[j].key)
          break
        }
      }
    }
    return value
  };

  Scheme.prototype._mgf1 = function($mgfSeed, $maskLen) {
    const mgfHLen = 20;
    const crypto = require('crypto');
    let $t = [];
    const $count = Math.ceil($maskLen / mgfHLen);
    for (let $i = 0; $i < $count; $i++) {
      let $c = this.unsignedLongBuffer($i);
      $t.push(crypto.createHash('sha1').update(Buffer.concat([$mgfSeed, $c]), 'hex').digest());
    }
    $t = Buffer.alloc($maskLen, Buffer.concat($t));
    return $t;
  };

  Scheme.prototype.unsignedLongBuffer = function(num) {
    let json = [0, 0, 0];
    json.push(num);
    const jsonStr = JSON.stringify({
      type: 'Buffer',
      data: json
    });
    const longBuffer = JSON.parse(jsonStr, (key, value) => {
      return value && value.type === 'Buffer' ?
        Buffer.from(value.data) :
        value;
    });
    return longBuffer;
  }

  Scheme.prototype.randomBytes = function(size, cb) {
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
          this.getRandomValues(bytes.slice(generated, generated + MAX_BYTES))
        }
      } else {
        this.getRandomValues(bytes)
      }
    }
    return bytes;
  }
  Scheme.prototype.getRandomValues = function (ar) {
    for (var i = 0; i < ar.length; i++) {
      ar[i] = Math.floor(256 * Math.random());
    }
  }
  /**
   * Unpad input Buffer and, if valid, return the Buffer object
   * alg: PKCS#1 (type 2, random)
   * @param buffer
   * @returns {Buffer}
   */
  Scheme.prototype.encUnPad = function(buffer, options) {
    options = options || {};
    var i = 0;

    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      //RSA_NO_PADDING treated like JAVA left pad with zero character
      var unPad;
      if (typeof buffer.lastIndexOf == "function") { //patch for old node version
        unPad = buffer.slice(buffer.lastIndexOf('\0') + 1, buffer.length);
      } else {
        unPad = buffer.slice(String.prototype.lastIndexOf.call(buffer, '\0') + 1, buffer.length);
      }
      return unPad;
    }

    if (buffer.length < 4) {
      return null;
    }

    /* Type 1: zeros padding for private key decrypt */
    if (options.type === 1) {
      if (buffer[0] !== 0 && buffer[1] !== 1) {
        return null;
      }
      i = 3;
      while (buffer[i] !== 0) {
        if (buffer[i] != 0xFF || ++i >= buffer.length) {
          return null;
        }
      }
    } else {
      /* random padding for public key decrypt */
      if (buffer[0] !== 0 && buffer[1] !== 2) {
        return null;
      }
      i = 3;
      while (buffer[i] !== 0) {
        if (++i >= buffer.length) {
          return null;
        }
      }
    }
    return buffer.slice(i + 1, buffer.length);
  };

  Scheme.prototype.sign = function(buffer) {
    var hashAlgorithm = this.options.signingSchemeOptions.hash || DEFAULT_HASH_FUNCTION;
    if (this.options.environment === 'browser') {
      hashAlgorithm = SIGN_ALG_TO_HASH_ALIASES[hashAlgorithm] || hashAlgorithm;

      var hasher = crypt.createHash(hashAlgorithm);
      hasher.update(buffer);
      var hash = this.pkcs1pad(hasher.digest(), hashAlgorithm);
      var res = this.key.$doPrivate(new BigInteger(hash)).toBuffer(this.key.encryptedDataLength);

      return res;
    } else {
      var signer = crypt.createSign('RSA-' + hashAlgorithm.toUpperCase());
      signer.update(buffer);
      return signer.sign(this.options.rsaUtils.exportKey('private'));
    }
  };

  Scheme.prototype.verify = function(buffer, signature, signature_encoding) {
    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      //RSA_NO_PADDING has no verify data
      return false;
    }
    var hashAlgorithm = this.options.signingSchemeOptions.hash || DEFAULT_HASH_FUNCTION;
    if (this.options.environment === 'browser') {
      hashAlgorithm = SIGN_ALG_TO_HASH_ALIASES[hashAlgorithm] || hashAlgorithm;

      if (signature_encoding) {
        signature = Buffer.from(signature, signature_encoding);
      }

      var hasher = crypt.createHash(hashAlgorithm);
      hasher.update(buffer);
      var hash = this.pkcs1pad(hasher.digest(), hashAlgorithm);
      var m = this.key.$doPublic(new BigInteger(signature));

      return m.toBuffer().toString('hex') == hash.toString('hex');
    } else {
      var verifier = crypt.createVerify('RSA-' + hashAlgorithm.toUpperCase());
      verifier.update(buffer);
      return verifier.verify(this.options.rsaUtils.exportKey('public'), signature, signature_encoding);
    }
  };

  /**
   * PKCS#1 zero pad input buffer to max data length
   * @param hashBuf
   * @param hashAlgorithm
   * @returns {*}
   */
  Scheme.prototype.pkcs0pad = function(buffer) {
    var filled = Buffer.alloc(this.key.maxMessageLength - buffer.length);
    filled.fill(0);
    return Buffer.concat([filled, buffer]);
  };

  Scheme.prototype.pkcs0unpad = function(buffer) {
    var unPad;
    if (typeof buffer.lastIndexOf == "function") { //patch for old node version
      unPad = buffer.slice(buffer.lastIndexOf('\0') + 1, buffer.length);
    } else {
      unPad = buffer.slice(String.prototype.lastIndexOf.call(buffer, '\0') + 1, buffer.length);
    }

    return unPad;
  };

  /**
   * PKCS#1 pad input buffer to max data length
   * @param hashBuf
   * @param hashAlgorithm
   * @returns {*}
   */
  Scheme.prototype.pkcs1pad = function(hashBuf, hashAlgorithm) {
    var digest = SIGN_INFO_HEAD[hashAlgorithm];
    if (!digest) {
      throw Error('Unsupported hash algorithm');
    }

    var data = Buffer.concat([digest, hashBuf]);

    if (data.length + 10 > this.key.encryptedDataLength) {
      throw Error('Key is too short for signing algorithm (' + hashAlgorithm + ')');
    }

    var filled = Buffer.alloc(this.key.encryptedDataLength - data.length - 1);
    filled.fill(0xff, 0, filled.length - 1);
    filled[0] = 1;
    filled[filled.length - 1] = 0;

    var res = Buffer.concat([filled, data]);

    return res;
  };

  return new Scheme(key, options);
};


