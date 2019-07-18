(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, (function () {
		var current = global['mini-rsa'];
		var exports = global['mini-rsa'] = factory();
		exports.noConflict = function () { global['mini-rsa'] = current; return exports; };
	}()));
}(this, function () { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var _core = createCommonjsModule(function (module) {
	var core = module.exports = { version: '2.6.9' };
	if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
	});
	var _core_1 = _core.version;

	var $JSON = _core.JSON || (_core.JSON = { stringify: JSON.stringify });
	var stringify = function stringify(it) { // eslint-disable-line no-unused-vars
	  return $JSON.stringify.apply($JSON, arguments);
	};

	var stringify$1 = stringify;

	var global$1 = (typeof global !== "undefined" ? global :
	            typeof self !== "undefined" ? self :
	            typeof window !== "undefined" ? window : {});

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
	var inited = false;
	function init () {
	  inited = true;
	  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	  for (var i = 0, len = code.length; i < len; ++i) {
	    lookup[i] = code[i];
	    revLookup[code.charCodeAt(i)] = i;
	  }

	  revLookup['-'.charCodeAt(0)] = 62;
	  revLookup['_'.charCodeAt(0)] = 63;
	}

	function toByteArray (b64) {
	  if (!inited) {
	    init();
	  }
	  var i, j, l, tmp, placeHolders, arr;
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

	  // base64 is 4/3 + up to two characters of the original data
	  arr = new Arr(len * 3 / 4 - placeHolders);

	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len;

	  var L = 0;

	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
	    arr[L++] = (tmp >> 16) & 0xFF;
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[L++] = tmp & 0xFF;
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  if (!inited) {
	    init();
	  }
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var output = '';
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    output += lookup[tmp >> 2];
	    output += lookup[(tmp << 4) & 0x3F];
	    output += '==';
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
	    output += lookup[tmp >> 10];
	    output += lookup[(tmp >> 4) & 0x3F];
	    output += lookup[(tmp << 2) & 0x3F];
	    output += '=';
	  }

	  parts.push(output);

	  return parts.join('')
	}

	function read (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	function write (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	}

	var toString = {}.toString;

	var isArray = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};

	var INSPECT_MAX_BYTES = 50;

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
	  ? global$1.TYPED_ARRAY_SUPPORT
	  : true;

	/*
	 * Export kMaxLength after typed array support is determined.
	 */
	var _kMaxLength = kMaxLength();

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length);
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length);
	    }
	    that.length = length;
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}

	Buffer.poolSize = 8192; // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype;
	  return arr
	};

	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	};

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype;
	  Buffer.__proto__ = Uint8Array;
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size);
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	};

	function allocUnsafe (that, size) {
	  assertSize(size);
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0;
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	};
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	};

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8';
	  }

	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0;
	  that = createBuffer(that, length);

	  var actual = that.write(string, encoding);

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual);
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0;
	  that = createBuffer(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array);
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset);
	  } else {
	    array = new Uint8Array(array, byteOffset, length);
	  }

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array;
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array);
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (internalIsBuffer(obj)) {
	    var len = checked(obj.length) | 0;
	    that = createBuffer(that, len);

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len);
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isArray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0;
	  }
	  return Buffer.alloc(+length)
	}
	Buffer.isBuffer = isBuffer;
	function internalIsBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	};

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }

	  var i;
	  if (length === undefined) {
	    length = 0;
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length;
	    }
	  }

	  var buffer = Buffer.allocUnsafe(length);
	  var pos = 0;
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i];
	    if (!internalIsBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos);
	    pos += buf.length;
	  }
	  return buffer
	};

	function byteLength (string, encoding) {
	  if (internalIsBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string;
	  }

	  var len = string.length;
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	Buffer.byteLength = byteLength;

	function slowToString (encoding, start, end) {
	  var loweredCase = false;

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0;
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length;
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0;
	  start >>>= 0;

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8';

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase();
	        loweredCase = true;
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true;

	function swap (b, n, m) {
	  var i = b[n];
	  b[n] = b[m];
	  b[m] = i;
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length;
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1);
	  }
	  return this
	};

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length;
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3);
	    swap(this, i + 1, i + 2);
	  }
	  return this
	};

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length;
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7);
	    swap(this, i + 1, i + 6);
	    swap(this, i + 2, i + 5);
	    swap(this, i + 3, i + 4);
	  }
	  return this
	};

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0;
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	};

	Buffer.prototype.equals = function equals (b) {
	  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	};

	Buffer.prototype.inspect = function inspect () {
	  var str = '';
	  var max = INSPECT_MAX_BYTES;
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
	    if (this.length > max) str += ' ... ';
	  }
	  return '<Buffer ' + str + '>'
	};

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!internalIsBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0;
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0;
	  }
	  if (thisStart === undefined) {
	    thisStart = 0;
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length;
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0;
	  end >>>= 0;
	  thisStart >>>= 0;
	  thisEnd >>>= 0;

	  if (this === target) return 0

	  var x = thisEnd - thisStart;
	  var y = end - start;
	  var len = Math.min(x, y);

	  var thisCopy = this.slice(thisStart, thisEnd);
	  var targetCopy = target.slice(start, end);

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i];
	      y = targetCopy[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset;
	    byteOffset = 0;
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff;
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000;
	  }
	  byteOffset = +byteOffset;  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1);
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1;
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0;
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding);
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (internalIsBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF; // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1;
	  var arrLength = arr.length;
	  var valLength = val.length;

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase();
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2;
	      arrLength /= 2;
	      valLength /= 2;
	      byteOffset /= 2;
	    }
	  }

	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i;
	  if (dir) {
	    var foundIndex = -1;
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i;
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex;
	        foundIndex = -1;
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true;
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false;
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	};

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	};

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	};

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0;
	  var remaining = buf.length - offset;
	  if (!length) {
	    length = remaining;
	  } else {
	    length = Number(length);
	    if (length > remaining) {
	      length = remaining;
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length;
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2;
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16);
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed;
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8';
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset;
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0;
	    if (isFinite(length)) {
	      length = length | 0;
	      if (encoding === undefined) encoding = 'utf8';
	    } else {
	      encoding = length;
	      length = undefined;
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset;
	  if (length === undefined || length > remaining) length = remaining;

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8';

	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	};

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	};

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return fromByteArray(buf)
	  } else {
	    return fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end);
	  var res = [];

	  var i = start;
	  while (i < end) {
	    var firstByte = buf[i];
	    var codePoint = null;
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1;

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint;

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte;
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1];
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          fourthByte = buf[i + 3];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint;
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD;
	      bytesPerSequence = 1;
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000;
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
	      codePoint = 0xDC00 | codePoint & 0x3FF;
	    }

	    res.push(codePoint);
	    i += bytesPerSequence;
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000;

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length;
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = '';
	  var i = 0;
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    );
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F);
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i]);
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length;

	  if (!start || start < 0) start = 0;
	  if (!end || end < 0 || end > len) end = len;

	  var out = '';
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i]);
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end);
	  var res = '';
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length;
	  start = ~~start;
	  end = end === undefined ? len : ~~end;

	  if (start < 0) {
	    start += len;
	    if (start < 0) start = 0;
	  } else if (start > len) {
	    start = len;
	  }

	  if (end < 0) {
	    end += len;
	    if (end < 0) end = 0;
	  } else if (end > len) {
	    end = len;
	  }

	  if (end < start) end = start;

	  var newBuf;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end);
	    newBuf.__proto__ = Buffer.prototype;
	  } else {
	    var sliceLen = end - start;
	    newBuf = new Buffer(sliceLen, undefined);
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start];
	    }
	  }

	  return newBuf
	};

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length);
	  }

	  var val = this[offset + --byteLength];
	  var mul = 1;
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  return this[offset]
	};

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] | (this[offset + 1] << 8)
	};

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return (this[offset] << 8) | this[offset + 1]
	};

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	};

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	};

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var i = byteLength;
	  var mul = 1;
	  var val = this[offset + --i];
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	};

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset] | (this[offset + 1] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset + 1] | (this[offset] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	};

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	};

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read(this, offset, true, 23, 4)
	};

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read(this, offset, false, 23, 4)
	};

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read(this, offset, true, 52, 8)
	};

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read(this, offset, false, 52, 8)
	};

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var mul = 1;
	  var i = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8;
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 1] = (value >>> 8);
	    this[offset] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = 0;
	  var mul = 1;
	  var sub = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  var sub = 0;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  if (value < 0) value = 0xff + value + 1;
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 3] = (value >>> 24);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (value < 0) value = 0xffffffff + value + 1;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4);
	  }
	  write(buf, value, offset, littleEndian, 23, 4);
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	};

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8);
	  }
	  write(buf, value, offset, littleEndian, 52, 8);
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	};

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (targetStart >= target.length) targetStart = target.length;
	  if (!targetStart) targetStart = 0;
	  if (end > 0 && end < start) end = start;

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length;
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start;
	  }

	  var len = end - start;
	  var i;

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    );
	  }

	  return len
	};

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start;
	      start = 0;
	      end = this.length;
	    } else if (typeof end === 'string') {
	      encoding = end;
	      end = this.length;
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0);
	      if (code < 256) {
	        val = code;
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255;
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0;
	  end = end === undefined ? this.length : end >>> 0;

	  if (!val) val = 0;

	  var i;
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val;
	    }
	  } else {
	    var bytes = internalIsBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString());
	    var len = bytes.length;
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len];
	    }
	  }

	  return this
	};

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '=';
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity;
	  var codePoint;
	  var length = string.length;
	  var leadSurrogate = null;
	  var bytes = [];

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i);

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint;

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	        leadSurrogate = codePoint;
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	    }

	    leadSurrogate = null;

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint);
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF);
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo;
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i);
	    hi = c >> 8;
	    lo = c % 256;
	    byteArray.push(lo);
	    byteArray.push(hi);
	  }

	  return byteArray
	}


	function base64ToBytes (str) {
	  return toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i];
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}


	// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	function isBuffer(obj) {
	  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
	}

	function isFastBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}

	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
	}

	var bufferEs6 = /*#__PURE__*/Object.freeze({
		INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
		kMaxLength: _kMaxLength,
		Buffer: Buffer,
		SlowBuffer: SlowBuffer,
		isBuffer: isBuffer
	});

	var E2BIG = 7;
	var EACCES = 13;
	var EADDRINUSE = 48;
	var EADDRNOTAVAIL = 49;
	var EAFNOSUPPORT = 47;
	var EAGAIN = 35;
	var EALREADY = 37;
	var EBADF = 9;
	var EBADMSG = 94;
	var EBUSY = 16;
	var ECANCELED = 89;
	var ECHILD = 10;
	var ECONNABORTED = 53;
	var ECONNREFUSED = 61;
	var ECONNRESET = 54;
	var EDEADLK = 11;
	var EDESTADDRREQ = 39;
	var EDOM = 33;
	var EDQUOT = 69;
	var EEXIST = 17;
	var EFAULT = 14;
	var EFBIG = 27;
	var EHOSTUNREACH = 65;
	var EIDRM = 90;
	var EILSEQ = 92;
	var EINPROGRESS = 36;
	var EINTR = 4;
	var EINVAL = 22;
	var EIO = 5;
	var EISCONN = 56;
	var EISDIR = 21;
	var ELOOP = 62;
	var EMFILE = 24;
	var EMLINK = 31;
	var EMSGSIZE = 40;
	var EMULTIHOP = 95;
	var ENAMETOOLONG = 63;
	var ENETDOWN = 50;
	var ENETRESET = 52;
	var ENETUNREACH = 51;
	var ENFILE = 23;
	var ENOBUFS = 55;
	var ENODATA = 96;
	var ENODEV = 19;
	var ENOENT = 2;
	var ENOEXEC = 8;
	var ENOLCK = 77;
	var ENOLINK = 97;
	var ENOMEM = 12;
	var ENOMSG = 91;
	var ENOPROTOOPT = 42;
	var ENOSPC = 28;
	var ENOSR = 98;
	var ENOSTR = 99;
	var ENOSYS = 78;
	var ENOTCONN = 57;
	var ENOTDIR = 20;
	var ENOTEMPTY = 66;
	var ENOTSOCK = 38;
	var ENOTSUP = 45;
	var ENOTTY = 25;
	var ENXIO = 6;
	var EOPNOTSUPP = 102;
	var EOVERFLOW = 84;
	var EPERM = 1;
	var EPIPE = 32;
	var EPROTO = 100;
	var EPROTONOSUPPORT = 43;
	var EPROTOTYPE = 41;
	var ERANGE = 34;
	var EROFS = 30;
	var ESPIPE = 29;
	var ESRCH = 3;
	var ESTALE = 70;
	var ETIME = 101;
	var ETIMEDOUT = 60;
	var ETXTBSY = 26;
	var EWOULDBLOCK = 35;
	var EXDEV = 18;
	var SIGHUP = 1;
	var SIGINT = 2;
	var SIGQUIT = 3;
	var SIGILL = 4;
	var SIGTRAP = 5;
	var SIGABRT = 6;
	var SIGIOT = 6;
	var SIGBUS = 10;
	var SIGFPE = 8;
	var SIGKILL = 9;
	var SIGUSR1 = 30;
	var SIGSEGV = 11;
	var SIGUSR2 = 31;
	var SIGPIPE = 13;
	var SIGALRM = 14;
	var SIGTERM = 15;
	var SIGCHLD = 20;
	var SIGCONT = 19;
	var SIGSTOP = 17;
	var SIGTSTP = 18;
	var SIGTTIN = 21;
	var SIGTTOU = 22;
	var SIGURG = 16;
	var SIGXCPU = 24;
	var SIGXFSZ = 25;
	var SIGVTALRM = 26;
	var SIGPROF = 27;
	var SIGWINCH = 28;
	var SIGIO = 23;
	var SIGINFO = 29;
	var SIGSYS = 12;
	var O_RDONLY = 0;
	var O_WRONLY = 1;
	var O_RDWR = 2;
	var S_IFMT = 61440;
	var S_IFREG = 32768;
	var S_IFDIR = 16384;
	var S_IFCHR = 8192;
	var S_IFBLK = 24576;
	var S_IFIFO = 4096;
	var S_IFLNK = 40960;
	var S_IFSOCK = 49152;
	var O_CREAT = 512;
	var O_EXCL = 2048;
	var O_NOCTTY = 131072;
	var O_TRUNC = 1024;
	var O_APPEND = 8;
	var O_DIRECTORY = 1048576;
	var O_NOFOLLOW = 256;
	var O_SYNC = 128;
	var O_SYMLINK = 2097152;
	var O_NONBLOCK = 4;
	var S_IRWXU = 448;
	var S_IRUSR = 256;
	var S_IWUSR = 128;
	var S_IXUSR = 64;
	var S_IRWXG = 56;
	var S_IRGRP = 32;
	var S_IWGRP = 16;
	var S_IXGRP = 8;
	var S_IRWXO = 7;
	var S_IROTH = 4;
	var S_IWOTH = 2;
	var S_IXOTH = 1;
	var F_OK = 0;
	var R_OK = 4;
	var W_OK = 2;
	var X_OK = 1;
	var SSL_OP_ALL = 2147486719;
	var SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION = 262144;
	var SSL_OP_CIPHER_SERVER_PREFERENCE = 4194304;
	var SSL_OP_CISCO_ANYCONNECT = 32768;
	var SSL_OP_COOKIE_EXCHANGE = 8192;
	var SSL_OP_CRYPTOPRO_TLSEXT_BUG = 2147483648;
	var SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS = 2048;
	var SSL_OP_EPHEMERAL_RSA = 0;
	var SSL_OP_LEGACY_SERVER_CONNECT = 4;
	var SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER = 32;
	var SSL_OP_MICROSOFT_SESS_ID_BUG = 1;
	var SSL_OP_MSIE_SSLV2_RSA_PADDING = 0;
	var SSL_OP_NETSCAPE_CA_DN_BUG = 536870912;
	var SSL_OP_NETSCAPE_CHALLENGE_BUG = 2;
	var SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG = 1073741824;
	var SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG = 8;
	var SSL_OP_NO_COMPRESSION = 131072;
	var SSL_OP_NO_QUERY_MTU = 4096;
	var SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION = 65536;
	var SSL_OP_NO_SSLv2 = 16777216;
	var SSL_OP_NO_SSLv3 = 33554432;
	var SSL_OP_NO_TICKET = 16384;
	var SSL_OP_NO_TLSv1 = 67108864;
	var SSL_OP_NO_TLSv1_1 = 268435456;
	var SSL_OP_NO_TLSv1_2 = 134217728;
	var SSL_OP_PKCS1_CHECK_1 = 0;
	var SSL_OP_PKCS1_CHECK_2 = 0;
	var SSL_OP_SINGLE_DH_USE = 1048576;
	var SSL_OP_SINGLE_ECDH_USE = 524288;
	var SSL_OP_SSLEAY_080_CLIENT_DH_BUG = 128;
	var SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG = 0;
	var SSL_OP_TLS_BLOCK_PADDING_BUG = 512;
	var SSL_OP_TLS_D5_BUG = 256;
	var SSL_OP_TLS_ROLLBACK_BUG = 8388608;
	var ENGINE_METHOD_RSA = 1;
	var ENGINE_METHOD_DSA = 2;
	var ENGINE_METHOD_DH = 4;
	var ENGINE_METHOD_RAND = 8;
	var ENGINE_METHOD_ECDH = 16;
	var ENGINE_METHOD_ECDSA = 32;
	var ENGINE_METHOD_CIPHERS = 64;
	var ENGINE_METHOD_DIGESTS = 128;
	var ENGINE_METHOD_STORE = 256;
	var ENGINE_METHOD_PKEY_METHS = 512;
	var ENGINE_METHOD_PKEY_ASN1_METHS = 1024;
	var ENGINE_METHOD_ALL = 65535;
	var ENGINE_METHOD_NONE = 0;
	var DH_CHECK_P_NOT_SAFE_PRIME = 2;
	var DH_CHECK_P_NOT_PRIME = 1;
	var DH_UNABLE_TO_CHECK_GENERATOR = 4;
	var DH_NOT_SUITABLE_GENERATOR = 8;
	var NPN_ENABLED = 1;
	var ALPN_ENABLED = 1;
	var RSA_PKCS1_PADDING = 1;
	var RSA_SSLV23_PADDING = 2;
	var RSA_NO_PADDING = 3;
	var RSA_PKCS1_OAEP_PADDING = 4;
	var RSA_X931_PADDING = 5;
	var RSA_PKCS1_PSS_PADDING = 6;
	var POINT_CONVERSION_COMPRESSED = 2;
	var POINT_CONVERSION_UNCOMPRESSED = 4;
	var POINT_CONVERSION_HYBRID = 6;
	var defaultCoreCipherList = "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA";
	var defaultCipherList = "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA";
	var constants = {
	  E2BIG: E2BIG,
	  EACCES: EACCES,
	  EADDRINUSE: EADDRINUSE,
	  EADDRNOTAVAIL: EADDRNOTAVAIL,
	  EAFNOSUPPORT: EAFNOSUPPORT,
	  EAGAIN: EAGAIN,
	  EALREADY: EALREADY,
	  EBADF: EBADF,
	  EBADMSG: EBADMSG,
	  EBUSY: EBUSY,
	  ECANCELED: ECANCELED,
	  ECHILD: ECHILD,
	  ECONNABORTED: ECONNABORTED,
	  ECONNREFUSED: ECONNREFUSED,
	  ECONNRESET: ECONNRESET,
	  EDEADLK: EDEADLK,
	  EDESTADDRREQ: EDESTADDRREQ,
	  EDOM: EDOM,
	  EDQUOT: EDQUOT,
	  EEXIST: EEXIST,
	  EFAULT: EFAULT,
	  EFBIG: EFBIG,
	  EHOSTUNREACH: EHOSTUNREACH,
	  EIDRM: EIDRM,
	  EILSEQ: EILSEQ,
	  EINPROGRESS: EINPROGRESS,
	  EINTR: EINTR,
	  EINVAL: EINVAL,
	  EIO: EIO,
	  EISCONN: EISCONN,
	  EISDIR: EISDIR,
	  ELOOP: ELOOP,
	  EMFILE: EMFILE,
	  EMLINK: EMLINK,
	  EMSGSIZE: EMSGSIZE,
	  EMULTIHOP: EMULTIHOP,
	  ENAMETOOLONG: ENAMETOOLONG,
	  ENETDOWN: ENETDOWN,
	  ENETRESET: ENETRESET,
	  ENETUNREACH: ENETUNREACH,
	  ENFILE: ENFILE,
	  ENOBUFS: ENOBUFS,
	  ENODATA: ENODATA,
	  ENODEV: ENODEV,
	  ENOENT: ENOENT,
	  ENOEXEC: ENOEXEC,
	  ENOLCK: ENOLCK,
	  ENOLINK: ENOLINK,
	  ENOMEM: ENOMEM,
	  ENOMSG: ENOMSG,
	  ENOPROTOOPT: ENOPROTOOPT,
	  ENOSPC: ENOSPC,
	  ENOSR: ENOSR,
	  ENOSTR: ENOSTR,
	  ENOSYS: ENOSYS,
	  ENOTCONN: ENOTCONN,
	  ENOTDIR: ENOTDIR,
	  ENOTEMPTY: ENOTEMPTY,
	  ENOTSOCK: ENOTSOCK,
	  ENOTSUP: ENOTSUP,
	  ENOTTY: ENOTTY,
	  ENXIO: ENXIO,
	  EOPNOTSUPP: EOPNOTSUPP,
	  EOVERFLOW: EOVERFLOW,
	  EPERM: EPERM,
	  EPIPE: EPIPE,
	  EPROTO: EPROTO,
	  EPROTONOSUPPORT: EPROTONOSUPPORT,
	  EPROTOTYPE: EPROTOTYPE,
	  ERANGE: ERANGE,
	  EROFS: EROFS,
	  ESPIPE: ESPIPE,
	  ESRCH: ESRCH,
	  ESTALE: ESTALE,
	  ETIME: ETIME,
	  ETIMEDOUT: ETIMEDOUT,
	  ETXTBSY: ETXTBSY,
	  EWOULDBLOCK: EWOULDBLOCK,
	  EXDEV: EXDEV,
	  SIGHUP: SIGHUP,
	  SIGINT: SIGINT,
	  SIGQUIT: SIGQUIT,
	  SIGILL: SIGILL,
	  SIGTRAP: SIGTRAP,
	  SIGABRT: SIGABRT,
	  SIGIOT: SIGIOT,
	  SIGBUS: SIGBUS,
	  SIGFPE: SIGFPE,
	  SIGKILL: SIGKILL,
	  SIGUSR1: SIGUSR1,
	  SIGSEGV: SIGSEGV,
	  SIGUSR2: SIGUSR2,
	  SIGPIPE: SIGPIPE,
	  SIGALRM: SIGALRM,
	  SIGTERM: SIGTERM,
	  SIGCHLD: SIGCHLD,
	  SIGCONT: SIGCONT,
	  SIGSTOP: SIGSTOP,
	  SIGTSTP: SIGTSTP,
	  SIGTTIN: SIGTTIN,
	  SIGTTOU: SIGTTOU,
	  SIGURG: SIGURG,
	  SIGXCPU: SIGXCPU,
	  SIGXFSZ: SIGXFSZ,
	  SIGVTALRM: SIGVTALRM,
	  SIGPROF: SIGPROF,
	  SIGWINCH: SIGWINCH,
	  SIGIO: SIGIO,
	  SIGINFO: SIGINFO,
	  SIGSYS: SIGSYS,
	  O_RDONLY: O_RDONLY,
	  O_WRONLY: O_WRONLY,
	  O_RDWR: O_RDWR,
	  S_IFMT: S_IFMT,
	  S_IFREG: S_IFREG,
	  S_IFDIR: S_IFDIR,
	  S_IFCHR: S_IFCHR,
	  S_IFBLK: S_IFBLK,
	  S_IFIFO: S_IFIFO,
	  S_IFLNK: S_IFLNK,
	  S_IFSOCK: S_IFSOCK,
	  O_CREAT: O_CREAT,
	  O_EXCL: O_EXCL,
	  O_NOCTTY: O_NOCTTY,
	  O_TRUNC: O_TRUNC,
	  O_APPEND: O_APPEND,
	  O_DIRECTORY: O_DIRECTORY,
	  O_NOFOLLOW: O_NOFOLLOW,
	  O_SYNC: O_SYNC,
	  O_SYMLINK: O_SYMLINK,
	  O_NONBLOCK: O_NONBLOCK,
	  S_IRWXU: S_IRWXU,
	  S_IRUSR: S_IRUSR,
	  S_IWUSR: S_IWUSR,
	  S_IXUSR: S_IXUSR,
	  S_IRWXG: S_IRWXG,
	  S_IRGRP: S_IRGRP,
	  S_IWGRP: S_IWGRP,
	  S_IXGRP: S_IXGRP,
	  S_IRWXO: S_IRWXO,
	  S_IROTH: S_IROTH,
	  S_IWOTH: S_IWOTH,
	  S_IXOTH: S_IXOTH,
	  F_OK: F_OK,
	  R_OK: R_OK,
	  W_OK: W_OK,
	  X_OK: X_OK,
	  SSL_OP_ALL: SSL_OP_ALL,
	  SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION: SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
	  SSL_OP_CIPHER_SERVER_PREFERENCE: SSL_OP_CIPHER_SERVER_PREFERENCE,
	  SSL_OP_CISCO_ANYCONNECT: SSL_OP_CISCO_ANYCONNECT,
	  SSL_OP_COOKIE_EXCHANGE: SSL_OP_COOKIE_EXCHANGE,
	  SSL_OP_CRYPTOPRO_TLSEXT_BUG: SSL_OP_CRYPTOPRO_TLSEXT_BUG,
	  SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS: SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS,
	  SSL_OP_EPHEMERAL_RSA: SSL_OP_EPHEMERAL_RSA,
	  SSL_OP_LEGACY_SERVER_CONNECT: SSL_OP_LEGACY_SERVER_CONNECT,
	  SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER: SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER,
	  SSL_OP_MICROSOFT_SESS_ID_BUG: SSL_OP_MICROSOFT_SESS_ID_BUG,
	  SSL_OP_MSIE_SSLV2_RSA_PADDING: SSL_OP_MSIE_SSLV2_RSA_PADDING,
	  SSL_OP_NETSCAPE_CA_DN_BUG: SSL_OP_NETSCAPE_CA_DN_BUG,
	  SSL_OP_NETSCAPE_CHALLENGE_BUG: SSL_OP_NETSCAPE_CHALLENGE_BUG,
	  SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG: SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG,
	  SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG: SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG,
	  SSL_OP_NO_COMPRESSION: SSL_OP_NO_COMPRESSION,
	  SSL_OP_NO_QUERY_MTU: SSL_OP_NO_QUERY_MTU,
	  SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION: SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION,
	  SSL_OP_NO_SSLv2: SSL_OP_NO_SSLv2,
	  SSL_OP_NO_SSLv3: SSL_OP_NO_SSLv3,
	  SSL_OP_NO_TICKET: SSL_OP_NO_TICKET,
	  SSL_OP_NO_TLSv1: SSL_OP_NO_TLSv1,
	  SSL_OP_NO_TLSv1_1: SSL_OP_NO_TLSv1_1,
	  SSL_OP_NO_TLSv1_2: SSL_OP_NO_TLSv1_2,
	  SSL_OP_PKCS1_CHECK_1: SSL_OP_PKCS1_CHECK_1,
	  SSL_OP_PKCS1_CHECK_2: SSL_OP_PKCS1_CHECK_2,
	  SSL_OP_SINGLE_DH_USE: SSL_OP_SINGLE_DH_USE,
	  SSL_OP_SINGLE_ECDH_USE: SSL_OP_SINGLE_ECDH_USE,
	  SSL_OP_SSLEAY_080_CLIENT_DH_BUG: SSL_OP_SSLEAY_080_CLIENT_DH_BUG,
	  SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG: SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG,
	  SSL_OP_TLS_BLOCK_PADDING_BUG: SSL_OP_TLS_BLOCK_PADDING_BUG,
	  SSL_OP_TLS_D5_BUG: SSL_OP_TLS_D5_BUG,
	  SSL_OP_TLS_ROLLBACK_BUG: SSL_OP_TLS_ROLLBACK_BUG,
	  ENGINE_METHOD_RSA: ENGINE_METHOD_RSA,
	  ENGINE_METHOD_DSA: ENGINE_METHOD_DSA,
	  ENGINE_METHOD_DH: ENGINE_METHOD_DH,
	  ENGINE_METHOD_RAND: ENGINE_METHOD_RAND,
	  ENGINE_METHOD_ECDH: ENGINE_METHOD_ECDH,
	  ENGINE_METHOD_ECDSA: ENGINE_METHOD_ECDSA,
	  ENGINE_METHOD_CIPHERS: ENGINE_METHOD_CIPHERS,
	  ENGINE_METHOD_DIGESTS: ENGINE_METHOD_DIGESTS,
	  ENGINE_METHOD_STORE: ENGINE_METHOD_STORE,
	  ENGINE_METHOD_PKEY_METHS: ENGINE_METHOD_PKEY_METHS,
	  ENGINE_METHOD_PKEY_ASN1_METHS: ENGINE_METHOD_PKEY_ASN1_METHS,
	  ENGINE_METHOD_ALL: ENGINE_METHOD_ALL,
	  ENGINE_METHOD_NONE: ENGINE_METHOD_NONE,
	  DH_CHECK_P_NOT_SAFE_PRIME: DH_CHECK_P_NOT_SAFE_PRIME,
	  DH_CHECK_P_NOT_PRIME: DH_CHECK_P_NOT_PRIME,
	  DH_UNABLE_TO_CHECK_GENERATOR: DH_UNABLE_TO_CHECK_GENERATOR,
	  DH_NOT_SUITABLE_GENERATOR: DH_NOT_SUITABLE_GENERATOR,
	  NPN_ENABLED: NPN_ENABLED,
	  ALPN_ENABLED: ALPN_ENABLED,
	  RSA_PKCS1_PADDING: RSA_PKCS1_PADDING,
	  RSA_SSLV23_PADDING: RSA_SSLV23_PADDING,
	  RSA_NO_PADDING: RSA_NO_PADDING,
	  RSA_PKCS1_OAEP_PADDING: RSA_PKCS1_OAEP_PADDING,
	  RSA_X931_PADDING: RSA_X931_PADDING,
	  RSA_PKCS1_PSS_PADDING: RSA_PKCS1_PSS_PADDING,
	  POINT_CONVERSION_COMPRESSED: POINT_CONVERSION_COMPRESSED,
	  POINT_CONVERSION_UNCOMPRESSED: POINT_CONVERSION_UNCOMPRESSED,
	  POINT_CONVERSION_HYBRID: POINT_CONVERSION_HYBRID,
	  defaultCoreCipherList: defaultCoreCipherList,
	  defaultCipherList: defaultCipherList
	};

	var _global = createCommonjsModule(function (module) {
	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self
	  // eslint-disable-next-line no-new-func
	  : Function('return this')();
	if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
	});

	var _aFunction = function (it) {
	  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
	  return it;
	};

	// optional / simple context binding

	var _ctx = function (fn, that, length) {
	  _aFunction(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 1: return function (a) {
	      return fn.call(that, a);
	    };
	    case 2: return function (a, b) {
	      return fn.call(that, a, b);
	    };
	    case 3: return function (a, b, c) {
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};

	var _isObject = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

	var _anObject = function (it) {
	  if (!_isObject(it)) throw TypeError(it + ' is not an object!');
	  return it;
	};

	var _fails = function (exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};

	// Thank's IE8 for his funny defineProperty
	var _descriptors = !_fails(function () {
	  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
	});

	var document = _global.document;
	// typeof document.createElement is 'object' in old IE
	var is = _isObject(document) && _isObject(document.createElement);
	var _domCreate = function (it) {
	  return is ? document.createElement(it) : {};
	};

	var _ie8DomDefine = !_descriptors && !_fails(function () {
	  return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
	});

	// 7.1.1 ToPrimitive(input [, PreferredType])

	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	var _toPrimitive = function (it, S) {
	  if (!_isObject(it)) return it;
	  var fn, val;
	  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};

	var dP = Object.defineProperty;

	var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
	  _anObject(O);
	  P = _toPrimitive(P, true);
	  _anObject(Attributes);
	  if (_ie8DomDefine) try {
	    return dP(O, P, Attributes);
	  } catch (e) { /* empty */ }
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};

	var _objectDp = {
		f: f
	};

	var _propertyDesc = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

	var _hide = _descriptors ? function (object, key, value) {
	  return _objectDp.f(object, key, _propertyDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

	var hasOwnProperty = {}.hasOwnProperty;
	var _has = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};

	var PROTOTYPE = 'prototype';

	var $export = function (type, name, source) {
	  var IS_FORCED = type & $export.F;
	  var IS_GLOBAL = type & $export.G;
	  var IS_STATIC = type & $export.S;
	  var IS_PROTO = type & $export.P;
	  var IS_BIND = type & $export.B;
	  var IS_WRAP = type & $export.W;
	  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
	  var expProto = exports[PROTOTYPE];
	  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] : (_global[name] || {})[PROTOTYPE];
	  var key, own, out;
	  if (IS_GLOBAL) source = name;
	  for (key in source) {
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    if (own && _has(exports, key)) continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? _ctx(out, _global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function (C) {
	      var F = function (a, b, c) {
	        if (this instanceof C) {
	          switch (arguments.length) {
	            case 0: return new C();
	            case 1: return new C(a);
	            case 2: return new C(a, b);
	          } return new C(a, b, c);
	        } return C.apply(this, arguments);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
	    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
	    if (IS_PROTO) {
	      (exports.virtual || (exports.virtual = {}))[key] = out;
	      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
	      if (type & $export.R && expProto && !expProto[key]) _hide(expProto, key, out);
	    }
	  }
	};
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library`
	var _export = $export;

	// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
	_export(_export.S + _export.F * !_descriptors, 'Object', { defineProperty: _objectDp.f });

	var $Object = _core.Object;
	var defineProperty = function defineProperty(it, key, desc) {
	  return $Object.defineProperty(it, key, desc);
	};

	var defineProperty$1 = defineProperty;

	// 7.2.1 RequireObjectCoercible(argument)
	var _defined = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on  " + it);
	  return it;
	};

	var _stringWs = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
	  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

	var space = '[' + _stringWs + ']';
	var non = '\u200b\u0085';
	var ltrim = RegExp('^' + space + space + '*');
	var rtrim = RegExp(space + space + '*$');

	var exporter = function (KEY, exec, ALIAS) {
	  var exp = {};
	  var FORCE = _fails(function () {
	    return !!_stringWs[KEY]() || non[KEY]() != non;
	  });
	  var fn = exp[KEY] = FORCE ? exec(trim) : _stringWs[KEY];
	  if (ALIAS) exp[ALIAS] = fn;
	  _export(_export.P + _export.F * FORCE, 'String', exp);
	};

	// 1 -> String#trimLeft
	// 2 -> String#trimRight
	// 3 -> String#trim
	var trim = exporter.trim = function (string, TYPE) {
	  string = String(_defined(string));
	  if (TYPE & 1) string = string.replace(ltrim, '');
	  if (TYPE & 2) string = string.replace(rtrim, '');
	  return string;
	};

	var _stringTrim = exporter;

	var $parseInt = _global.parseInt;
	var $trim = _stringTrim.trim;

	var hex = /^[-+]?0[xX]/;

	var _parseInt = $parseInt(_stringWs + '08') !== 8 || $parseInt(_stringWs + '0x16') !== 22 ? function parseInt(str, radix) {
	  var string = $trim(String(str), 3);
	  return $parseInt(string, (radix >>> 0) || (hex.test(string) ? 16 : 10));
	} : $parseInt;

	// 18.2.5 parseInt(string, radix)
	_export(_export.G + _export.F * (parseInt != _parseInt), { parseInt: _parseInt });

	var _parseInt$1 = _core.parseInt;

	var _parseInt$2 = _parseInt$1;

	var $parseFloat = _global.parseFloat;
	var $trim$1 = _stringTrim.trim;

	var _parseFloat = 1 / $parseFloat(_stringWs + '-0') !== -Infinity ? function parseFloat(str) {
	  var string = $trim$1(String(str), 3);
	  var result = $parseFloat(string);
	  return result === 0 && string.charAt(0) == '-' ? -0 : result;
	} : $parseFloat;

	// 18.2.4 parseFloat(string)
	_export(_export.G + _export.F * (parseFloat != _parseFloat), { parseFloat: _parseFloat });

	var _parseFloat$1 = _core.parseFloat;

	var _parseFloat$2 = _parseFloat$1;

	// 7.1.4 ToInteger
	var ceil = Math.ceil;
	var floor = Math.floor;
	var _toInteger = function (it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

	// true  -> String#at
	// false -> String#codePointAt
	var _stringAt = function (TO_STRING) {
	  return function (that, pos) {
	    var s = String(_defined(that));
	    var i = _toInteger(pos);
	    var l = s.length;
	    var a, b;
	    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

	var _library = true;

	var _redefine = _hide;

	var toString$1 = {}.toString;

	var _cof = function (it) {
	  return toString$1.call(it).slice(8, -1);
	};

	// fallback for non-array-like ES3 and non-enumerable old V8 strings

	// eslint-disable-next-line no-prototype-builtins
	var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
	  return _cof(it) == 'String' ? it.split('') : Object(it);
	};

	// to indexed object, toObject with fallback for non-array-like ES3 strings


	var _toIobject = function (it) {
	  return _iobject(_defined(it));
	};

	// 7.1.15 ToLength

	var min = Math.min;
	var _toLength = function (it) {
	  return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

	var max = Math.max;
	var min$1 = Math.min;
	var _toAbsoluteIndex = function (index, length) {
	  index = _toInteger(index);
	  return index < 0 ? max(index + length, 0) : min$1(index, length);
	};

	// false -> Array#indexOf
	// true  -> Array#includes



	var _arrayIncludes = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = _toIobject($this);
	    var length = _toLength(O.length);
	    var index = _toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare
	      if (value != value) return true;
	    // Array#indexOf ignores holes, Array#includes - not
	    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
	      if (O[index] === el) return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

	var _shared = createCommonjsModule(function (module) {
	var SHARED = '__core-js_shared__';
	var store = _global[SHARED] || (_global[SHARED] = {});

	(module.exports = function (key, value) {
	  return store[key] || (store[key] = value !== undefined ? value : {});
	})('versions', []).push({
	  version: _core.version,
	  mode:  'pure' ,
	  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
	});
	});

	var id = 0;
	var px = Math.random();
	var _uid = function (key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

	var shared = _shared('keys');

	var _sharedKey = function (key) {
	  return shared[key] || (shared[key] = _uid(key));
	};

	var arrayIndexOf$1 = _arrayIncludes(false);
	var IE_PROTO = _sharedKey('IE_PROTO');

	var _objectKeysInternal = function (object, names) {
	  var O = _toIobject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) if (key != IE_PROTO) _has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while (names.length > i) if (_has(O, key = names[i++])) {
	    ~arrayIndexOf$1(result, key) || result.push(key);
	  }
	  return result;
	};

	// IE 8- don't enum bug keys
	var _enumBugKeys = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)



	var _objectKeys = Object.keys || function keys(O) {
	  return _objectKeysInternal(O, _enumBugKeys);
	};

	var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
	  _anObject(O);
	  var keys = _objectKeys(Properties);
	  var length = keys.length;
	  var i = 0;
	  var P;
	  while (length > i) _objectDp.f(O, P = keys[i++], Properties[P]);
	  return O;
	};

	var document$1 = _global.document;
	var _html = document$1 && document$1.documentElement;

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])



	var IE_PROTO$1 = _sharedKey('IE_PROTO');
	var Empty = function () { /* empty */ };
	var PROTOTYPE$1 = 'prototype';

	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function () {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = _domCreate('iframe');
	  var i = _enumBugKeys.length;
	  var lt = '<';
	  var gt = '>';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  _html.appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while (i--) delete createDict[PROTOTYPE$1][_enumBugKeys[i]];
	  return createDict();
	};

	var _objectCreate = Object.create || function create(O, Properties) {
	  var result;
	  if (O !== null) {
	    Empty[PROTOTYPE$1] = _anObject(O);
	    result = new Empty();
	    Empty[PROTOTYPE$1] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO$1] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : _objectDps(result, Properties);
	};

	var _wks = createCommonjsModule(function (module) {
	var store = _shared('wks');

	var Symbol = _global.Symbol;
	var USE_SYMBOL = typeof Symbol == 'function';

	var $exports = module.exports = function (name) {
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : _uid)('Symbol.' + name));
	};

	$exports.store = store;
	});

	var def = _objectDp.f;

	var TAG = _wks('toStringTag');

	var _setToStringTag = function (it, tag, stat) {
	  if (it && !_has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
	};

	var IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	_hide(IteratorPrototype, _wks('iterator'), function () { return this; });

	var _iterCreate = function (Constructor, NAME, next) {
	  Constructor.prototype = _objectCreate(IteratorPrototype, { next: _propertyDesc(1, next) });
	  _setToStringTag(Constructor, NAME + ' Iterator');
	};

	// 7.1.13 ToObject(argument)

	var _toObject = function (it) {
	  return Object(_defined(it));
	};

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)


	var IE_PROTO$2 = _sharedKey('IE_PROTO');
	var ObjectProto = Object.prototype;

	var _objectGpo = Object.getPrototypeOf || function (O) {
	  O = _toObject(O);
	  if (_has(O, IE_PROTO$2)) return O[IE_PROTO$2];
	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto : null;
	};

	var ITERATOR = _wks('iterator');
	var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
	var FF_ITERATOR = '@@iterator';
	var KEYS = 'keys';
	var VALUES = 'values';

	var _iterDefine = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
	  _iterCreate(Constructor, NAME, next);
	  var getMethod = function (kind) {
	    if (!BUGGY && kind in proto) return proto[kind];
	    switch (kind) {
	      case KEYS: return function keys() { return new Constructor(this, kind); };
	      case VALUES: return function values() { return new Constructor(this, kind); };
	    } return function entries() { return new Constructor(this, kind); };
	  };
	  var TAG = NAME + ' Iterator';
	  var DEF_VALUES = DEFAULT == VALUES;
	  var VALUES_BUG = false;
	  var proto = Base.prototype;
	  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
	  var $default = $native || getMethod(DEFAULT);
	  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
	  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
	  var methods, key, IteratorPrototype;
	  // Fix native
	  if ($anyNative) {
	    IteratorPrototype = _objectGpo($anyNative.call(new Base()));
	    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
	      // Set @@toStringTag to native iterators
	      _setToStringTag(IteratorPrototype, TAG, true);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if (DEF_VALUES && $native && $native.name !== VALUES) {
	    VALUES_BUG = true;
	    $default = function values() { return $native.call(this); };
	  }
	  // Define iterator
	  if (( FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
	    _hide(proto, ITERATOR, $default);
	  }
	  if (DEFAULT) {
	    methods = {
	      values: DEF_VALUES ? $default : getMethod(VALUES),
	      keys: IS_SET ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if (FORCED) for (key in methods) {
	      if (!(key in proto)) _redefine(proto, key, methods[key]);
	    } else _export(_export.P + _export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

	var $at = _stringAt(true);

	// 21.1.3.27 String.prototype[@@iterator]()
	_iterDefine(String, 'String', function (iterated) {
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function () {
	  var O = this._t;
	  var index = this._i;
	  var point;
	  if (index >= O.length) return { value: undefined, done: true };
	  point = $at(O, index);
	  this._i += point.length;
	  return { value: point, done: false };
	});

	var _iterStep = function (done, value) {
	  return { value: value, done: !!done };
	};

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	var es6_array_iterator = _iterDefine(Array, 'Array', function (iterated, kind) {
	  this._t = _toIobject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function () {
	  var O = this._t;
	  var kind = this._k;
	  var index = this._i++;
	  if (!O || index >= O.length) {
	    this._t = undefined;
	    return _iterStep(1);
	  }
	  if (kind == 'keys') return _iterStep(0, index);
	  if (kind == 'values') return _iterStep(0, O[index]);
	  return _iterStep(0, [index, O[index]]);
	}, 'values');

	var TO_STRING_TAG = _wks('toStringTag');

	var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
	  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
	  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
	  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
	  'TextTrackList,TouchList').split(',');

	for (var i = 0; i < DOMIterables.length; i++) {
	  var NAME = DOMIterables[i];
	  var Collection = _global[NAME];
	  var proto = Collection && Collection.prototype;
	  if (proto && !proto[TO_STRING_TAG]) _hide(proto, TO_STRING_TAG, NAME);
	}

	var f$1 = _wks;

	var _wksExt = {
		f: f$1
	};

	var iterator = _wksExt.f('iterator');

	var iterator$1 = iterator;

	var _meta = createCommonjsModule(function (module) {
	var META = _uid('meta');


	var setDesc = _objectDp.f;
	var id = 0;
	var isExtensible = Object.isExtensible || function () {
	  return true;
	};
	var FREEZE = !_fails(function () {
	  return isExtensible(Object.preventExtensions({}));
	});
	var setMeta = function (it) {
	  setDesc(it, META, { value: {
	    i: 'O' + ++id, // object ID
	    w: {}          // weak collections IDs
	  } });
	};
	var fastKey = function (it, create) {
	  // return primitive with prefix
	  if (!_isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if (!_has(it, META)) {
	    // can't set metadata to uncaught frozen object
	    if (!isExtensible(it)) return 'F';
	    // not necessary to add metadata
	    if (!create) return 'E';
	    // add missing metadata
	    setMeta(it);
	  // return object ID
	  } return it[META].i;
	};
	var getWeak = function (it, create) {
	  if (!_has(it, META)) {
	    // can't set metadata to uncaught frozen object
	    if (!isExtensible(it)) return true;
	    // not necessary to add metadata
	    if (!create) return false;
	    // add missing metadata
	    setMeta(it);
	  // return hash weak collections IDs
	  } return it[META].w;
	};
	// add metadata on freeze-family methods calling
	var onFreeze = function (it) {
	  if (FREEZE && meta.NEED && isExtensible(it) && !_has(it, META)) setMeta(it);
	  return it;
	};
	var meta = module.exports = {
	  KEY: META,
	  NEED: false,
	  fastKey: fastKey,
	  getWeak: getWeak,
	  onFreeze: onFreeze
	};
	});
	var _meta_1 = _meta.KEY;
	var _meta_2 = _meta.NEED;
	var _meta_3 = _meta.fastKey;
	var _meta_4 = _meta.getWeak;
	var _meta_5 = _meta.onFreeze;

	var defineProperty$2 = _objectDp.f;
	var _wksDefine = function (name) {
	  var $Symbol = _core.Symbol || (_core.Symbol =  {} );
	  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty$2($Symbol, name, { value: _wksExt.f(name) });
	};

	var f$2 = Object.getOwnPropertySymbols;

	var _objectGops = {
		f: f$2
	};

	var f$3 = {}.propertyIsEnumerable;

	var _objectPie = {
		f: f$3
	};

	// all enumerable object keys, includes symbols



	var _enumKeys = function (it) {
	  var result = _objectKeys(it);
	  var getSymbols = _objectGops.f;
	  if (getSymbols) {
	    var symbols = getSymbols(it);
	    var isEnum = _objectPie.f;
	    var i = 0;
	    var key;
	    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
	  } return result;
	};

	// 7.2.2 IsArray(argument)

	var _isArray = Array.isArray || function isArray(arg) {
	  return _cof(arg) == 'Array';
	};

	// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)

	var hiddenKeys = _enumBugKeys.concat('length', 'prototype');

	var f$4 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return _objectKeysInternal(O, hiddenKeys);
	};

	var _objectGopn = {
		f: f$4
	};

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window

	var gOPN = _objectGopn.f;
	var toString$2 = {}.toString;

	var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];

	var getWindowNames = function (it) {
	  try {
	    return gOPN(it);
	  } catch (e) {
	    return windowNames.slice();
	  }
	};

	var f$5 = function getOwnPropertyNames(it) {
	  return windowNames && toString$2.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(_toIobject(it));
	};

	var _objectGopnExt = {
		f: f$5
	};

	var gOPD = Object.getOwnPropertyDescriptor;

	var f$6 = _descriptors ? gOPD : function getOwnPropertyDescriptor(O, P) {
	  O = _toIobject(O);
	  P = _toPrimitive(P, true);
	  if (_ie8DomDefine) try {
	    return gOPD(O, P);
	  } catch (e) { /* empty */ }
	  if (_has(O, P)) return _propertyDesc(!_objectPie.f.call(O, P), O[P]);
	};

	var _objectGopd = {
		f: f$6
	};

	// ECMAScript 6 symbols shim





	var META = _meta.KEY;





















	var gOPD$1 = _objectGopd.f;
	var dP$1 = _objectDp.f;
	var gOPN$1 = _objectGopnExt.f;
	var $Symbol = _global.Symbol;
	var $JSON$1 = _global.JSON;
	var _stringify = $JSON$1 && $JSON$1.stringify;
	var PROTOTYPE$2 = 'prototype';
	var HIDDEN = _wks('_hidden');
	var TO_PRIMITIVE = _wks('toPrimitive');
	var isEnum = {}.propertyIsEnumerable;
	var SymbolRegistry = _shared('symbol-registry');
	var AllSymbols = _shared('symbols');
	var OPSymbols = _shared('op-symbols');
	var ObjectProto$1 = Object[PROTOTYPE$2];
	var USE_NATIVE = typeof $Symbol == 'function' && !!_objectGops.f;
	var QObject = _global.QObject;
	// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
	var setter = !QObject || !QObject[PROTOTYPE$2] || !QObject[PROTOTYPE$2].findChild;

	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDesc = _descriptors && _fails(function () {
	  return _objectCreate(dP$1({}, 'a', {
	    get: function () { return dP$1(this, 'a', { value: 7 }).a; }
	  })).a != 7;
	}) ? function (it, key, D) {
	  var protoDesc = gOPD$1(ObjectProto$1, key);
	  if (protoDesc) delete ObjectProto$1[key];
	  dP$1(it, key, D);
	  if (protoDesc && it !== ObjectProto$1) dP$1(ObjectProto$1, key, protoDesc);
	} : dP$1;

	var wrap = function (tag) {
	  var sym = AllSymbols[tag] = _objectCreate($Symbol[PROTOTYPE$2]);
	  sym._k = tag;
	  return sym;
	};

	var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
	  return typeof it == 'symbol';
	} : function (it) {
	  return it instanceof $Symbol;
	};

	var $defineProperty = function defineProperty(it, key, D) {
	  if (it === ObjectProto$1) $defineProperty(OPSymbols, key, D);
	  _anObject(it);
	  key = _toPrimitive(key, true);
	  _anObject(D);
	  if (_has(AllSymbols, key)) {
	    if (!D.enumerable) {
	      if (!_has(it, HIDDEN)) dP$1(it, HIDDEN, _propertyDesc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if (_has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
	      D = _objectCreate(D, { enumerable: _propertyDesc(0, false) });
	    } return setSymbolDesc(it, key, D);
	  } return dP$1(it, key, D);
	};
	var $defineProperties = function defineProperties(it, P) {
	  _anObject(it);
	  var keys = _enumKeys(P = _toIobject(P));
	  var i = 0;
	  var l = keys.length;
	  var key;
	  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
	  return it;
	};
	var $create = function create(it, P) {
	  return P === undefined ? _objectCreate(it) : $defineProperties(_objectCreate(it), P);
	};
	var $propertyIsEnumerable = function propertyIsEnumerable(key) {
	  var E = isEnum.call(this, key = _toPrimitive(key, true));
	  if (this === ObjectProto$1 && _has(AllSymbols, key) && !_has(OPSymbols, key)) return false;
	  return E || !_has(this, key) || !_has(AllSymbols, key) || _has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
	};
	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
	  it = _toIobject(it);
	  key = _toPrimitive(key, true);
	  if (it === ObjectProto$1 && _has(AllSymbols, key) && !_has(OPSymbols, key)) return;
	  var D = gOPD$1(it, key);
	  if (D && _has(AllSymbols, key) && !(_has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
	  return D;
	};
	var $getOwnPropertyNames = function getOwnPropertyNames(it) {
	  var names = gOPN$1(_toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (!_has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
	  } return result;
	};
	var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
	  var IS_OP = it === ObjectProto$1;
	  var names = gOPN$1(IS_OP ? OPSymbols : _toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (_has(AllSymbols, key = names[i++]) && (IS_OP ? _has(ObjectProto$1, key) : true)) result.push(AllSymbols[key]);
	  } return result;
	};

	// 19.4.1.1 Symbol([description])
	if (!USE_NATIVE) {
	  $Symbol = function Symbol() {
	    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
	    var tag = _uid(arguments.length > 0 ? arguments[0] : undefined);
	    var $set = function (value) {
	      if (this === ObjectProto$1) $set.call(OPSymbols, value);
	      if (_has(this, HIDDEN) && _has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
	      setSymbolDesc(this, tag, _propertyDesc(1, value));
	    };
	    if (_descriptors && setter) setSymbolDesc(ObjectProto$1, tag, { configurable: true, set: $set });
	    return wrap(tag);
	  };
	  _redefine($Symbol[PROTOTYPE$2], 'toString', function toString() {
	    return this._k;
	  });

	  _objectGopd.f = $getOwnPropertyDescriptor;
	  _objectDp.f = $defineProperty;
	  _objectGopn.f = _objectGopnExt.f = $getOwnPropertyNames;
	  _objectPie.f = $propertyIsEnumerable;
	  _objectGops.f = $getOwnPropertySymbols;

	  if (_descriptors && !_library) {
	    _redefine(ObjectProto$1, 'propertyIsEnumerable', $propertyIsEnumerable, true);
	  }

	  _wksExt.f = function (name) {
	    return wrap(_wks(name));
	  };
	}

	_export(_export.G + _export.W + _export.F * !USE_NATIVE, { Symbol: $Symbol });

	for (var es6Symbols = (
	  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
	  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
	).split(','), j = 0; es6Symbols.length > j;)_wks(es6Symbols[j++]);

	for (var wellKnownSymbols = _objectKeys(_wks.store), k = 0; wellKnownSymbols.length > k;) _wksDefine(wellKnownSymbols[k++]);

	_export(_export.S + _export.F * !USE_NATIVE, 'Symbol', {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function (key) {
	    return _has(SymbolRegistry, key += '')
	      ? SymbolRegistry[key]
	      : SymbolRegistry[key] = $Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(sym) {
	    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
	    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
	  },
	  useSetter: function () { setter = true; },
	  useSimple: function () { setter = false; }
	});

	_export(_export.S + _export.F * !USE_NATIVE, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: $create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: $defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: $defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: $getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});

	// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
	// https://bugs.chromium.org/p/v8/issues/detail?id=3443
	var FAILS_ON_PRIMITIVES = _fails(function () { _objectGops.f(1); });

	_export(_export.S + _export.F * FAILS_ON_PRIMITIVES, 'Object', {
	  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
	    return _objectGops.f(_toObject(it));
	  }
	});

	// 24.3.2 JSON.stringify(value [, replacer [, space]])
	$JSON$1 && _export(_export.S + _export.F * (!USE_NATIVE || _fails(function () {
	  var S = $Symbol();
	  // MS Edge converts symbol values to JSON as {}
	  // WebKit converts symbol values to JSON as null
	  // V8 throws on boxed symbols
	  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
	})), 'JSON', {
	  stringify: function stringify(it) {
	    var args = [it];
	    var i = 1;
	    var replacer, $replacer;
	    while (arguments.length > i) args.push(arguments[i++]);
	    $replacer = replacer = args[1];
	    if (!_isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
	    if (!_isArray(replacer)) replacer = function (key, value) {
	      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
	      if (!isSymbol(value)) return value;
	    };
	    args[1] = replacer;
	    return _stringify.apply($JSON$1, args);
	  }
	});

	// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
	$Symbol[PROTOTYPE$2][TO_PRIMITIVE] || _hide($Symbol[PROTOTYPE$2], TO_PRIMITIVE, $Symbol[PROTOTYPE$2].valueOf);
	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	_setToStringTag($Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	_setToStringTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	_setToStringTag(_global.JSON, 'JSON', true);

	_wksDefine('asyncIterator');

	_wksDefine('observable');

	var symbol = _core.Symbol;

	var symbol$1 = symbol;

	var _typeof_1 = createCommonjsModule(function (module) {
	function _typeof2(obj) { if (typeof symbol$1 === "function" && typeof iterator$1 === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof symbol$1 === "function" && obj.constructor === symbol$1 && obj !== symbol$1.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

	function _typeof(obj) {
	  if (typeof symbol$1 === "function" && _typeof2(iterator$1) === "symbol") {
	    module.exports = _typeof = function _typeof(obj) {
	      return _typeof2(obj);
	    };
	  } else {
	    module.exports = _typeof = function _typeof(obj) {
	      return obj && typeof symbol$1 === "function" && obj.constructor === symbol$1 && obj !== symbol$1.prototype ? "symbol" : _typeof2(obj);
	    };
	  }

	  return _typeof(obj);
	}

	module.exports = _typeof;
	});

	var linebrk=function(str,maxLen){for(var res="",i=0;i+maxLen<str.length;)res+=str.substring(i,i+maxLen)+"\n",i+=maxLen;return res+str.substring(i,str.length)},detectEnvironment=function(){return "browser"},get32IntFromBuffer=function(buffer,offset){offset=offset||0;var size=0;if(0<(size=buffer.length-offset)){if(4<=size)return buffer.readUInt32BE(offset);for(var res=0,i=offset+size,d=0;i>offset;i--,d+=2)res+=buffer[i-1]*Math.pow(16,d);return res}return NaN},_={isObject:function isObject(value){var type=_typeof_1(value);return !!value&&("object"==type||"function"==type)},isString:function isString(value){return "string"==typeof value||value instanceof String},isNumber:function isNumber(value){return "number"==typeof value||!isNaN(_parseFloat$2(value))&&isFinite(value)},omit:function omit(obj,removeProp){var newObj={};for(var prop in obj)obj.hasOwnProperty(prop)&&prop!==removeProp&&(newObj[prop]=obj[prop]);return newObj}},trimSurroundingText=function(data,opening,closing){var trimStartIndex=0,trimEndIndex=data.length,openingBoundaryIndex=data.indexOf(opening);0<=openingBoundaryIndex&&(trimStartIndex=openingBoundaryIndex+opening.length);var closingBoundaryIndex=data.indexOf(closing,openingBoundaryIndex);return 0<=closingBoundaryIndex&&(trimEndIndex=closingBoundaryIndex),data.substring(trimStartIndex,trimEndIndex)},utils={linebrk:linebrk,detectEnvironment:detectEnvironment,get32IntFromBuffer:get32IntFromBuffer,_:_,trimSurroundingText:trimSurroundingText};

	var crypt = {};

	var dbits,_$1=utils._;function BigInteger(a,b){null!=a&&("number"==typeof a?this.fromNumber(a,b):isBuffer(a)?this.fromBuffer(a):null==b&&"string"!=typeof a?this.fromByteArray(a):this.fromString(a,b));}function nbi(){return new BigInteger(null)}function am3(i,x,w,j,c,n){for(var xl=16383&x,xh=x>>14;0<=--n;){var l=16383&this[i],h=this[i++]>>14,m=xh*l+h*xl;l=xl*l+((16383&m)<<14)+w[j]+c,c=(l>>28)+(m>>14)+xh*h,w[j++]=268435455&l;}return c}BigInteger.prototype.am=am3,dbits=28,BigInteger.prototype.DB=dbits,BigInteger.prototype.DM=(1<<dbits)-1,BigInteger.prototype.DV=1<<dbits;var BI_FP=52;BigInteger.prototype.FV=Math.pow(2,BI_FP),BigInteger.prototype.F1=BI_FP-dbits,BigInteger.prototype.F2=2*dbits-BI_FP;var rr,vv,BI_RM="0123456789abcdefghijklmnopqrstuvwxyz",BI_RC=[];for(rr="0".charCodeAt(0),vv=0;9>=vv;++vv)BI_RC[rr++]=vv;for(rr="a".charCodeAt(0),vv=10;36>vv;++vv)BI_RC[rr++]=vv;for(rr="A".charCodeAt(0),vv=10;36>vv;++vv)BI_RC[rr++]=vv;function int2char(n){return BI_RM.charAt(n)}function intAt(s,i){var c=BI_RC[s.charCodeAt(i)];return null==c?-1:c}function bnpCopyTo(r){for(var i=this.t-1;0<=i;--i)r[i]=this[i];r.t=this.t,r.s=this.s;}function bnpFromInt(x){this.t=1,this.s=0>x?-1:0,0<x?this[0]=x:-1>x?this[0]=x+DV:this.t=0;}function nbv(i){var r=nbi();return r.fromInt(i),r}function bnpFromString(data,radix,unsigned){var k;switch(radix){case 2:k=1;break;case 4:k=2;break;case 8:k=3;break;case 16:k=4;break;case 32:k=5;break;case 256:k=8;break;default:return void this.fromRadix(data,radix);}this.t=0,this.s=0;for(var i=data.length,mi=!1,sh=0;0<=--i;){var x=8==k?255&data[i]:intAt(data,i);if(0>x){"-"==data.charAt(i)&&(mi=!0);continue}mi=!1,0===sh?this[this.t++]=x:sh+k>this.DB?(this[this.t-1]|=(x&(1<<this.DB-sh)-1)<<sh,this[this.t++]=x>>this.DB-sh):this[this.t-1]|=x<<sh,sh+=k,sh>=this.DB&&(sh-=this.DB);}unsigned||8!=k||0==(128&data[0])||(this.s=-1,0<sh&&(this[this.t-1]|=(1<<this.DB-sh)-1<<sh)),this.clamp(),mi&&BigInteger.ZERO.subTo(this,this);}function bnpFromByteArray(a,unsigned){this.fromString(a,256,unsigned);}function bnpFromBuffer(a){this.fromString(a,256,!0);}function bnpClamp(){for(var c=this.s&this.DM;0<this.t&&this[this.t-1]==c;)--this.t;}function bnToString(b){if(0>this.s)return "-"+this.negate().toString(b);var k;if(16==b)k=4;else if(8==b)k=3;else if(2==b)k=1;else if(32==b)k=5;else if(4==b)k=2;else return this.toRadix(b);var d,km=(1<<k)-1,m=!1,r="",i=this.t,p=this.DB-i*this.DB%k;if(0<i--)for(p<this.DB&&0<(d=this[i]>>p)&&(m=!0,r=int2char(d));0<=i;)p<k?(d=(this[i]&(1<<p)-1)<<k-p,d|=this[--i]>>(p+=this.DB-k)):(d=this[i]>>(p-=k)&km,0>=p&&(p+=this.DB,--i)),0<d&&(m=!0),m&&(r+=int2char(d));return m?r:"0"}function bnNegate(){var r=nbi();return BigInteger.ZERO.subTo(this,r),r}function bnAbs(){return 0>this.s?this.negate():this}function bnCompareTo(a){var r=this.s-a.s;if(0!=r)return r;var i=this.t;if(r=i-a.t,0!=r)return 0>this.s?-r:r;for(;0<=--i;)if(0!=(r=this[i]-a[i]))return r;return 0}function nbits(x){var t,r=1;return 0!=(t=x>>>16)&&(x=t,r+=16),0!=(t=x>>8)&&(x=t,r+=8),0!=(t=x>>4)&&(x=t,r+=4),0!=(t=x>>2)&&(x=t,r+=2),0!=(t=x>>1)&&(x=t,r+=1),r}function bnBitLength(){return 0>=this.t?0:this.DB*(this.t-1)+nbits(this[this.t-1]^this.s&this.DM)}function bnpDLShiftTo(n,r){var i;for(i=this.t-1;0<=i;--i)r[i+n]=this[i];for(i=n-1;0<=i;--i)r[i]=0;r.t=this.t+n,r.s=this.s;}function bnpDRShiftTo(n,r){for(var i=n;i<this.t;++i)r[i-n]=this[i];r.t=Math.max(this.t-n,0),r.s=this.s;}function bnpLShiftTo(n,r){var i,bs=n%this.DB,cbs=this.DB-bs,ds=Math.floor(n/this.DB),c=this.s<<bs&this.DM;for(i=this.t-1;0<=i;--i)r[i+ds+1]=this[i]>>cbs|c,c=(this[i]&(1<<cbs)-1)<<bs;for(i=ds-1;0<=i;--i)r[i]=0;r[ds]=c,r.t=this.t+ds+1,r.s=this.s,r.clamp();}function bnpRShiftTo(n,r){r.s=this.s;var ds=Math.floor(n/this.DB);if(ds>=this.t)return void(r.t=0);var bs=n%this.DB,cbs=this.DB-bs,bm=(1<<bs)-1;r[0]=this[ds]>>bs;for(var i=ds+1;i<this.t;++i)r[i-ds-1]|=(this[i]&bm)<<cbs,r[i-ds]=this[i]>>bs;0<bs&&(r[this.t-ds-1]|=(this.s&bm)<<cbs),r.t=this.t-ds,r.clamp();}function bnpSubTo(a,r){for(var i=0,c=0,m=Math.min(a.t,this.t);i<m;)c+=this[i]-a[i],r[i++]=c&this.DM,c>>=this.DB;if(a.t<this.t){for(c-=a.s;i<this.t;)c+=this[i],r[i++]=c&this.DM,c>>=this.DB;c+=this.s;}else{for(c+=this.s;i<a.t;)c-=a[i],r[i++]=c&this.DM,c>>=this.DB;c-=a.s;}r.s=0>c?-1:0,-1>c?r[i++]=this.DV+c:0<c&&(r[i++]=c),r.t=i,r.clamp();}function bnpMultiplyTo(a,r){var x=this.abs(),y=a.abs(),i=x.t;for(r.t=i+y.t;0<=--i;)r[i]=0;for(i=0;i<y.t;++i)r[i+x.t]=x.am(0,y[i],r,i,0,x.t);r.s=0,r.clamp(),this.s!=a.s&&BigInteger.ZERO.subTo(r,r);}function bnpSquareTo(r){for(var x=this.abs(),i=r.t=2*x.t;0<=--i;)r[i]=0;for(i=0;i<x.t-1;++i){var c=x.am(i,x[i],r,2*i,0,1);(r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1))>=x.DV&&(r[i+x.t]-=x.DV,r[i+x.t+1]=1);}0<r.t&&(r[r.t-1]+=x.am(i,x[i],r,2*i,0,1)),r.s=0,r.clamp();}function bnpDivRemTo(m,q,r){var pm=m.abs();if(!(0>=pm.t)){var pt=this.abs();if(pt.t<pm.t)return null!=q&&q.fromInt(0),void(null!=r&&this.copyTo(r));null==r&&(r=nbi());var y=nbi(),ts=this.s,ms=m.s,nsh=this.DB-nbits(pm[pm.t-1]);0<nsh?(pm.lShiftTo(nsh,y),pt.lShiftTo(nsh,r)):(pm.copyTo(y),pt.copyTo(r));var ys=y.t,y0=y[ys-1];if(0!==y0){var yt=y0*(1<<this.F1)+(1<ys?y[ys-2]>>this.F2:0),d1=this.FV/yt,d2=(1<<this.F1)/yt,e=1<<this.F2,i=r.t,j=i-ys,t=null==q?nbi():q;for(y.dlShiftTo(j,t),0<=r.compareTo(t)&&(r[r.t++]=1,r.subTo(t,r)),BigInteger.ONE.dlShiftTo(ys,t),t.subTo(y,y);y.t<ys;)y[y.t++]=0;for(;0<=--j;){var qd=r[--i]==y0?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);if((r[i]+=y.am(0,qd,r,j,0,ys))<qd)for(y.dlShiftTo(j,t),r.subTo(t,r);r[i]<--qd;)r.subTo(t,r);}null!=q&&(r.drShiftTo(ys,q),ts!=ms&&BigInteger.ZERO.subTo(q,q)),r.t=ys,r.clamp(),0<nsh&&r.rShiftTo(nsh,r),0>ts&&BigInteger.ZERO.subTo(r,r);}}}function bnMod(a){var r=nbi();return this.abs().divRemTo(a,null,r),0>this.s&&0<r.compareTo(BigInteger.ZERO)&&a.subTo(r,r),r}function Classic(m){this.m=m;}function cConvert(x){return 0>x.s||0<=x.compareTo(this.m)?x.mod(this.m):x}function cRevert(x){return x}function cReduce(x){x.divRemTo(this.m,null,x);}function cMulTo(x,y,r){x.multiplyTo(y,r),this.reduce(r);}function cSqrTo(x,r){x.squareTo(r),this.reduce(r);}Classic.prototype.convert=cConvert,Classic.prototype.revert=cRevert,Classic.prototype.reduce=cReduce,Classic.prototype.mulTo=cMulTo,Classic.prototype.sqrTo=cSqrTo;function bnpInvDigit(){if(1>this.t)return 0;var x=this[0];if(0==(1&x))return 0;var y=3&x;return y=15&y*(2-(15&x)*y),y=255&y*(2-(255&x)*y),y=65535&y*(2-(65535&(65535&x)*y)),y=y*(2-x*y%this.DV)%this.DV,0<y?this.DV-y:-y}function Montgomery(m){this.m=m,this.mp=m.invDigit(),this.mpl=32767&this.mp,this.mph=this.mp>>15,this.um=(1<<m.DB-15)-1,this.mt2=2*m.t;}function montConvert(x){var r=nbi();return x.abs().dlShiftTo(this.m.t,r),r.divRemTo(this.m,null,r),0>x.s&&0<r.compareTo(BigInteger.ZERO)&&this.m.subTo(r,r),r}function montRevert(x){var r=nbi();return x.copyTo(r),this.reduce(r),r}function montReduce(x){for(;x.t<=this.mt2;)x[x.t++]=0;for(var i=0;i<this.m.t;++i){var j=32767&x[i],u0=j*this.mpl+((j*this.mph+(x[i]>>15)*this.mpl&this.um)<<15)&x.DM;for(j=i+this.m.t,x[j]+=this.m.am(0,u0,x,i,0,this.m.t);x[j]>=x.DV;)x[j]-=x.DV,x[++j]++;}x.clamp(),x.drShiftTo(this.m.t,x),0<=x.compareTo(this.m)&&x.subTo(this.m,x);}function montSqrTo(x,r){x.squareTo(r),this.reduce(r);}function montMulTo(x,y,r){x.multiplyTo(y,r),this.reduce(r);}Montgomery.prototype.convert=montConvert,Montgomery.prototype.revert=montRevert,Montgomery.prototype.reduce=montReduce,Montgomery.prototype.mulTo=montMulTo,Montgomery.prototype.sqrTo=montSqrTo;function bnpIsEven(){return 0===(0<this.t?1&this[0]:this.s)}function bnpExp(e,z){if(4294967295<e||1>e)return BigInteger.ONE;var r=nbi(),r2=nbi(),g=z.convert(this),i=nbits(e)-1;for(g.copyTo(r);0<=--i;)if(z.sqrTo(r,r2),0<(e&1<<i))z.mulTo(r2,g,r);else{var t=r;r=r2,r2=t;}return z.revert(r)}function bnModPowInt(e,m){var z;return z=256>e||m.isEven()?new Classic(m):new Montgomery(m),this.exp(e,z)}function bnClone(){var r=nbi();return this.copyTo(r),r}function bnIntValue(){if(0>this.s){if(1==this.t)return this[0]-this.DV;if(0===this.t)return -1}else{if(1==this.t)return this[0];if(0===this.t)return 0}return (this[1]&(1<<32-this.DB)-1)<<this.DB|this[0]}function bnByteValue(){return 0==this.t?this.s:this[0]<<24>>24}function bnShortValue(){return 0==this.t?this.s:this[0]<<16>>16}function bnpChunkSize(r){return Math.floor(Math.LN2*this.DB/Math.log(r))}function bnSigNum(){return 0>this.s?-1:0>=this.t||1==this.t&&0>=this[0]?0:1}function bnpToRadix(b){if(null==b&&(b=10),0===this.signum()||2>b||36<b)return "0";var cs=this.chunkSize(b),a=Math.pow(b,cs),d=nbv(a),y=nbi(),z=nbi(),r="";for(this.divRemTo(d,y,z);0<y.signum();)r=(a+z.intValue()).toString(b).substr(1)+r,y.divRemTo(d,y,z);return z.intValue().toString(b)+r}function bnpFromRadix(s,b){this.fromInt(0),null==b&&(b=10);for(var x,cs=this.chunkSize(b),d=Math.pow(b,cs),mi=!1,j=0,w=0,i=0;i<s.length;++i){if(x=intAt(s,i),0>x){"-"==s.charAt(i)&&0===this.signum()&&(mi=!0);continue}w=b*w+x,++j>=cs&&(this.dMultiply(d),this.dAddOffset(w,0),j=0,w=0);}0<j&&(this.dMultiply(Math.pow(b,j)),this.dAddOffset(w,0)),mi&&BigInteger.ZERO.subTo(this,this);}function bnpFromNumber(a,b){if(!("number"==typeof b)){var x=crypt.randomBytes((a>>3)+1),t=7&a;0<t?x[0]&=(1<<t)-1:x[0]=0,this.fromByteArray(x);}else if(2>a)this.fromInt(1);else for(this.fromNumber(a),this.testBit(a-1)||this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this),this.isEven()&&this.dAddOffset(1,0);!this.isProbablePrime(b);)this.dAddOffset(2,0),this.bitLength()>a&&this.subTo(BigInteger.ONE.shiftLeft(a-1),this);}function bnToByteArray(){var i=this.t,r=[];r[0]=this.s;var d,p=this.DB-i*this.DB%8,k=0;if(0<i--)for(p<this.DB&&(d=this[i]>>p)!=(this.s&this.DM)>>p&&(r[k++]=d|this.s<<this.DB-p);0<=i;)8>p?(d=(this[i]&(1<<p)-1)<<8-p,d|=this[--i]>>(p+=this.DB-8)):(d=255&this[i]>>(p-=8),0>=p&&(p+=this.DB,--i)),0!=(128&d)&&(d|=-256),0==k&&(128&this.s)!=(128&d)&&++k,(0<k||d!=this.s)&&(r[k++]=d);return r}function bnToBuffer(trimOrSize){var res=Buffer.from(this.toByteArray());if(!0===trimOrSize&&0===res[0])res=res.slice(1);else if(_$1.isNumber(trimOrSize)){if(res.length>trimOrSize){for(var i=0;i<res.length-trimOrSize;i++)if(0!==res[i])return null;return res.slice(res.length-trimOrSize)}if(res.length<trimOrSize){var padded=Buffer.alloc(trimOrSize);return padded.fill(0,0,trimOrSize-res.length),res.copy(padded,trimOrSize-res.length),padded}}return res}function bnEquals(a){return 0==this.compareTo(a)}function bnMin(a){return 0>this.compareTo(a)?this:a}function bnMax(a){return 0<this.compareTo(a)?this:a}function bnpBitwiseTo(a,op,r){var i,f,m=Math.min(a.t,this.t);for(i=0;i<m;++i)r[i]=op(this[i],a[i]);if(a.t<this.t){for(f=a.s&this.DM,i=m;i<this.t;++i)r[i]=op(this[i],f);r.t=this.t;}else{for(f=this.s&this.DM,i=m;i<a.t;++i)r[i]=op(f,a[i]);r.t=a.t;}r.s=op(this.s,a.s),r.clamp();}function op_and(x,y){return x&y}function bnAnd(a){var r=nbi();return this.bitwiseTo(a,op_and,r),r}function op_or(x,y){return x|y}function bnOr(a){var r=nbi();return this.bitwiseTo(a,op_or,r),r}function op_xor(x,y){return x^y}function bnXor(a){var r=nbi();return this.bitwiseTo(a,op_xor,r),r}function op_andnot(x,y){return x&~y}function bnAndNot(a){var r=nbi();return this.bitwiseTo(a,op_andnot,r),r}function bnNot(){for(var r=nbi(),i=0;i<this.t;++i)r[i]=this.DM&~this[i];return r.t=this.t,r.s=~this.s,r}function bnShiftLeft(n){var r=nbi();return 0>n?this.rShiftTo(-n,r):this.lShiftTo(n,r),r}function bnShiftRight(n){var r=nbi();return 0>n?this.lShiftTo(-n,r):this.rShiftTo(n,r),r}function lbit(x){if(0===x)return -1;var r=0;return 0==(65535&x)&&(x>>=16,r+=16),0==(255&x)&&(x>>=8,r+=8),0==(15&x)&&(x>>=4,r+=4),0==(3&x)&&(x>>=2,r+=2),0==(1&x)&&++r,r}function bnGetLowestSetBit(){for(var i=0;i<this.t;++i)if(0!=this[i])return i*this.DB+lbit(this[i]);return 0>this.s?this.t*this.DB:-1}function cbit(x){for(var r=0;0!=x;)x&=x-1,++r;return r}function bnBitCount(){for(var r=0,x=this.s&this.DM,i=0;i<this.t;++i)r+=cbit(this[i]^x);return r}function bnTestBit(n){var j=Math.floor(n/this.DB);return j>=this.t?0!=this.s:0!=(this[j]&1<<n%this.DB)}function bnpChangeBit(n,op){var r=BigInteger.ONE.shiftLeft(n);return this.bitwiseTo(r,op,r),r}function bnSetBit(n){return this.changeBit(n,op_or)}function bnClearBit(n){return this.changeBit(n,op_andnot)}function bnFlipBit(n){return this.changeBit(n,op_xor)}function bnpAddTo(a,r){for(var i=0,c=0,m=Math.min(a.t,this.t);i<m;)c+=this[i]+a[i],r[i++]=c&this.DM,c>>=this.DB;if(a.t<this.t){for(c+=a.s;i<this.t;)c+=this[i],r[i++]=c&this.DM,c>>=this.DB;c+=this.s;}else{for(c+=this.s;i<a.t;)c+=a[i],r[i++]=c&this.DM,c>>=this.DB;c+=a.s;}r.s=0>c?-1:0,0<c?r[i++]=c:-1>c&&(r[i++]=this.DV+c),r.t=i,r.clamp();}function bnAdd(a){var r=nbi();return this.addTo(a,r),r}function bnSubtract(a){var r=nbi();return this.subTo(a,r),r}function bnMultiply(a){var r=nbi();return this.multiplyTo(a,r),r}function bnSquare(){var r=nbi();return this.squareTo(r),r}function bnDivide(a){var r=nbi();return this.divRemTo(a,r,null),r}function bnRemainder(a){var r=nbi();return this.divRemTo(a,null,r),r}function bnDivideAndRemainder(a){var q=nbi(),r=nbi();return this.divRemTo(a,q,r),[q,r]}function bnpDMultiply(n){this[this.t]=this.am(0,n-1,this,0,0,this.t),++this.t,this.clamp();}function bnpDAddOffset(n,w){if(0!==n){for(;this.t<=w;)this[this.t++]=0;for(this[w]+=n;this[w]>=this.DV;)this[w]-=this.DV,++w>=this.t&&(this[this.t++]=0),++this[w];}}function NullExp(){}function nNop(x){return x}function nMulTo(x,y,r){x.multiplyTo(y,r);}function nSqrTo(x,r){x.squareTo(r);}NullExp.prototype.convert=nNop,NullExp.prototype.revert=nNop,NullExp.prototype.mulTo=nMulTo,NullExp.prototype.sqrTo=nSqrTo;function bnPow(e){return this.exp(e,new NullExp)}function bnpMultiplyLowerTo(a,n,r){var i=Math.min(this.t+a.t,n);for(r.s=0,r.t=i;0<i;)r[--i]=0;var j;for(j=r.t-this.t;i<j;++i)r[i+this.t]=this.am(0,a[i],r,i,0,this.t);for(j=Math.min(a.t,n);i<j;++i)this.am(0,a[i],r,i,0,n-i);r.clamp();}function bnpMultiplyUpperTo(a,n,r){--n;var i=r.t=this.t+a.t-n;for(r.s=0;0<=--i;)r[i]=0;for(i=Math.max(n-this.t,0);i<a.t;++i)r[this.t+i-n]=this.am(n-i,a[i],r,0,0,this.t+i-n);r.clamp(),r.drShiftTo(1,r);}function Barrett(m){this.r2=nbi(),this.q3=nbi(),BigInteger.ONE.dlShiftTo(2*m.t,this.r2),this.mu=this.r2.divide(m),this.m=m;}function barrettConvert(x){if(0>x.s||x.t>2*this.m.t)return x.mod(this.m);if(0>x.compareTo(this.m))return x;var r=nbi();return x.copyTo(r),this.reduce(r),r}function barrettRevert(x){return x}function barrettReduce(x){for(x.drShiftTo(this.m.t-1,this.r2),x.t>this.m.t+1&&(x.t=this.m.t+1,x.clamp()),this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3),this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);0>x.compareTo(this.r2);)x.dAddOffset(1,this.m.t+1);for(x.subTo(this.r2,x);0<=x.compareTo(this.m);)x.subTo(this.m,x);}function barrettSqrTo(x,r){x.squareTo(r),this.reduce(r);}function barrettMulTo(x,y,r){x.multiplyTo(y,r),this.reduce(r);}Barrett.prototype.convert=barrettConvert,Barrett.prototype.revert=barrettRevert,Barrett.prototype.reduce=barrettReduce,Barrett.prototype.mulTo=barrettMulTo,Barrett.prototype.sqrTo=barrettSqrTo;function bnModPow(e,m){var k,z,i=e.bitLength(),r=nbv(1);if(0>=i)return r;k=18>i?1:48>i?3:144>i?4:768>i?5:6,z=8>i?new Classic(m):m.isEven()?new Barrett(m):new Montgomery(m);var g=[],n=3,k1=k-1,km=(1<<k)-1;if(g[1]=z.convert(this),1<k){var g2=nbi();for(z.sqrTo(g[1],g2);n<=km;)g[n]=nbi(),z.mulTo(g2,g[n-2],g[n]),n+=2;}var w,t,j=e.t-1,is1=!0,r2=nbi();for(i=nbits(e[j])-1;0<=j;){for(i>=k1?w=e[j]>>i-k1&km:(w=(e[j]&(1<<i+1)-1)<<k1-i,0<j&&(w|=e[j-1]>>this.DB+i-k1)),n=k;0==(1&w);)w>>=1,--n;if(0>(i-=n)&&(i+=this.DB,--j),is1)g[w].copyTo(r),is1=!1;else{for(;1<n;)z.sqrTo(r,r2),z.sqrTo(r2,r),n-=2;0<n?z.sqrTo(r,r2):(t=r,r=r2,r2=t),z.mulTo(r2,g[w],r);}for(;0<=j&&0==(e[j]&1<<i);)z.sqrTo(r,r2),t=r,r=r2,r2=t,0>--i&&(i=this.DB-1,--j);}return z.revert(r)}function bnGCD(a){var x=0>this.s?this.negate():this.clone(),y=0>a.s?a.negate():a.clone();if(0>x.compareTo(y)){var t=x;x=y,y=t;}var i=x.getLowestSetBit(),g=y.getLowestSetBit();if(0>g)return x;for(i<g&&(g=i),0<g&&(x.rShiftTo(g,x),y.rShiftTo(g,y));0<x.signum();)0<(i=x.getLowestSetBit())&&x.rShiftTo(i,x),0<(i=y.getLowestSetBit())&&y.rShiftTo(i,y),0<=x.compareTo(y)?(x.subTo(y,x),x.rShiftTo(1,x)):(y.subTo(x,y),y.rShiftTo(1,y));return 0<g&&y.lShiftTo(g,y),y}function bnpModInt(n){if(0>=n)return 0;var d=this.DV%n,r=0>this.s?n-1:0;if(0<this.t)if(0==d)r=this[0]%n;else for(var i=this.t-1;0<=i;--i)r=(d*r+this[i])%n;return r}function bnModInverse(m){var ac=m.isEven();if(this.isEven()&&ac||0===m.signum())return BigInteger.ZERO;for(var u=m.clone(),v=this.clone(),a=nbv(1),b=nbv(0),c=nbv(0),d=nbv(1);0!=u.signum();){for(;u.isEven();)u.rShiftTo(1,u),ac?((!a.isEven()||!b.isEven())&&(a.addTo(this,a),b.subTo(m,b)),a.rShiftTo(1,a)):!b.isEven()&&b.subTo(m,b),b.rShiftTo(1,b);for(;v.isEven();)v.rShiftTo(1,v),ac?((!c.isEven()||!d.isEven())&&(c.addTo(this,c),d.subTo(m,d)),c.rShiftTo(1,c)):!d.isEven()&&d.subTo(m,d),d.rShiftTo(1,d);0<=u.compareTo(v)?(u.subTo(v,u),ac&&a.subTo(c,a),b.subTo(d,b)):(v.subTo(u,v),ac&&c.subTo(a,c),d.subTo(b,d));}if(0!=v.compareTo(BigInteger.ONE))return BigInteger.ZERO;if(0<=d.compareTo(m))return d.subtract(m);if(0>d.signum())d.addTo(m,d);else return d;return 0>d.signum()?d.add(m):d}var lowprimes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997],lplim=(1<<26)/lowprimes[lowprimes.length-1];function bnIsProbablePrime(t){var i,x=this.abs();if(1==x.t&&x[0]<=lowprimes[lowprimes.length-1]){for(i=0;i<lowprimes.length;++i)if(x[0]==lowprimes[i])return !0;return !1}if(x.isEven())return !1;for(i=1;i<lowprimes.length;){for(var m=lowprimes[i],j=i+1;j<lowprimes.length&&m<lplim;)m*=lowprimes[j++];for(m=x.modInt(m);i<j;)if(0==m%lowprimes[i++])return !1}return x.millerRabin(t)}function bnpMillerRabin(t){var n1=this.subtract(BigInteger.ONE),k=n1.getLowestSetBit();if(0>=k)return !1;var r=n1.shiftRight(k);t=t+1>>1,t>lowprimes.length&&(t=lowprimes.length);for(var a=nbi(),i=0;i<t;++i){a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);var y=a.modPow(r,this);if(0!=y.compareTo(BigInteger.ONE)&&0!=y.compareTo(n1)){for(var j=1;j++<k&&0!=y.compareTo(n1);)if(y=y.modPowInt(2,this),0===y.compareTo(BigInteger.ONE))return !1;if(0!=y.compareTo(n1))return !1}}return !0}BigInteger.prototype.copyTo=bnpCopyTo,BigInteger.prototype.fromInt=bnpFromInt,BigInteger.prototype.fromString=bnpFromString,BigInteger.prototype.fromByteArray=bnpFromByteArray,BigInteger.prototype.fromBuffer=bnpFromBuffer,BigInteger.prototype.clamp=bnpClamp,BigInteger.prototype.dlShiftTo=bnpDLShiftTo,BigInteger.prototype.drShiftTo=bnpDRShiftTo,BigInteger.prototype.lShiftTo=bnpLShiftTo,BigInteger.prototype.rShiftTo=bnpRShiftTo,BigInteger.prototype.subTo=bnpSubTo,BigInteger.prototype.multiplyTo=bnpMultiplyTo,BigInteger.prototype.squareTo=bnpSquareTo,BigInteger.prototype.divRemTo=bnpDivRemTo,BigInteger.prototype.invDigit=bnpInvDigit,BigInteger.prototype.isEven=bnpIsEven,BigInteger.prototype.exp=bnpExp,BigInteger.prototype.chunkSize=bnpChunkSize,BigInteger.prototype.toRadix=bnpToRadix,BigInteger.prototype.fromRadix=bnpFromRadix,BigInteger.prototype.fromNumber=bnpFromNumber,BigInteger.prototype.bitwiseTo=bnpBitwiseTo,BigInteger.prototype.changeBit=bnpChangeBit,BigInteger.prototype.addTo=bnpAddTo,BigInteger.prototype.dMultiply=bnpDMultiply,BigInteger.prototype.dAddOffset=bnpDAddOffset,BigInteger.prototype.multiplyLowerTo=bnpMultiplyLowerTo,BigInteger.prototype.multiplyUpperTo=bnpMultiplyUpperTo,BigInteger.prototype.modInt=bnpModInt,BigInteger.prototype.millerRabin=bnpMillerRabin,BigInteger.prototype.toString=bnToString,BigInteger.prototype.negate=bnNegate,BigInteger.prototype.abs=bnAbs,BigInteger.prototype.compareTo=bnCompareTo,BigInteger.prototype.bitLength=bnBitLength,BigInteger.prototype.mod=bnMod,BigInteger.prototype.modPowInt=bnModPowInt,BigInteger.prototype.clone=bnClone,BigInteger.prototype.intValue=bnIntValue,BigInteger.prototype.byteValue=bnByteValue,BigInteger.prototype.shortValue=bnShortValue,BigInteger.prototype.signum=bnSigNum,BigInteger.prototype.toByteArray=bnToByteArray,BigInteger.prototype.toBuffer=bnToBuffer,BigInteger.prototype.equals=bnEquals,BigInteger.prototype.min=bnMin,BigInteger.prototype.max=bnMax,BigInteger.prototype.and=bnAnd,BigInteger.prototype.or=bnOr,BigInteger.prototype.xor=bnXor,BigInteger.prototype.andNot=bnAndNot,BigInteger.prototype.not=bnNot,BigInteger.prototype.shiftLeft=bnShiftLeft,BigInteger.prototype.shiftRight=bnShiftRight,BigInteger.prototype.getLowestSetBit=bnGetLowestSetBit,BigInteger.prototype.bitCount=bnBitCount,BigInteger.prototype.testBit=bnTestBit,BigInteger.prototype.setBit=bnSetBit,BigInteger.prototype.clearBit=bnClearBit,BigInteger.prototype.flipBit=bnFlipBit,BigInteger.prototype.add=bnAdd,BigInteger.prototype.subtract=bnSubtract,BigInteger.prototype.multiply=bnMultiply,BigInteger.prototype.divide=bnDivide,BigInteger.prototype.remainder=bnRemainder,BigInteger.prototype.divideAndRemainder=bnDivideAndRemainder,BigInteger.prototype.modPow=bnModPow,BigInteger.prototype.modInverse=bnModInverse,BigInteger.prototype.pow=bnPow,BigInteger.prototype.gcd=bnGCD,BigInteger.prototype.isProbablePrime=bnIsProbablePrime,BigInteger.int2char=int2char,BigInteger.ZERO=nbv(0),BigInteger.ONE=nbv(1),BigInteger.prototype.square=bnSquare;var jsbn=BigInteger;

	var createHash = crypt.createHash;

	var randomBytes=function(size){var MAX_BYTES=65536;if(size>4294967295)throw new RangeError("requested too many random bytes");var bytes=Buffer.allocUnsafe(size);if(0<size)if(size>MAX_BYTES)for(var generated=0;generated<size;generated+=MAX_BYTES)getRandomValues(bytes.slice(generated,generated+MAX_BYTES));else getRandomValues(bytes);return bytes};function getRandomValues(ar){for(var i=0;i<ar.length;i++)ar[i]=Math.floor(256*Math.random());}

	var safeBuffer = createCommonjsModule(function (module, exports) {
	/* eslint-disable node/no-deprecated-api */

	var Buffer = bufferEs6.Buffer;

	// alternative to using Object.keys for old browsers
	function copyProps (src, dst) {
	  for (var key in src) {
	    dst[key] = src[key];
	  }
	}
	if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
	  module.exports = bufferEs6;
	} else {
	  // Copy properties from require('buffer')
	  copyProps(bufferEs6, exports);
	  exports.Buffer = SafeBuffer;
	}

	function SafeBuffer (arg, encodingOrOffset, length) {
	  return Buffer(arg, encodingOrOffset, length)
	}

	SafeBuffer.prototype = Object.create(Buffer.prototype);

	// Copy static methods from Buffer
	copyProps(Buffer, SafeBuffer);

	SafeBuffer.from = function (arg, encodingOrOffset, length) {
	  if (typeof arg === 'number') {
	    throw new TypeError('Argument must not be a number')
	  }
	  return Buffer(arg, encodingOrOffset, length)
	};

	SafeBuffer.alloc = function (size, fill, encoding) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  var buf = Buffer(size);
	  if (fill !== undefined) {
	    if (typeof encoding === 'string') {
	      buf.fill(fill, encoding);
	    } else {
	      buf.fill(fill);
	    }
	  } else {
	    buf.fill(0);
	  }
	  return buf
	};

	SafeBuffer.allocUnsafe = function (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  return Buffer(size)
	};

	SafeBuffer.allocUnsafeSlow = function (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  return bufferEs6.SlowBuffer(size)
	};
	});
	var safeBuffer_1 = safeBuffer.Buffer;

	var Buffer$1=safeBuffer.Buffer,mgf=function(seed,len){for(var c,hash=2<arguments.length&&void 0!==arguments[2]?arguments[2]:"sha1",t=Buffer$1.alloc(0),i=0;t.length<len;)c=i2ops(i++),t=Buffer$1.concat([t,createHash(hash).update(seed).update(c).digest()]);return t.slice(0,len)};function i2ops(c){var out=Buffer$1.allocUnsafe(4);return out.writeUInt32BE(c,0),out}

	var xor=function(a,b){for(var len=a.length,i=-1;++i<len;)a[i]^=b[i];return a};

	function getHashLength(){var hash=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"sha256";hash=hash.toLowerCase();var len=0;return "md5-96"===hash||"sha1-96"===hash||"sha256-96"===hash||"sha512-96"===hash?(hash=hash.substr(0,-3),len=12):"md2"===hash||"md5"===hash?len=16:"sha1"===hash?len=20:"sha256"===hash?len=32:"sha384"===hash?len=48:"sha512"===hash?len=64:void 0,len}var rsaOaepEncrypt=function(){for(var r,_ref=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{},_ref$data=_ref.data,data=void 0===_ref$data?"":_ref$data,_ref$mgf=_ref.mgf,mgf$1=void 0===_ref$mgf?"sha1":_ref$mgf,_ref$pad=_ref.pad1,pad1=void 0===_ref$pad?"":_ref$pad,_ref$hash=_ref.hash,hash=void 0===_ref$hash?"sha256":_ref$hash,_ref$encryptedDataLen=_ref.encryptedDataLength,encryptedDataLength=void 0===_ref$encryptedDataLen?256:_ref$encryptedDataLen,_pad1=createHash(hash).update(pad1,"utf8").digest(),hlen=getHashLength(hash),filled=Buffer.alloc(encryptedDataLength-data.length-2*hlen-2),rand=randomBytes(32),i=0;i<rand.length;i++){for(r=rand[i];0===r;)r=randomBytes(1)[0];rand[i]=r;}var $db=Buffer.concat([_pad1,filled,Buffer.from(String.fromCharCode(1)),data]),$dbMask=mgf(rand,encryptedDataLength-hlen-1,mgf$1),$maskedDB=xor($db,$dbMask),$seedMask=mgf($maskedDB,hlen,mgf$1),$maskedSeed=xor(rand,$seedMask),$em=Buffer.concat([Buffer.from(String.fromCharCode(0)),$maskedSeed,$maskedDB]);return $em};

	var SIGN_INFO_HEAD={md2:Buffer.from("3020300c06082a864886f70d020205000410","hex"),md5:Buffer.from("3020300c06082a864886f70d020505000410","hex"),sha1:Buffer.from("3021300906052b0e03021a05000414","hex"),sha224:Buffer.from("302d300d06096086480165030402040500041c","hex"),sha256:Buffer.from("3031300d060960864801650304020105000420","hex"),sha384:Buffer.from("3041300d060960864801650304020205000430","hex"),sha512:Buffer.from("3051300d060960864801650304020305000440","hex"),ripemd160:Buffer.from("3021300906052b2403020105000414","hex"),rmd160:Buffer.from("3021300906052b2403020105000414","hex")},SIGN_ALG_TO_HASH_ALIASES={ripemd160:"rmd160"},DEFAULT_HASH_FUNCTION="sha256",pkcs1={isEncryption:!0,isSignature:!0},makeScheme=function(key,options){function Scheme(key,options){this.key=key,this.options=options;}return Scheme.prototype.maxMessageLength=function(){return this.options.encryptionSchemeOptions&&this.options.encryptionSchemeOptions.padding==constants.RSA_NO_PADDING?this.key.encryptedDataLength:this.key.encryptedDataLength-11},Scheme.prototype.encPad=function(buffer,options){options=options||{};var filled;if(buffer.length>this.key.maxMessageLength)throw new Error("Message too long for RSA (n="+this.key.encryptedDataLength+", l="+buffer.length+")");if(this.options.encryptionSchemeOptions&&this.options.encryptionSchemeOptions.padding==constants.RSA_NO_PADDING)return filled=Buffer.alloc(this.key.maxMessageLength-buffer.length),filled.fill(0),Buffer.concat([filled,buffer]);if(1===options.type)return filled=Buffer.alloc(this.key.encryptedDataLength-buffer.length-1),filled.fill(255,0,filled.length-1),filled[0]=1,filled[filled.length-1]=0,Buffer.concat([filled,buffer]);if(this.options&&this.options.encryptionSchemeOptions&&this.options.encryptionSchemeOptions.mgf){var _this$options$encrypt=this.options.encryptionSchemeOptions,mgf=_this$options$encrypt.mgf,hash=_this$options$encrypt.hash;return rsaOaepEncrypt({data:buffer,mgf:mgf,hash:hash,encryptedDataLength:this.encryptedDataLength})}filled=Buffer.alloc(this.key.encryptedDataLength-buffer.length),filled[0]=0,filled[1]=2;for(var r,rand=crypt.randomBytes(filled.length-3),i=0;i<rand.length;i++){for(r=rand[i];0===r;)r=crypt.randomBytes(1)[0];filled[i+2]=r;}return filled[filled.length-1]=0,Buffer.concat([filled,buffer])},Scheme.prototype.yihuo=function(bin1,bin2){return bin1.split("").map(function(bit,i){return bit===bin2[i]?0:1}).join("")},Scheme.prototype.hexToBin=function(str){for(var hex_array=[{key:0,val:"0000"},{key:1,val:"0001"},{key:2,val:"0010"},{key:3,val:"0011"},{key:4,val:"0100"},{key:5,val:"0101"},{key:6,val:"0110"},{key:7,val:"0111"},{key:8,val:"1000"},{key:9,val:"1001"},{key:"a",val:"1010"},{key:"b",val:"1011"},{key:"c",val:"1100"},{key:"d",val:"1101"},{key:"e",val:"1110"},{key:"f",val:"1111"}],value="",i=0;i<str.length;i++)for(var j=0;j<hex_array.length;j++)if(str.charAt(i)==hex_array[j].key){value=value.concat(hex_array[j].val);break}return value},Scheme.prototype.binToHex=function(str){var hex_array=[{key:0,val:"0000"},{key:1,val:"0001"},{key:2,val:"0010"},{key:3,val:"0011"},{key:4,val:"0100"},{key:5,val:"0101"},{key:6,val:"0110"},{key:7,val:"0111"},{key:8,val:"1000"},{key:9,val:"1001"},{key:"a",val:"1010"},{key:"b",val:"1011"},{key:"c",val:"1100"},{key:"d",val:"1101"},{key:"e",val:"1110"},{key:"f",val:"1111"}],value="",list=[];if(0!=str.length%4){var b="0000".substring(0,4-str.length%4);str=b.concat(str);}for(;4<str.length;)list.push(str.substring(0,4)),str=str.substring(4);list.push(str);for(var i=0;i<list.length;i++)for(var j=0;j<hex_array.length;j++)if(list[i]==hex_array[j].val){value=value.concat(hex_array[j].key);break}return value},Scheme.prototype._mgf1=function($mgfSeed,$maskLen){for(var $c,$t=[],$count=Math.ceil($maskLen/20),$i=0;$i<$count;$i++)$c=this.unsignedLongBuffer($i),$t.push(crypt.createHash("sha1").update(Buffer.concat([$mgfSeed,$c]),"hex").digest());return $t=Buffer.alloc($maskLen,Buffer.concat($t)),$t},Scheme.prototype.unsignedLongBuffer=function(num){var jsonStr=stringify$1({type:"Buffer",data:[0,0,0,num]}),longBuffer=JSON.parse(jsonStr,function(key,value){return value&&"Buffer"===value.type?Buffer.from(value.data):value});return longBuffer},Scheme.prototype.randomBytes=function(size){var MAX_BYTES=65536;if(size>4294967295)throw new RangeError("requested too many random bytes");var bytes=Buffer.allocUnsafe(size);if(0<size)if(size>MAX_BYTES)for(var generated=0;generated<size;generated+=MAX_BYTES)this.getRandomValues(bytes.slice(generated,generated+MAX_BYTES));else this.getRandomValues(bytes);return bytes},Scheme.prototype.getRandomValues=function(ar){for(var i=0;i<ar.length;i++)ar[i]=Math.floor(256*Math.random());},Scheme.prototype.encUnPad=function(buffer,options){options=options||{};var i=0;if(this.options.encryptionSchemeOptions&&this.options.encryptionSchemeOptions.padding==constants.RSA_NO_PADDING){var unPad;return unPad="function"==typeof buffer.lastIndexOf?buffer.slice(buffer.lastIndexOf("\0")+1,buffer.length):buffer.slice(String.prototype.lastIndexOf.call(buffer,"\0")+1,buffer.length),unPad}if(4>buffer.length)return null;if(1===options.type){if(0!==buffer[0]&&1!==buffer[1])return null;for(i=3;0!==buffer[i];)if(255!=buffer[i]||++i>=buffer.length)return null}else{if(0!==buffer[0]&&2!==buffer[1])return null;for(i=3;0!==buffer[i];)if(++i>=buffer.length)return null}return buffer.slice(i+1,buffer.length)},Scheme.prototype.sign=function(buffer){var hashAlgorithm=this.options.signingSchemeOptions.hash||DEFAULT_HASH_FUNCTION;if("browser"===this.options.environment){hashAlgorithm=SIGN_ALG_TO_HASH_ALIASES[hashAlgorithm]||hashAlgorithm;var hasher=crypt.createHash(hashAlgorithm);hasher.update(buffer);var hash=this.pkcs1pad(hasher.digest(),hashAlgorithm),res=this.key.$doPrivate(new jsbn(hash)).toBuffer(this.key.encryptedDataLength);return res}var signer=crypt.createSign("RSA-"+hashAlgorithm.toUpperCase());return signer.update(buffer),signer.sign(this.options.rsaUtils.exportKey("private"))},Scheme.prototype.verify=function(buffer,signature,signature_encoding){if(this.options.encryptionSchemeOptions&&this.options.encryptionSchemeOptions.padding==constants.RSA_NO_PADDING)return !1;var hashAlgorithm=this.options.signingSchemeOptions.hash||DEFAULT_HASH_FUNCTION;if("browser"===this.options.environment){hashAlgorithm=SIGN_ALG_TO_HASH_ALIASES[hashAlgorithm]||hashAlgorithm,signature_encoding&&(signature=Buffer.from(signature,signature_encoding));var hasher=crypt.createHash(hashAlgorithm);hasher.update(buffer);var hash=this.pkcs1pad(hasher.digest(),hashAlgorithm),m=this.key.$doPublic(new jsbn(signature));return m.toBuffer().toString("hex")==hash.toString("hex")}var verifier=crypt.createVerify("RSA-"+hashAlgorithm.toUpperCase());return verifier.update(buffer),verifier.verify(this.options.rsaUtils.exportKey("public"),signature,signature_encoding)},Scheme.prototype.pkcs0pad=function(buffer){var filled=Buffer.alloc(this.key.maxMessageLength-buffer.length);return filled.fill(0),Buffer.concat([filled,buffer])},Scheme.prototype.pkcs0unpad=function(buffer){var unPad;return unPad="function"==typeof buffer.lastIndexOf?buffer.slice(buffer.lastIndexOf("\0")+1,buffer.length):buffer.slice(String.prototype.lastIndexOf.call(buffer,"\0")+1,buffer.length),unPad},Scheme.prototype.pkcs1pad=function(hashBuf,hashAlgorithm){var digest=SIGN_INFO_HEAD[hashAlgorithm];if(!digest)throw Error("Unsupported hash algorithm");var data=Buffer.concat([digest,hashBuf]);if(data.length+10>this.key.encryptedDataLength)throw Error("Key is too short for signing algorithm ("+hashAlgorithm+")");var filled=Buffer.alloc(this.key.encryptedDataLength-data.length-1);filled.fill(255,0,filled.length-1),filled[0]=1,filled[filled.length-1]=0;var res=Buffer.concat([filled,data]);return res},new Scheme(key,options)};pkcs1.makeScheme=makeScheme;

	var oaep=createCommonjsModule(function(module){module.exports={isEncryption:!0,isSignature:!1},module.exports.digestLength={md4:16,md5:16,ripemd160:20,rmd160:20,sha1:20,sha224:28,sha256:32,sha384:48,sha512:64};var DEFAULT_HASH_FUNCTION="sha1";module.exports.eme_oaep_mgf1=function(seed,maskLength,hashFunction){hashFunction=hashFunction||DEFAULT_HASH_FUNCTION;for(var hash,hLen=module.exports.digestLength[hashFunction],count=Math.ceil(maskLength/hLen),T=Buffer.alloc(hLen*count),c=Buffer.alloc(4),i=0;i<count;++i)hash=crypt.createHash(hashFunction),hash.update(seed),c.writeUInt32BE(i,0),hash.update(c),hash.digest().copy(T,i*hLen);return T.slice(0,maskLength)},module.exports.makeScheme=function(key,options){function Scheme(key,options){this.key=key,this.options=options;}return Scheme.prototype.maxMessageLength=function(){return this.key.encryptedDataLength-2*module.exports.digestLength[this.options.encryptionSchemeOptions.hash||DEFAULT_HASH_FUNCTION]-2},Scheme.prototype.encPad=function(buffer){var hash=this.options.encryptionSchemeOptions.hash||DEFAULT_HASH_FUNCTION,mgf=this.options.encryptionSchemeOptions.mgf||module.exports.eme_oaep_mgf1,label=this.options.encryptionSchemeOptions.label||Buffer.alloc(0),emLen=this.key.encryptedDataLength,hLen=module.exports.digestLength[hash];if(buffer.length>emLen-2*hLen-2)throw new Error("Message is too long to encode into an encoded message with a length of "+emLen+" bytes, increase"+"emLen to fix this error (minimum value for given parameters and options: "+(emLen-2*hLen-2)+")");var lHash=crypt.createHash(hash);lHash.update(label),lHash=lHash.digest();var PS=Buffer.alloc(emLen-buffer.length-2*hLen-1);PS.fill(0),PS[PS.length-1]=1;for(var DB=Buffer.concat([lHash,PS,buffer]),seed=crypt.randomBytes(hLen),mask=mgf(seed,DB.length,hash),i=0;i<DB.length;i++)DB[i]^=mask[i];for(mask=mgf(DB,hLen,hash),i=0;i<seed.length;i++)seed[i]^=mask[i];var em=Buffer.alloc(1+seed.length+DB.length);return em[0]=0,seed.copy(em,1),DB.copy(em,1+seed.length),em},Scheme.prototype.encUnPad=function(buffer){var hash=this.options.encryptionSchemeOptions.hash||DEFAULT_HASH_FUNCTION,mgf=this.options.encryptionSchemeOptions.mgf||module.exports.eme_oaep_mgf1,label=this.options.encryptionSchemeOptions.label||Buffer.alloc(0),hLen=module.exports.digestLength[hash];if(buffer.length<2*hLen+2)throw new Error("Error decoding message, the supplied message is not long enough to be a valid OAEP encoded message");for(var seed=buffer.slice(1,hLen+1),DB=buffer.slice(1+hLen),mask=mgf(DB,hLen,hash),i=0;i<seed.length;i++)seed[i]^=mask[i];for(mask=mgf(seed,DB.length,hash),i=0;i<DB.length;i++)DB[i]^=mask[i];var lHash=crypt.createHash(hash);lHash.update(label),lHash=lHash.digest();var lHashEM=DB.slice(0,hLen);if(lHashEM.toString("hex")!=lHash.toString("hex"))throw new Error("Error decoding message, the lHash calculated from the label provided and the lHash in the encrypted data do not match.");for(i=hLen;0===DB[i++]&&i<DB.length;);if(1!=DB[i-1])throw new Error("Error decoding message, there is no padding message separator byte");return DB.slice(i)},new Scheme(key,options)};});var oaep_1=oaep.isEncryption;var oaep_2=oaep.isSignature;var oaep_3=oaep.digestLength;var oaep_4=oaep.eme_oaep_mgf1;var oaep_5=oaep.makeScheme;

	var pss={isEncryption:!1,isSignature:!0},DEFAULT_HASH_FUNCTION$1="sha1",DEFAULT_SALT_LENGTH=20,makeScheme$1=function(key,options){function Scheme(key,options){this.key=key,this.options=options;}var OAEP=schemes.pkcs1_oaep;return Scheme.prototype.sign=function(buffer){var mHash=crypt.createHash(this.options.signingSchemeOptions.hash||DEFAULT_HASH_FUNCTION$1);mHash.update(buffer);var encoded=this.emsa_pss_encode(mHash.digest(),this.key.keySize-1);return this.key.$doPrivate(new jsbn(encoded)).toBuffer(this.key.encryptedDataLength)},Scheme.prototype.verify=function(buffer,signature,signature_encoding){signature_encoding&&(signature=Buffer.from(signature,signature_encoding)),signature=new jsbn(signature);var emLen=Math.ceil((this.key.keySize-1)/8),m=this.key.$doPublic(signature).toBuffer(emLen),mHash=crypt.createHash(this.options.signingSchemeOptions.hash||DEFAULT_HASH_FUNCTION$1);return mHash.update(buffer),this.emsa_pss_verify(mHash.digest(),m,this.key.keySize-1)},Scheme.prototype.emsa_pss_encode=function(mHash,emBits){var hash=this.options.signingSchemeOptions.hash||DEFAULT_HASH_FUNCTION$1,mgf=this.options.signingSchemeOptions.mgf||OAEP.eme_oaep_mgf1,sLen=this.options.signingSchemeOptions.saltLength||DEFAULT_SALT_LENGTH,hLen=OAEP.digestLength[hash],emLen=Math.ceil(emBits/8);if(emLen<hLen+sLen+2)throw new Error("Output length passed to emBits("+emBits+") is too small for the options "+"specified("+hash+", "+sLen+"). To fix this issue increase the value of emBits. (minimum size: "+(8*hLen+8*sLen+9)+")");var salt=crypt.randomBytes(sLen),Mapostrophe=Buffer.alloc(8+hLen+sLen);Mapostrophe.fill(0,0,8),mHash.copy(Mapostrophe,8),salt.copy(Mapostrophe,8+mHash.length);var H=crypt.createHash(hash);H.update(Mapostrophe),H=H.digest();var PS=Buffer.alloc(emLen-salt.length-hLen-2);PS.fill(0);var DB=Buffer.alloc(PS.length+1+salt.length);PS.copy(DB),DB[PS.length]=1,salt.copy(DB,PS.length+1);for(var dbMask=mgf(H,DB.length,hash),maskedDB=Buffer.alloc(DB.length),i=0;i<dbMask.length;i++)maskedDB[i]=DB[i]^dbMask[i];var bits=8*emLen-emBits;maskedDB[0]&=255^255>>8-bits<<8-bits;var EM=Buffer.alloc(maskedDB.length+H.length+1);return maskedDB.copy(EM,0),H.copy(EM,maskedDB.length),EM[EM.length-1]=188,EM},Scheme.prototype.emsa_pss_verify=function(mHash,EM,emBits){var hash=this.options.signingSchemeOptions.hash||DEFAULT_HASH_FUNCTION$1,mgf=this.options.signingSchemeOptions.mgf||OAEP.eme_oaep_mgf1,sLen=this.options.signingSchemeOptions.saltLength||DEFAULT_SALT_LENGTH,hLen=OAEP.digestLength[hash],emLen=Math.ceil(emBits/8);if(emLen<hLen+sLen+2||188!=EM[EM.length-1])return !1;var DB=Buffer.alloc(emLen-hLen-1);EM.copy(DB,0,0,emLen-hLen-1);for(var mask=0,i=0,bits=8*emLen-emBits;i<bits;i++)mask|=1<<7-i;if(0!=(DB[0]&mask))return !1;var H=EM.slice(emLen-hLen-1,emLen-1),dbMask=mgf(H,DB.length,hash);for(i=0;i<DB.length;i++)DB[i]^=dbMask[i];for(bits=8*emLen-emBits,mask=255^255>>8-bits<<8-bits,DB[0]&=mask,i=0;0===DB[i]&&i<DB.length;i++);if(1!=DB[i])return !1;var salt=DB.slice(DB.length-sLen),Mapostrophe=Buffer.alloc(8+hLen+sLen);Mapostrophe.fill(0,0,8),mHash.copy(Mapostrophe,8),salt.copy(Mapostrophe,8+mHash.length);var Hapostrophe=crypt.createHash(hash);return Hapostrophe.update(Mapostrophe),Hapostrophe=Hapostrophe.digest(),H.toString("hex")===Hapostrophe.toString("hex")},new Scheme(key,options)};pss.makeScheme=makeScheme$1;

	var schemes=createCommonjsModule(function(module){module.exports={pkcs1:pkcs1,pkcs1_oaep:oaep,pss:pss,isEncryption:function isEncryption(scheme){return module.exports[scheme]&&module.exports[scheme].isEncryption},isSignature:function isSignature(scheme){return module.exports[scheme]&&module.exports[scheme].isSignature}};});var schemes_1=schemes.pkcs1;var schemes_2=schemes.pkcs1_oaep;var schemes_3=schemes.pss;var schemes_4=schemes.isEncryption;var schemes_5=schemes.isSignature;

	var js=function(keyPair,options){var pkcs1Scheme=schemes.pkcs1.makeScheme(keyPair,options);return {encrypt:function encrypt(buffer,usePrivate){var m,c;return usePrivate?(m=new jsbn(pkcs1Scheme.encPad(buffer,{type:1})),c=keyPair.$doPrivate(m)):(m=new jsbn(keyPair.encryptionScheme.encPad(buffer)),c=keyPair.$doPublic(m)),c.toBuffer(keyPair.encryptedDataLength)},decrypt:function decrypt(buffer,usePublic){var m,c=new jsbn(buffer);return usePublic?(m=keyPair.$doPublic(c),pkcs1Scheme.encUnPad(m.toBuffer(keyPair.encryptedDataLength),{type:1})):(m=keyPair.$doPrivate(c),keyPair.encryptionScheme.encUnPad(m.toBuffer(keyPair.encryptedDataLength)))}}};

	var encryptEngines={getEngine:function getEngine(keyPair,options){return js(keyPair,options)}};

	var _$2=utils._,BigInteger_1=jsbn,Key=function(){function RSAKey(){this.n=null,this.e=0,this.d=null,this.p=null,this.q=null,this.dmp1=null,this.dmq1=null,this.coeff=null;}return RSAKey.prototype.setOptions=function(options){var signingSchemeProvider=schemes[options.signingScheme],encryptionSchemeProvider=schemes[options.encryptionScheme];signingSchemeProvider===encryptionSchemeProvider?this.signingScheme=this.encryptionScheme=encryptionSchemeProvider.makeScheme(this,options):(this.encryptionScheme=encryptionSchemeProvider.makeScheme(this,options),this.signingScheme=signingSchemeProvider.makeScheme(this,options)),this.encryptEngine=encryptEngines.getEngine(this,options);},RSAKey.prototype.generate=function(B,E){var qs=B>>1;this.e=_parseInt$2(E,16);for(var ee=new jsbn(E,16);;){for(;this.p=new jsbn(B-qs,1),!(0===this.p.subtract(jsbn.ONE).gcd(ee).compareTo(jsbn.ONE)&&this.p.isProbablePrime(10)););for(;this.q=new jsbn(qs,1),!(0===this.q.subtract(jsbn.ONE).gcd(ee).compareTo(jsbn.ONE)&&this.q.isProbablePrime(10)););if(0>=this.p.compareTo(this.q)){var t=this.p;this.p=this.q,this.q=t;}var p1=this.p.subtract(jsbn.ONE),q1=this.q.subtract(jsbn.ONE),phi=p1.multiply(q1);if(0===phi.gcd(ee).compareTo(jsbn.ONE)){if(this.n=this.p.multiply(this.q),this.n.bitLength()<B)continue;this.d=ee.modInverse(phi),this.dmp1=this.d.mod(p1),this.dmq1=this.d.mod(q1),this.coeff=this.q.modInverse(this.p);break}}this.$$recalculateCache();},RSAKey.prototype.setPrivate=function(N,E,D,P,Q,DP,DQ,C){if(N&&E&&D&&0<N.length&&(_$2.isNumber(E)||0<E.length)&&0<D.length)this.n=new jsbn(N),this.e=_$2.isNumber(E)?E:utils.get32IntFromBuffer(E,0),this.d=new jsbn(D),P&&Q&&DP&&DQ&&C&&(this.p=new jsbn(P),this.q=new jsbn(Q),this.dmp1=new jsbn(DP),this.dmq1=new jsbn(DQ),this.coeff=new jsbn(C)),this.$$recalculateCache();else throw Error("Invalid RSA private key")},RSAKey.prototype.setPublic=function(N,E){if(N&&E&&0<N.length&&(_$2.isNumber(E)||0<E.length))this.n=new jsbn(N),this.e=_$2.isNumber(E)?E:utils.get32IntFromBuffer(E,0),this.$$recalculateCache();else throw Error("Invalid RSA public key")},RSAKey.prototype.$doPrivate=function(x){if(this.p||this.q)return x.modPow(this.d,this.n);for(var xp=x.mod(this.p).modPow(this.dmp1,this.p),xq=x.mod(this.q).modPow(this.dmq1,this.q);0>xp.compareTo(xq);)xp=xp.add(this.p);return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq)},RSAKey.prototype.$doPublic=function(x){return x.modPowInt(this.e,this.n)},RSAKey.prototype.encrypt=function(buffer,usePrivate){var buffers=[],results=[],bufferSize=buffer.length,buffersCount=Math.ceil(bufferSize/this.maxMessageLength)||1,dividedSize=Math.ceil(bufferSize/buffersCount||1);if(1==buffersCount)buffers.push(buffer);else for(var bufNum=0;bufNum<buffersCount;bufNum++)buffers.push(buffer.slice(bufNum*dividedSize,(bufNum+1)*dividedSize));for(var i=0;i<buffers.length;i++)results.push(this.encryptEngine.encrypt(buffers[i],usePrivate));return Buffer.concat(results)},RSAKey.prototype.decrypt=function(buffer,usePublic){if(0<buffer.length%this.encryptedDataLength)throw Error("Incorrect data or key");for(var result=[],offset=0,length=0,buffersCount=buffer.length/this.encryptedDataLength,i=0;i<buffersCount;i++)offset=i*this.encryptedDataLength,length=offset+this.encryptedDataLength,result.push(this.encryptEngine.decrypt(buffer.slice(offset,Math.min(length,buffer.length)),usePublic));return Buffer.concat(result)},RSAKey.prototype.sign=function(){return this.signingScheme.sign.apply(this.signingScheme,arguments)},RSAKey.prototype.verify=function(){return this.signingScheme.verify.apply(this.signingScheme,arguments)},RSAKey.prototype.isPrivate=function(){return this.n&&this.e&&this.d||!1},RSAKey.prototype.isPublic=function(strict){return this.n&&this.e&&!(strict&&this.d)||!1},defineProperty$1(RSAKey.prototype,"keySize",{get:function get(){return this.cache.keyBitLength}}),defineProperty$1(RSAKey.prototype,"encryptedDataLength",{get:function get(){return this.cache.keyByteLength}}),defineProperty$1(RSAKey.prototype,"maxMessageLength",{get:function get(){return this.encryptionScheme.maxMessageLength()}}),RSAKey.prototype.$$recalculateCache=function(){this.cache=this.cache||{},this.cache.keyBitLength=this.n.bitLength(),this.cache.keyByteLength=this.cache.keyBitLength+6>>3;},RSAKey}(),rsa={BigInteger:BigInteger_1,Key:Key};

	// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.


	var errors = {

	  newInvalidAsn1Error: function (msg) {
	    var e = new Error();
	    e.name = 'InvalidAsn1Error';
	    e.message = msg || '';
	    return e;
	  }

	};

	// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.


	var types = {
	  EOC: 0,
	  Boolean: 1,
	  Integer: 2,
	  BitString: 3,
	  OctetString: 4,
	  Null: 5,
	  OID: 6,
	  ObjectDescriptor: 7,
	  External: 8,
	  Real: 9, // float
	  Enumeration: 10,
	  PDV: 11,
	  Utf8String: 12,
	  RelativeOID: 13,
	  Sequence: 16,
	  Set: 17,
	  NumericString: 18,
	  PrintableString: 19,
	  T61String: 20,
	  VideotexString: 21,
	  IA5String: 22,
	  UTCTime: 23,
	  GeneralizedTime: 24,
	  GraphicString: 25,
	  VisibleString: 26,
	  GeneralString: 28,
	  UniversalString: 29,
	  CharacterString: 30,
	  BMPString: 31,
	  Constructor: 32,
	  Context: 128
	};

	// shim for using process in browser
	// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	var cachedSetTimeout = defaultSetTimout;
	var cachedClearTimeout = defaultClearTimeout;
	if (typeof global$1.setTimeout === 'function') {
	    cachedSetTimeout = setTimeout;
	}
	if (typeof global$1.clearTimeout === 'function') {
	    cachedClearTimeout = clearTimeout;
	}

	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	function nextTick(fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	}
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	var title = 'browser';
	var platform = 'browser';
	var browser = true;
	var env = {};
	var argv = [];
	var version = ''; // empty string to avoid regexp issues
	var versions = {};
	var release = {};
	var config = {};

	function noop() {}

	var on = noop;
	var addListener = noop;
	var once = noop;
	var off = noop;
	var removeListener = noop;
	var removeAllListeners = noop;
	var emit = noop;

	function binding(name) {
	    throw new Error('process.binding is not supported');
	}

	function cwd () { return '/' }
	function chdir (dir) {
	    throw new Error('process.chdir is not supported');
	}function umask() { return 0; }

	// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
	var performance = global$1.performance || {};
	var performanceNow =
	  performance.now        ||
	  performance.mozNow     ||
	  performance.msNow      ||
	  performance.oNow       ||
	  performance.webkitNow  ||
	  function(){ return (new Date()).getTime() };

	// generate timestamp or delta
	// see http://nodejs.org/api/process.html#process_process_hrtime
	function hrtime(previousTimestamp){
	  var clocktime = performanceNow.call(performance)*1e-3;
	  var seconds = Math.floor(clocktime);
	  var nanoseconds = Math.floor((clocktime%1)*1e9);
	  if (previousTimestamp) {
	    seconds = seconds - previousTimestamp[0];
	    nanoseconds = nanoseconds - previousTimestamp[1];
	    if (nanoseconds<0) {
	      seconds--;
	      nanoseconds += 1e9;
	    }
	  }
	  return [seconds,nanoseconds]
	}

	var startTime = new Date();
	function uptime() {
	  var currentTime = new Date();
	  var dif = currentTime - startTime;
	  return dif / 1000;
	}

	var process = {
	  nextTick: nextTick,
	  title: title,
	  browser: browser,
	  env: env,
	  argv: argv,
	  version: version,
	  versions: versions,
	  on: on,
	  addListener: addListener,
	  once: once,
	  off: off,
	  removeListener: removeListener,
	  removeAllListeners: removeAllListeners,
	  emit: emit,
	  binding: binding,
	  cwd: cwd,
	  chdir: chdir,
	  umask: umask,
	  hrtime: hrtime,
	  platform: platform,
	  release: release,
	  config: config,
	  uptime: uptime
	};

	var inherits;
	if (typeof Object.create === 'function'){
	  inherits = function inherits(ctor, superCtor) {
	    // implementation from standard node.js 'util' module
	    ctor.super_ = superCtor;
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  inherits = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function () {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  };
	}
	var inherits$1 = inherits;

	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    _extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}

	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray$1(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty$1(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty$1(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var length = output.reduce(function(prev, cur) {
	    if (cur.indexOf('\n') >= 0) ;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray$1(ar) {
	  return Array.isArray(ar);
	}

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}

	function isNull(arg) {
	  return arg === null;
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isString(arg) {
	  return typeof arg === 'string';
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}

	function _extend(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	}
	function hasOwnProperty$1(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	function compare(a, b) {
	  if (a === b) {
	    return 0;
	  }

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break;
	    }
	  }

	  if (x < y) {
	    return -1;
	  }
	  if (y < x) {
	    return 1;
	  }
	  return 0;
	}
	var hasOwn = Object.prototype.hasOwnProperty;

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    if (hasOwn.call(obj, key)) keys.push(key);
	  }
	  return keys;
	};
	var pSlice = Array.prototype.slice;
	var _functionsHaveNames;
	function functionsHaveNames() {
	  if (typeof _functionsHaveNames !== 'undefined') {
	    return _functionsHaveNames;
	  }
	  return _functionsHaveNames = (function () {
	    return function foo() {}.name === 'foo';
	  }());
	}
	function pToString (obj) {
	  return Object.prototype.toString.call(obj);
	}
	function isView(arrbuf) {
	  if (isBuffer(arrbuf)) {
	    return false;
	  }
	  if (typeof global$1.ArrayBuffer !== 'function') {
	    return false;
	  }
	  if (typeof ArrayBuffer.isView === 'function') {
	    return ArrayBuffer.isView(arrbuf);
	  }
	  if (!arrbuf) {
	    return false;
	  }
	  if (arrbuf instanceof DataView) {
	    return true;
	  }
	  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
	    return true;
	  }
	  return false;
	}
	// 1. The assert module provides functions that throw
	// AssertionError's when particular conditions are not met. The
	// assert module must conform to the following interface.

	function assert(value, message) {
	  if (!value) fail(value, true, message, '==', ok);
	}

	// 2. The AssertionError is defined in assert.
	// new assert.AssertionError({ message: message,
	//                             actual: actual,
	//                             expected: expected })

	var regex = /\s*function\s+([^\(\s]*)\s*/;
	// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
	function getName(func) {
	  if (!isFunction(func)) {
	    return;
	  }
	  if (functionsHaveNames()) {
	    return func.name;
	  }
	  var str = func.toString();
	  var match = str.match(regex);
	  return match && match[1];
	}
	assert.AssertionError = AssertionError;
	function AssertionError(options) {
	  this.name = 'AssertionError';
	  this.actual = options.actual;
	  this.expected = options.expected;
	  this.operator = options.operator;
	  if (options.message) {
	    this.message = options.message;
	    this.generatedMessage = false;
	  } else {
	    this.message = getMessage(this);
	    this.generatedMessage = true;
	  }
	  var stackStartFunction = options.stackStartFunction || fail;
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, stackStartFunction);
	  } else {
	    // non v8 browsers so we can have a stacktrace
	    var err = new Error();
	    if (err.stack) {
	      var out = err.stack;

	      // try to strip useless frames
	      var fn_name = getName(stackStartFunction);
	      var idx = out.indexOf('\n' + fn_name);
	      if (idx >= 0) {
	        // once we have located the function frame
	        // we need to strip out everything before it (and its line)
	        var next_line = out.indexOf('\n', idx + 1);
	        out = out.substring(next_line + 1);
	      }

	      this.stack = out;
	    }
	  }
	}

	// assert.AssertionError instanceof Error
	inherits$1(AssertionError, Error);

	function truncate(s, n) {
	  if (typeof s === 'string') {
	    return s.length < n ? s : s.slice(0, n);
	  } else {
	    return s;
	  }
	}
	function inspect$1(something) {
	  if (functionsHaveNames() || !isFunction(something)) {
	    return inspect(something);
	  }
	  var rawname = getName(something);
	  var name = rawname ? ': ' + rawname : '';
	  return '[Function' +  name + ']';
	}
	function getMessage(self) {
	  return truncate(inspect$1(self.actual), 128) + ' ' +
	         self.operator + ' ' +
	         truncate(inspect$1(self.expected), 128);
	}

	// At present only the three keys mentioned above are used and
	// understood by the spec. Implementations or sub modules can pass
	// other keys to the AssertionError's constructor - they will be
	// ignored.

	// 3. All of the following functions must throw an AssertionError
	// when a corresponding condition is not met, with a message that
	// may be undefined if not provided.  All assertion methods provide
	// both the actual and expected values to the assertion error for
	// display purposes.

	function fail(actual, expected, message, operator, stackStartFunction) {
	  throw new AssertionError({
	    message: message,
	    actual: actual,
	    expected: expected,
	    operator: operator,
	    stackStartFunction: stackStartFunction
	  });
	}

	// EXTENSION! allows for well behaved errors defined elsewhere.
	assert.fail = fail;

	// 4. Pure assertion tests whether a value is truthy, as determined
	// by !!guard.
	// assert.ok(guard, message_opt);
	// This statement is equivalent to assert.equal(true, !!guard,
	// message_opt);. To test strictly for the value true, use
	// assert.strictEqual(true, guard, message_opt);.

	function ok(value, message) {
	  if (!value) fail(value, true, message, '==', ok);
	}
	assert.ok = ok;

	// 5. The equality assertion tests shallow, coercive equality with
	// ==.
	// assert.equal(actual, expected, message_opt);
	assert.equal = equal;
	function equal(actual, expected, message) {
	  if (actual != expected) fail(actual, expected, message, '==', equal);
	}

	// 6. The non-equality assertion tests for whether two objects are not equal
	// with != assert.notEqual(actual, expected, message_opt);
	assert.notEqual = notEqual;
	function notEqual(actual, expected, message) {
	  if (actual == expected) {
	    fail(actual, expected, message, '!=', notEqual);
	  }
	}

	// 7. The equivalence assertion tests a deep equality relation.
	// assert.deepEqual(actual, expected, message_opt);
	assert.deepEqual = deepEqual;
	function deepEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'deepEqual', deepEqual);
	  }
	}
	assert.deepStrictEqual = deepStrictEqual;
	function deepStrictEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'deepStrictEqual', deepStrictEqual);
	  }
	}

	function _deepEqual(actual, expected, strict, memos) {
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;
	  } else if (isBuffer(actual) && isBuffer(expected)) {
	    return compare(actual, expected) === 0;

	  // 7.2. If the expected value is a Date object, the actual value is
	  // equivalent if it is also a Date object that refers to the same time.
	  } else if (isDate(actual) && isDate(expected)) {
	    return actual.getTime() === expected.getTime();

	  // 7.3 If the expected value is a RegExp object, the actual value is
	  // equivalent if it is also a RegExp object with the same source and
	  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	  } else if (isRegExp(actual) && isRegExp(expected)) {
	    return actual.source === expected.source &&
	           actual.global === expected.global &&
	           actual.multiline === expected.multiline &&
	           actual.lastIndex === expected.lastIndex &&
	           actual.ignoreCase === expected.ignoreCase;

	  // 7.4. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if ((actual === null || typeof actual !== 'object') &&
	             (expected === null || typeof expected !== 'object')) {
	    return strict ? actual === expected : actual == expected;

	  // If both values are instances of typed arrays, wrap their underlying
	  // ArrayBuffers in a Buffer each to increase performance
	  // This optimization requires the arrays to have the same type as checked by
	  // Object.prototype.toString (aka pToString). Never perform binary
	  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
	  // bit patterns are not identical.
	  } else if (isView(actual) && isView(expected) &&
	             pToString(actual) === pToString(expected) &&
	             !(actual instanceof Float32Array ||
	               actual instanceof Float64Array)) {
	    return compare(new Uint8Array(actual.buffer),
	                   new Uint8Array(expected.buffer)) === 0;

	  // 7.5 For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else if (isBuffer(actual) !== isBuffer(expected)) {
	    return false;
	  } else {
	    memos = memos || {actual: [], expected: []};

	    var actualIndex = memos.actual.indexOf(actual);
	    if (actualIndex !== -1) {
	      if (actualIndex === memos.expected.indexOf(expected)) {
	        return true;
	      }
	    }

	    memos.actual.push(actual);
	    memos.expected.push(expected);

	    return objEquiv(actual, expected, strict, memos);
	  }
	}

	function isArguments(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	}

	function objEquiv(a, b, strict, actualVisitedObjects) {
	  if (a === null || a === undefined || b === null || b === undefined)
	    return false;
	  // if one is a primitive, the other must be same
	  if (isPrimitive(a) || isPrimitive(b))
	    return a === b;
	  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
	    return false;
	  var aIsArgs = isArguments(a);
	  var bIsArgs = isArguments(b);
	  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
	    return false;
	  if (aIsArgs) {
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return _deepEqual(a, b, strict);
	  }
	  var ka = objectKeys(a);
	  var kb = objectKeys(b);
	  var key, i;
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length !== kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] !== kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
	      return false;
	  }
	  return true;
	}

	// 8. The non-equivalence assertion tests for any deep inequality.
	// assert.notDeepEqual(actual, expected, message_opt);
	assert.notDeepEqual = notDeepEqual;
	function notDeepEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'notDeepEqual', notDeepEqual);
	  }
	}

	assert.notDeepStrictEqual = notDeepStrictEqual;
	function notDeepStrictEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
	  }
	}


	// 9. The strict equality assertion tests strict equality, as determined by ===.
	// assert.strictEqual(actual, expected, message_opt);
	assert.strictEqual = strictEqual;
	function strictEqual(actual, expected, message) {
	  if (actual !== expected) {
	    fail(actual, expected, message, '===', strictEqual);
	  }
	}

	// 10. The strict non-equality assertion tests for strict inequality, as
	// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
	assert.notStrictEqual = notStrictEqual;
	function notStrictEqual(actual, expected, message) {
	  if (actual === expected) {
	    fail(actual, expected, message, '!==', notStrictEqual);
	  }
	}

	function expectedException(actual, expected) {
	  if (!actual || !expected) {
	    return false;
	  }

	  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
	    return expected.test(actual);
	  }

	  try {
	    if (actual instanceof expected) {
	      return true;
	    }
	  } catch (e) {
	    // Ignore.  The instanceof check doesn't work for arrow functions.
	  }

	  if (Error.isPrototypeOf(expected)) {
	    return false;
	  }

	  return expected.call({}, actual) === true;
	}

	function _tryBlock(block) {
	  var error;
	  try {
	    block();
	  } catch (e) {
	    error = e;
	  }
	  return error;
	}

	function _throws(shouldThrow, block, expected, message) {
	  var actual;

	  if (typeof block !== 'function') {
	    throw new TypeError('"block" argument must be a function');
	  }

	  if (typeof expected === 'string') {
	    message = expected;
	    expected = null;
	  }

	  actual = _tryBlock(block);

	  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
	            (message ? ' ' + message : '.');

	  if (shouldThrow && !actual) {
	    fail(actual, expected, 'Missing expected exception' + message);
	  }

	  var userProvidedMessage = typeof message === 'string';
	  var isUnwantedException = !shouldThrow && isError(actual);
	  var isUnexpectedException = !shouldThrow && actual && !expected;

	  if ((isUnwantedException &&
	      userProvidedMessage &&
	      expectedException(actual, expected)) ||
	      isUnexpectedException) {
	    fail(actual, expected, 'Got unwanted exception' + message);
	  }

	  if ((shouldThrow && actual && expected &&
	      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
	    throw actual;
	  }
	}

	// 11. Expected to throw an error:
	// assert.throws(block, Error_opt, message_opt);
	assert.throws = throws;
	function throws(block, /*optional*/error, /*optional*/message) {
	  _throws(true, block, error, message);
	}

	// EXTENSION! This is annoying to write outside this module.
	assert.doesNotThrow = doesNotThrow;
	function doesNotThrow(block, /*optional*/error, /*optional*/message) {
	  _throws(false, block, error, message);
	}

	assert.ifError = ifError;
	function ifError(err) {
	  if (err) throw err;
	}

	var Buffer$2 = bufferEs6.Buffer;

	var safer = {};

	var key;

	for (key in bufferEs6) {
	  if (!bufferEs6.hasOwnProperty(key)) continue
	  if (key === 'SlowBuffer' || key === 'Buffer') continue
	  safer[key] = bufferEs6[key];
	}

	var Safer = safer.Buffer = {};
	for (key in Buffer$2) {
	  if (!Buffer$2.hasOwnProperty(key)) continue
	  if (key === 'allocUnsafe' || key === 'allocUnsafeSlow') continue
	  Safer[key] = Buffer$2[key];
	}

	safer.Buffer.prototype = Buffer$2.prototype;

	if (!Safer.from || Safer.from === Uint8Array.from) {
	  Safer.from = function (value, encodingOrOffset, length) {
	    if (typeof value === 'number') {
	      throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value)
	    }
	    if (value && typeof value.length === 'undefined') {
	      throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' + typeof value)
	    }
	    return Buffer$2(value, encodingOrOffset, length)
	  };
	}

	if (!Safer.alloc) {
	  Safer.alloc = function (size, fill, encoding) {
	    if (typeof size !== 'number') {
	      throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size)
	    }
	    if (size < 0 || size >= 2 * (1 << 30)) {
	      throw new RangeError('The value "' + size + '" is invalid for option "size"')
	    }
	    var buf = Buffer$2(size);
	    if (!fill || fill.length === 0) {
	      buf.fill(0);
	    } else if (typeof encoding === 'string') {
	      buf.fill(fill, encoding);
	    } else {
	      buf.fill(fill);
	    }
	    return buf
	  };
	}

	if (!safer.kStringMaxLength) {
	  try {
	    safer.kStringMaxLength = process.binding('buffer').kStringMaxLength;
	  } catch (e) {
	    // we can't determine kStringMaxLength in environments where process.binding
	    // is unsupported, so let's not set it
	  }
	}

	if (!safer.constants) {
	  safer.constants = {
	    MAX_LENGTH: safer.kMaxLength
	  };
	  if (safer.kStringMaxLength) {
	    safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength;
	  }
	}

	var safer_1 = safer;

	// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.


	var Buffer$3 = safer_1.Buffer;





	// --- Globals

	var newInvalidAsn1Error = errors.newInvalidAsn1Error;



	// --- API

	function Reader(data) {
	  if (!data || !Buffer$3.isBuffer(data))
	    throw new TypeError('data must be a node Buffer');

	  this._buf = data;
	  this._size = data.length;

	  // These hold the "current" state
	  this._len = 0;
	  this._offset = 0;
	}

	Object.defineProperty(Reader.prototype, 'length', {
	  enumerable: true,
	  get: function () { return (this._len); }
	});

	Object.defineProperty(Reader.prototype, 'offset', {
	  enumerable: true,
	  get: function () { return (this._offset); }
	});

	Object.defineProperty(Reader.prototype, 'remain', {
	  get: function () { return (this._size - this._offset); }
	});

	Object.defineProperty(Reader.prototype, 'buffer', {
	  get: function () { return (this._buf.slice(this._offset)); }
	});


	/**
	 * Reads a single byte and advances offset; you can pass in `true` to make this
	 * a "peek" operation (i.e., get the byte, but don't advance the offset).
	 *
	 * @param {Boolean} peek true means don't move offset.
	 * @return {Number} the next byte, null if not enough data.
	 */
	Reader.prototype.readByte = function (peek) {
	  if (this._size - this._offset < 1)
	    return null;

	  var b = this._buf[this._offset] & 0xff;

	  if (!peek)
	    this._offset += 1;

	  return b;
	};


	Reader.prototype.peek = function () {
	  return this.readByte(true);
	};


	/**
	 * Reads a (potentially) variable length off the BER buffer.  This call is
	 * not really meant to be called directly, as callers have to manipulate
	 * the internal buffer afterwards.
	 *
	 * As a result of this call, you can call `Reader.length`, until the
	 * next thing called that does a readLength.
	 *
	 * @return {Number} the amount of offset to advance the buffer.
	 * @throws {InvalidAsn1Error} on bad ASN.1
	 */
	Reader.prototype.readLength = function (offset) {
	  if (offset === undefined)
	    offset = this._offset;

	  if (offset >= this._size)
	    return null;

	  var lenB = this._buf[offset++] & 0xff;
	  if (lenB === null)
	    return null;

	  if ((lenB & 0x80) === 0x80) {
	    lenB &= 0x7f;

	    if (lenB === 0)
	      throw newInvalidAsn1Error('Indefinite length not supported');

	    if (lenB > 4)
	      throw newInvalidAsn1Error('encoding too long');

	    if (this._size - offset < lenB)
	      return null;

	    this._len = 0;
	    for (var i = 0; i < lenB; i++)
	      this._len = (this._len << 8) + (this._buf[offset++] & 0xff);

	  } else {
	    // Wasn't a variable length
	    this._len = lenB;
	  }

	  return offset;
	};


	/**
	 * Parses the next sequence in this BER buffer.
	 *
	 * To get the length of the sequence, call `Reader.length`.
	 *
	 * @return {Number} the sequence's tag.
	 */
	Reader.prototype.readSequence = function (tag) {
	  var seq = this.peek();
	  if (seq === null)
	    return null;
	  if (tag !== undefined && tag !== seq)
	    throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) +
	                              ': got 0x' + seq.toString(16));

	  var o = this.readLength(this._offset + 1); // stored in `length`
	  if (o === null)
	    return null;

	  this._offset = o;
	  return seq;
	};


	Reader.prototype.readInt = function () {
	  return this._readTag(types.Integer);
	};


	Reader.prototype.readBoolean = function () {
	  return (this._readTag(types.Boolean) === 0 ? false : true);
	};


	Reader.prototype.readEnumeration = function () {
	  return this._readTag(types.Enumeration);
	};


	Reader.prototype.readString = function (tag, retbuf) {
	  if (!tag)
	    tag = types.OctetString;

	  var b = this.peek();
	  if (b === null)
	    return null;

	  if (b !== tag)
	    throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) +
	                              ': got 0x' + b.toString(16));

	  var o = this.readLength(this._offset + 1); // stored in `length`

	  if (o === null)
	    return null;

	  if (this.length > this._size - o)
	    return null;

	  this._offset = o;

	  if (this.length === 0)
	    return retbuf ? Buffer$3.alloc(0) : '';

	  var str = this._buf.slice(this._offset, this._offset + this.length);
	  this._offset += this.length;

	  return retbuf ? str : str.toString('utf8');
	};

	Reader.prototype.readOID = function (tag) {
	  if (!tag)
	    tag = types.OID;

	  var b = this.readString(tag, true);
	  if (b === null)
	    return null;

	  var values = [];
	  var value = 0;

	  for (var i = 0; i < b.length; i++) {
	    var byte = b[i] & 0xff;

	    value <<= 7;
	    value += byte & 0x7f;
	    if ((byte & 0x80) === 0) {
	      values.push(value);
	      value = 0;
	    }
	  }

	  value = values.shift();
	  values.unshift(value % 40);
	  values.unshift((value / 40) >> 0);

	  return values.join('.');
	};


	Reader.prototype._readTag = function (tag) {
	  assert.ok(tag !== undefined);

	  var b = this.peek();

	  if (b === null)
	    return null;

	  if (b !== tag)
	    throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) +
	                              ': got 0x' + b.toString(16));

	  var o = this.readLength(this._offset + 1); // stored in `length`
	  if (o === null)
	    return null;

	  if (this.length > 4)
	    throw newInvalidAsn1Error('Integer too long: ' + this.length);

	  if (this.length > this._size - o)
	    return null;
	  this._offset = o;

	  var fb = this._buf[this._offset];
	  var value = 0;

	  for (var i = 0; i < this.length; i++) {
	    value <<= 8;
	    value |= (this._buf[this._offset++] & 0xff);
	  }

	  if ((fb & 0x80) === 0x80 && i !== 4)
	    value -= (1 << (i * 8));

	  return value >> 0;
	};



	// --- Exported API

	var reader = Reader;

	// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.


	var Buffer$4 = safer_1.Buffer;




	// --- Globals

	var newInvalidAsn1Error$1 = errors.newInvalidAsn1Error;

	var DEFAULT_OPTS = {
	  size: 1024,
	  growthFactor: 8
	};


	// --- Helpers

	function merge(from, to) {
	  assert.ok(from);
	  assert.equal(typeof (from), 'object');
	  assert.ok(to);
	  assert.equal(typeof (to), 'object');

	  var keys = Object.getOwnPropertyNames(from);
	  keys.forEach(function (key) {
	    if (to[key])
	      return;

	    var value = Object.getOwnPropertyDescriptor(from, key);
	    Object.defineProperty(to, key, value);
	  });

	  return to;
	}



	// --- API

	function Writer(options) {
	  options = merge(DEFAULT_OPTS, options || {});

	  this._buf = Buffer$4.alloc(options.size || 1024);
	  this._size = this._buf.length;
	  this._offset = 0;
	  this._options = options;

	  // A list of offsets in the buffer where we need to insert
	  // sequence tag/len pairs.
	  this._seq = [];
	}

	Object.defineProperty(Writer.prototype, 'buffer', {
	  get: function () {
	    if (this._seq.length)
	      throw newInvalidAsn1Error$1(this._seq.length + ' unended sequence(s)');

	    return (this._buf.slice(0, this._offset));
	  }
	});

	Writer.prototype.writeByte = function (b) {
	  if (typeof (b) !== 'number')
	    throw new TypeError('argument must be a Number');

	  this._ensure(1);
	  this._buf[this._offset++] = b;
	};


	Writer.prototype.writeInt = function (i, tag) {
	  if (typeof (i) !== 'number')
	    throw new TypeError('argument must be a Number');
	  if (typeof (tag) !== 'number')
	    tag = types.Integer;

	  var sz = 4;

	  while ((((i & 0xff800000) === 0) || ((i & 0xff800000) === 0xff800000 >> 0)) &&
	        (sz > 1)) {
	    sz--;
	    i <<= 8;
	  }

	  if (sz > 4)
	    throw newInvalidAsn1Error$1('BER ints cannot be > 0xffffffff');

	  this._ensure(2 + sz);
	  this._buf[this._offset++] = tag;
	  this._buf[this._offset++] = sz;

	  while (sz-- > 0) {
	    this._buf[this._offset++] = ((i & 0xff000000) >>> 24);
	    i <<= 8;
	  }

	};


	Writer.prototype.writeNull = function () {
	  this.writeByte(types.Null);
	  this.writeByte(0x00);
	};


	Writer.prototype.writeEnumeration = function (i, tag) {
	  if (typeof (i) !== 'number')
	    throw new TypeError('argument must be a Number');
	  if (typeof (tag) !== 'number')
	    tag = types.Enumeration;

	  return this.writeInt(i, tag);
	};


	Writer.prototype.writeBoolean = function (b, tag) {
	  if (typeof (b) !== 'boolean')
	    throw new TypeError('argument must be a Boolean');
	  if (typeof (tag) !== 'number')
	    tag = types.Boolean;

	  this._ensure(3);
	  this._buf[this._offset++] = tag;
	  this._buf[this._offset++] = 0x01;
	  this._buf[this._offset++] = b ? 0xff : 0x00;
	};


	Writer.prototype.writeString = function (s, tag) {
	  if (typeof (s) !== 'string')
	    throw new TypeError('argument must be a string (was: ' + typeof (s) + ')');
	  if (typeof (tag) !== 'number')
	    tag = types.OctetString;

	  var len = Buffer$4.byteLength(s);
	  this.writeByte(tag);
	  this.writeLength(len);
	  if (len) {
	    this._ensure(len);
	    this._buf.write(s, this._offset);
	    this._offset += len;
	  }
	};


	Writer.prototype.writeBuffer = function (buf, tag) {
	  if (typeof (tag) !== 'number')
	    throw new TypeError('tag must be a number');
	  if (!Buffer$4.isBuffer(buf))
	    throw new TypeError('argument must be a buffer');

	  this.writeByte(tag);
	  this.writeLength(buf.length);
	  this._ensure(buf.length);
	  buf.copy(this._buf, this._offset, 0, buf.length);
	  this._offset += buf.length;
	};


	Writer.prototype.writeStringArray = function (strings) {
	  if ((!strings instanceof Array))
	    throw new TypeError('argument must be an Array[String]');

	  var self = this;
	  strings.forEach(function (s) {
	    self.writeString(s);
	  });
	};

	// This is really to solve DER cases, but whatever for now
	Writer.prototype.writeOID = function (s, tag) {
	  if (typeof (s) !== 'string')
	    throw new TypeError('argument must be a string');
	  if (typeof (tag) !== 'number')
	    tag = types.OID;

	  if (!/^([0-9]+\.){3,}[0-9]+$/.test(s))
	    throw new Error('argument is not a valid OID string');

	  function encodeOctet(bytes, octet) {
	    if (octet < 128) {
	        bytes.push(octet);
	    } else if (octet < 16384) {
	        bytes.push((octet >>> 7) | 0x80);
	        bytes.push(octet & 0x7F);
	    } else if (octet < 2097152) {
	      bytes.push((octet >>> 14) | 0x80);
	      bytes.push(((octet >>> 7) | 0x80) & 0xFF);
	      bytes.push(octet & 0x7F);
	    } else if (octet < 268435456) {
	      bytes.push((octet >>> 21) | 0x80);
	      bytes.push(((octet >>> 14) | 0x80) & 0xFF);
	      bytes.push(((octet >>> 7) | 0x80) & 0xFF);
	      bytes.push(octet & 0x7F);
	    } else {
	      bytes.push(((octet >>> 28) | 0x80) & 0xFF);
	      bytes.push(((octet >>> 21) | 0x80) & 0xFF);
	      bytes.push(((octet >>> 14) | 0x80) & 0xFF);
	      bytes.push(((octet >>> 7) | 0x80) & 0xFF);
	      bytes.push(octet & 0x7F);
	    }
	  }

	  var tmp = s.split('.');
	  var bytes = [];
	  bytes.push(parseInt(tmp[0], 10) * 40 + parseInt(tmp[1], 10));
	  tmp.slice(2).forEach(function (b) {
	    encodeOctet(bytes, parseInt(b, 10));
	  });

	  var self = this;
	  this._ensure(2 + bytes.length);
	  this.writeByte(tag);
	  this.writeLength(bytes.length);
	  bytes.forEach(function (b) {
	    self.writeByte(b);
	  });
	};


	Writer.prototype.writeLength = function (len) {
	  if (typeof (len) !== 'number')
	    throw new TypeError('argument must be a Number');

	  this._ensure(4);

	  if (len <= 0x7f) {
	    this._buf[this._offset++] = len;
	  } else if (len <= 0xff) {
	    this._buf[this._offset++] = 0x81;
	    this._buf[this._offset++] = len;
	  } else if (len <= 0xffff) {
	    this._buf[this._offset++] = 0x82;
	    this._buf[this._offset++] = len >> 8;
	    this._buf[this._offset++] = len;
	  } else if (len <= 0xffffff) {
	    this._buf[this._offset++] = 0x83;
	    this._buf[this._offset++] = len >> 16;
	    this._buf[this._offset++] = len >> 8;
	    this._buf[this._offset++] = len;
	  } else {
	    throw newInvalidAsn1Error$1('Length too long (> 4 bytes)');
	  }
	};

	Writer.prototype.startSequence = function (tag) {
	  if (typeof (tag) !== 'number')
	    tag = types.Sequence | types.Constructor;

	  this.writeByte(tag);
	  this._seq.push(this._offset);
	  this._ensure(3);
	  this._offset += 3;
	};


	Writer.prototype.endSequence = function () {
	  var seq = this._seq.pop();
	  var start = seq + 3;
	  var len = this._offset - start;

	  if (len <= 0x7f) {
	    this._shift(start, len, -2);
	    this._buf[seq] = len;
	  } else if (len <= 0xff) {
	    this._shift(start, len, -1);
	    this._buf[seq] = 0x81;
	    this._buf[seq + 1] = len;
	  } else if (len <= 0xffff) {
	    this._buf[seq] = 0x82;
	    this._buf[seq + 1] = len >> 8;
	    this._buf[seq + 2] = len;
	  } else if (len <= 0xffffff) {
	    this._shift(start, len, 1);
	    this._buf[seq] = 0x83;
	    this._buf[seq + 1] = len >> 16;
	    this._buf[seq + 2] = len >> 8;
	    this._buf[seq + 3] = len;
	  } else {
	    throw newInvalidAsn1Error$1('Sequence too long');
	  }
	};


	Writer.prototype._shift = function (start, len, shift) {
	  assert.ok(start !== undefined);
	  assert.ok(len !== undefined);
	  assert.ok(shift);

	  this._buf.copy(this._buf, start + shift, start, start + len);
	  this._offset += shift;
	};

	Writer.prototype._ensure = function (len) {
	  assert.ok(len);

	  if (this._size - this._offset < len) {
	    var sz = this._size * this._options.growthFactor;
	    if (sz - this._offset < len)
	      sz += len;

	    var buf = Buffer$4.alloc(sz);

	    this._buf.copy(buf, 0, 0, this._offset);
	    this._buf = buf;
	    this._size = sz;
	  }
	};



	// --- Exported API

	var writer = Writer;

	var ber = createCommonjsModule(function (module) {
	// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.








	// --- Exports

	module.exports = {

	  Reader: reader,

	  Writer: writer

	};

	for (var t in types) {
	  if (types.hasOwnProperty(t))
	    module.exports[t] = types[t];
	}
	for (var e in errors) {
	  if (errors.hasOwnProperty(e))
	    module.exports[e] = errors[e];
	}
	});
	var ber_1 = ber.Reader;
	var ber_2 = ber.Writer;

	// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

	// If you have no idea what ASN.1 or BER is, see this:
	// ftp://ftp.rsa.com/pub/pkcs/ascii/layman.asc





	// --- Exported API

	var lib = {

	  Ber: ber,

	  BerReader: ber.Reader,

	  BerWriter: ber.Writer

	};

	var pkcs1$1=createCommonjsModule(function(module){var ber=lib.Ber,_=utils._,utils$1=utils,PRIVATE_OPENING_BOUNDARY="-----BEGIN RSA PRIVATE KEY-----",PRIVATE_CLOSING_BOUNDARY="-----END RSA PRIVATE KEY-----",PUBLIC_OPENING_BOUNDARY="-----BEGIN RSA PUBLIC KEY-----",PUBLIC_CLOSING_BOUNDARY="-----END RSA PUBLIC KEY-----";module.exports={privateExport:function privateExport(key,options){options=options||{};var n=key.n.toBuffer(),d=key.d.toBuffer(),p=key.p.toBuffer(),q=key.q.toBuffer(),dmp1=key.dmp1.toBuffer(),dmq1=key.dmq1.toBuffer(),coeff=key.coeff.toBuffer(),length=n.length+d.length+p.length+q.length+dmp1.length+dmq1.length+coeff.length+512,writer=new ber.Writer({size:length});return writer.startSequence(),writer.writeInt(0),writer.writeBuffer(n,2),writer.writeInt(key.e),writer.writeBuffer(d,2),writer.writeBuffer(p,2),writer.writeBuffer(q,2),writer.writeBuffer(dmp1,2),writer.writeBuffer(dmq1,2),writer.writeBuffer(coeff,2),writer.endSequence(),"der"===options.type?writer.buffer:PRIVATE_OPENING_BOUNDARY+"\n"+utils$1.linebrk(writer.buffer.toString("base64"),64)+"\n"+PRIVATE_CLOSING_BOUNDARY},privateImport:function privateImport(key,data,options){options=options||{};var buffer;if("der"!==options.type){if(isBuffer(data)&&(data=data.toString("utf8")),_.isString(data)){var pem=utils$1.trimSurroundingText(data,PRIVATE_OPENING_BOUNDARY,PRIVATE_CLOSING_BOUNDARY).replace(/\s+|\n\r|\n|\r$/gm,"");buffer=Buffer.from(pem,"base64");}else throw Error("Unsupported key format");}else if(isBuffer(data))buffer=data;else throw Error("Unsupported key format");var reader=new ber.Reader(buffer);reader.readSequence(),reader.readString(2,!0),key.setPrivate(reader.readString(2,!0),reader.readString(2,!0),reader.readString(2,!0),reader.readString(2,!0),reader.readString(2,!0),reader.readString(2,!0),reader.readString(2,!0),reader.readString(2,!0));},publicExport:function publicExport(key,options){options=options||{};var n=key.n.toBuffer(),length=n.length+512,bodyWriter=new ber.Writer({size:length});return bodyWriter.startSequence(),bodyWriter.writeBuffer(n,2),bodyWriter.writeInt(key.e),bodyWriter.endSequence(),"der"===options.type?bodyWriter.buffer:PUBLIC_OPENING_BOUNDARY+"\n"+utils$1.linebrk(bodyWriter.buffer.toString("base64"),64)+"\n"+PUBLIC_CLOSING_BOUNDARY},publicImport:function publicImport(key,data,options){options=options||{};var buffer;if("der"!==options.type){if(isBuffer(data)&&(data=data.toString("utf8")),_.isString(data)){var pem=utils$1.trimSurroundingText(data,PUBLIC_OPENING_BOUNDARY,PUBLIC_CLOSING_BOUNDARY).replace(/\s+|\n\r|\n|\r$/gm,"");buffer=Buffer.from(pem,"base64");}}else if(isBuffer(data))buffer=data;else throw Error("Unsupported key format");var body=new ber.Reader(buffer);body.readSequence(),key.setPublic(body.readString(2,!0),body.readString(2,!0));},autoImport:function autoImport(key,data){return /^[\S\s]*-----BEGIN RSA PRIVATE KEY-----\s*(?=(([A-Za-z0-9+/=]+\s*)+))\1-----END RSA PRIVATE KEY-----[\S\s]*$/g.test(data)?(module.exports.privateImport(key,data),!0):!!/^[\S\s]*-----BEGIN RSA PUBLIC KEY-----\s*(?=(([A-Za-z0-9+/=]+\s*)+))\1-----END RSA PUBLIC KEY-----[\S\s]*$/g.test(data)&&(module.exports.publicImport(key,data),!0)}};});var pkcs1_1=pkcs1$1.privateExport;var pkcs1_2=pkcs1$1.privateImport;var pkcs1_3=pkcs1$1.publicExport;var pkcs1_4=pkcs1$1.publicImport;var pkcs1_5=pkcs1$1.autoImport;

	var pkcs8=createCommonjsModule(function(module){var ber=lib.Ber,_=utils._,PUBLIC_RSA_OID="1.2.840.113549.1.1.1",utils$1=utils,PRIVATE_OPENING_BOUNDARY="-----BEGIN PRIVATE KEY-----",PRIVATE_CLOSING_BOUNDARY="-----END PRIVATE KEY-----",PUBLIC_OPENING_BOUNDARY="-----BEGIN PUBLIC KEY-----",PUBLIC_CLOSING_BOUNDARY="-----END PUBLIC KEY-----";module.exports={privateExport:function privateExport(key,options){options=options||{};var n=key.n.toBuffer(),d=key.d.toBuffer(),p=key.p.toBuffer(),q=key.q.toBuffer(),dmp1=key.dmp1.toBuffer(),dmq1=key.dmq1.toBuffer(),coeff=key.coeff.toBuffer(),length=n.length+d.length+p.length+q.length+dmp1.length+dmq1.length+coeff.length+512,bodyWriter=new ber.Writer({size:length});bodyWriter.startSequence(),bodyWriter.writeInt(0),bodyWriter.writeBuffer(n,2),bodyWriter.writeInt(key.e),bodyWriter.writeBuffer(d,2),bodyWriter.writeBuffer(p,2),bodyWriter.writeBuffer(q,2),bodyWriter.writeBuffer(dmp1,2),bodyWriter.writeBuffer(dmq1,2),bodyWriter.writeBuffer(coeff,2),bodyWriter.endSequence();var writer=new ber.Writer({size:length});return writer.startSequence(),writer.writeInt(0),writer.startSequence(),writer.writeOID(PUBLIC_RSA_OID),writer.writeNull(),writer.endSequence(),writer.writeBuffer(bodyWriter.buffer,4),writer.endSequence(),"der"===options.type?writer.buffer:PRIVATE_OPENING_BOUNDARY+"\n"+utils$1.linebrk(writer.buffer.toString("base64"),64)+"\n"+PRIVATE_CLOSING_BOUNDARY},privateImport:function privateImport(key,data,options){options=options||{};var buffer;if("der"!==options.type){if(isBuffer(data)&&(data=data.toString("utf8")),_.isString(data)){var pem=utils$1.trimSurroundingText(data,PRIVATE_OPENING_BOUNDARY,PRIVATE_CLOSING_BOUNDARY).replace("-----END PRIVATE KEY-----","").replace(/\s+|\n\r|\n|\r$/gm,"");buffer=Buffer.from(pem,"base64");}else throw Error("Unsupported key format");}else if(isBuffer(data))buffer=data;else throw Error("Unsupported key format");var reader=new ber.Reader(buffer);reader.readSequence(),reader.readInt(0);var header=new ber.Reader(reader.readString(48,!0));if(header.readOID(6,!0)!==PUBLIC_RSA_OID)throw Error("Invalid Public key format");var body=new ber.Reader(reader.readString(4,!0));body.readSequence(),body.readString(2,!0),key.setPrivate(body.readString(2,!0),body.readString(2,!0),body.readString(2,!0),body.readString(2,!0),body.readString(2,!0),body.readString(2,!0),body.readString(2,!0),body.readString(2,!0));},publicExport:function publicExport(key,options){options=options||{};var n=key.n.toBuffer(),length=n.length+512,bodyWriter=new ber.Writer({size:length});bodyWriter.writeByte(0),bodyWriter.startSequence(),bodyWriter.writeBuffer(n,2),bodyWriter.writeInt(key.e),bodyWriter.endSequence();var writer=new ber.Writer({size:length});return writer.startSequence(),writer.startSequence(),writer.writeOID(PUBLIC_RSA_OID),writer.writeNull(),writer.endSequence(),writer.writeBuffer(bodyWriter.buffer,3),writer.endSequence(),"der"===options.type?writer.buffer:PUBLIC_OPENING_BOUNDARY+"\n"+utils$1.linebrk(writer.buffer.toString("base64"),64)+"\n"+PUBLIC_CLOSING_BOUNDARY},publicImport:function publicImport(key,data,options){options=options||{};var buffer;if("der"!==options.type){if(isBuffer(data)&&(data=data.toString("utf8")),_.isString(data)){var pem=utils$1.trimSurroundingText(data,PUBLIC_OPENING_BOUNDARY,PUBLIC_CLOSING_BOUNDARY).replace(/\s+|\n\r|\n|\r$/gm,"");buffer=Buffer.from(pem,"base64");}}else if(isBuffer(data))buffer=data;else throw Error("Unsupported key format");var reader=new ber.Reader(buffer);reader.readSequence();var header=new ber.Reader(reader.readString(48,!0));if(header.readOID(6,!0)!==PUBLIC_RSA_OID)throw Error("Invalid Public key format");var body=new ber.Reader(reader.readString(3,!0));body.readByte(),body.readSequence(),key.setPublic(body.readString(2,!0),body.readString(2,!0));},autoImport:function autoImport(key,data){return /^[\S\s]*-----BEGIN PRIVATE KEY-----\s*(?=(([A-Za-z0-9+/=]+\s*)+))\1-----END PRIVATE KEY-----[\S\s]*$/g.test(data)?(module.exports.privateImport(key,data),!0):!!/^[\S\s]*-----BEGIN PUBLIC KEY-----\s*(?=(([A-Za-z0-9+/=]+\s*)+))\1-----END PUBLIC KEY-----[\S\s]*$/g.test(data)&&(module.exports.publicImport(key,data),!0)}};});var pkcs8_1=pkcs8.privateExport;var pkcs8_2=pkcs8.privateImport;var pkcs8_3=pkcs8.publicExport;var pkcs8_4=pkcs8.publicImport;var pkcs8_5=pkcs8.autoImport;

	var components=createCommonjsModule(function(module){module.exports={privateExport:function privateExport(key){return {n:key.n.toBuffer(),e:key.e,d:key.d.toBuffer(),p:key.p.toBuffer(),q:key.q.toBuffer(),dmp1:key.dmp1.toBuffer(),dmq1:key.dmq1.toBuffer(),coeff:key.coeff.toBuffer()}},privateImport:function privateImport(key,data){if(data.n&&data.e&&data.d&&data.p&&data.q&&data.dmp1&&data.dmq1&&data.coeff)key.setPrivate(data.n,data.e,data.d,data.p,data.q,data.dmp1,data.dmq1,data.coeff);else throw Error("Invalid key data")},publicExport:function publicExport(key){return {n:key.n.toBuffer(),e:key.e}},publicImport:function publicImport(key,data){if(data.n&&data.e)key.setPublic(data.n,data.e);else throw Error("Invalid key data")},autoImport:function autoImport(key,data){return !!(data.n&&data.e)&&(data.d&&data.p&&data.q&&data.dmp1&&data.dmq1&&data.coeff?(module.exports.privateImport(key,data),!0):(module.exports.publicImport(key,data),!0))}};});var components_1=components.privateExport;var components_2=components.privateImport;var components_3=components.publicExport;var components_4=components.publicImport;var components_5=components.autoImport;

	var formats=createCommonjsModule(function(module){function formatParse(format){format=format.split("-");for(var keyType="private",keyOpt={type:"default"},i=1;i<format.length;i++)if(format[i])switch(format[i]){case"public":keyType=format[i];break;case"private":keyType=format[i];break;case"pem":keyOpt.type=format[i];break;case"der":keyOpt.type=format[i];}return {scheme:format[0],keyType:keyType,keyOpt:keyOpt}}module.exports={pkcs1:pkcs1$1,pkcs8:pkcs8,components:components,isPrivateExport:function isPrivateExport(format){return module.exports[format]&&"function"==typeof module.exports[format].privateExport},isPrivateImport:function isPrivateImport(format){return module.exports[format]&&"function"==typeof module.exports[format].privateImport},isPublicExport:function isPublicExport(format){return module.exports[format]&&"function"==typeof module.exports[format].publicExport},isPublicImport:function isPublicImport(format){return module.exports[format]&&"function"==typeof module.exports[format].publicImport},detectAndImport:function detectAndImport(key,data,format){if(format===void 0){for(var scheme in module.exports)if("function"==typeof module.exports[scheme].autoImport&&module.exports[scheme].autoImport(key,data))return !0;}else if(format){var fmt=formatParse(format);if(module.exports[fmt.scheme])"private"===fmt.keyType?module.exports[fmt.scheme].privateImport(key,data,fmt.keyOpt):module.exports[fmt.scheme].publicImport(key,data,fmt.keyOpt);else throw Error("Unsupported key format")}return !1},detectAndExport:function detectAndExport(key,format){if(format){var fmt=formatParse(format);if(module.exports[fmt.scheme]){if("private"===fmt.keyType){if(!key.isPrivate())throw Error("This is not private key");return module.exports[fmt.scheme].privateExport(key,fmt.keyOpt)}if(!key.isPublic())throw Error("This is not public key");return module.exports[fmt.scheme].publicExport(key,fmt.keyOpt)}throw Error("Unsupported key format")}}};});var formats_1=formats.pkcs1;var formats_2=formats.pkcs8;var formats_3=formats.components;var formats_4=formats.isPrivateExport;var formats_5=formats.isPrivateImport;var formats_6=formats.isPublicExport;var formats_7=formats.isPublicImport;var formats_8=formats.detectAndImport;var formats_9=formats.detectAndExport;

	var _$3=utils._,utils$1=utils;"undefined"==typeof constants.RSA_NO_PADDING&&(constants.RSA_NO_PADDING=3);var MiniRSA=function(){function NodeRSA(key,format,options){return this instanceof NodeRSA?void(_$3.isObject(format)&&(options=format,format=void 0),this.$options={signingScheme:DEFAULT_SIGNING_SCHEME,signingSchemeOptions:{hash:"sha256",saltLength:null},encryptionScheme:DEFAULT_ENCRYPTION_SCHEME,encryptionSchemeOptions:{hash:"sha1",label:null},environment:utils$1.detectEnvironment(),rsaUtils:this},this.keyPair=new rsa.Key,this.$cache={},isBuffer(key)||_$3.isString(key)?this.importKey(key,format):_$3.isObject(key)&&this.generateKeyPair(key.b,key.e),this.setOptions(options)):new NodeRSA(key,format,options)}var SUPPORTED_HASH_ALGORITHMS={node10:["md4","md5","ripemd160","sha1","sha224","sha256","sha384","sha512"],node:["md4","md5","ripemd160","sha1","sha224","sha256","sha384","sha512"],iojs:["md4","md5","ripemd160","sha1","sha224","sha256","sha384","sha512"],browser:["md5","ripemd160","sha1","sha256","sha512"]},DEFAULT_ENCRYPTION_SCHEME="pkcs1_oaep",DEFAULT_SIGNING_SCHEME="pkcs1",EXPORT_FORMAT_ALIASES={private:"pkcs1-private-pem","private-der":"pkcs1-private-der",public:"pkcs8-public-pem","public-der":"pkcs8-public-der"};return NodeRSA.prototype.setOptions=function(options){if(options=options||{},options.environment&&(this.$options.environment=options.environment),options.signingScheme){if(_$3.isString(options.signingScheme)){var signingScheme=options.signingScheme.toLowerCase().split("-");1==signingScheme.length?-1<SUPPORTED_HASH_ALGORITHMS.node.indexOf(signingScheme[0])?(this.$options.signingSchemeOptions={hash:signingScheme[0]},this.$options.signingScheme=DEFAULT_SIGNING_SCHEME):(this.$options.signingScheme=signingScheme[0],this.$options.signingSchemeOptions={hash:null}):(this.$options.signingSchemeOptions={hash:signingScheme[1]},this.$options.signingScheme=signingScheme[0]);}else _$3.isObject(options.signingScheme)&&(this.$options.signingScheme=options.signingScheme.scheme||DEFAULT_SIGNING_SCHEME,this.$options.signingSchemeOptions=_$3.omit(options.signingScheme,"scheme"));if(!schemes.isSignature(this.$options.signingScheme))throw Error("Unsupported signing scheme");if(this.$options.signingSchemeOptions.hash&&-1===SUPPORTED_HASH_ALGORITHMS[this.$options.environment].indexOf(this.$options.signingSchemeOptions.hash))throw Error("Unsupported hashing algorithm for "+this.$options.environment+" environment")}if(options.encryptionScheme){if(_$3.isString(options.encryptionScheme)?(this.$options.encryptionScheme=options.encryptionScheme.toLowerCase(),this.$options.encryptionSchemeOptions={}):_$3.isObject(options.encryptionScheme)&&(this.$options.encryptionScheme=options.encryptionScheme.scheme||DEFAULT_ENCRYPTION_SCHEME,this.$options.encryptionSchemeOptions=_$3.omit(options.encryptionScheme,"scheme")),!schemes.isEncryption(this.$options.encryptionScheme))throw Error("Unsupported encryption scheme");if(this.$options.encryptionSchemeOptions.hash&&-1===SUPPORTED_HASH_ALGORITHMS[this.$options.environment].indexOf(this.$options.encryptionSchemeOptions.hash))throw Error("Unsupported hashing algorithm for "+this.$options.environment+" environment")}this.keyPair.setOptions(this.$options);},NodeRSA.prototype.generateKeyPair=function(bits,exp){if(bits=bits||2048,exp=exp||65537,0!=bits%8)throw Error("Key size must be a multiple of 8.");return this.keyPair.generate(bits,exp.toString(16)),this.$cache={},this},NodeRSA.prototype.importKey=function(keyData,format){if(!keyData)throw Error("Empty key given");if(format&&(format=EXPORT_FORMAT_ALIASES[format]||format),!formats.detectAndImport(this.keyPair,keyData,format)&&void 0===format)throw Error("Key format must be specified");return this.$cache={},this},NodeRSA.prototype.exportKey=function(format){return format=format||"private",format=EXPORT_FORMAT_ALIASES[format]||format,this.$cache[format]||(this.$cache[format]=formats.detectAndExport(this.keyPair,format)),this.$cache[format]},NodeRSA.prototype.isPrivate=function(){return this.keyPair.isPrivate()},NodeRSA.prototype.isPublic=function(strict){return this.keyPair.isPublic(strict)},NodeRSA.prototype.isEmpty=function(){return !(this.keyPair.n||this.keyPair.e||this.keyPair.d)},NodeRSA.prototype.encrypt=function(buffer,encoding,source_encoding){return this.$$encryptKey(!1,buffer,encoding,source_encoding)},NodeRSA.prototype.decrypt=function(buffer,encoding){return this.$$decryptKey(!1,buffer,encoding)},NodeRSA.prototype.encryptPrivate=function(buffer,encoding,source_encoding){return this.$$encryptKey(!0,buffer,encoding,source_encoding)},NodeRSA.prototype.decryptPublic=function(buffer,encoding){return this.$$decryptKey(!0,buffer,encoding)},NodeRSA.prototype.$$encryptKey=function(usePrivate,buffer,encoding,source_encoding){try{var res=this.keyPair.encrypt(this.$getDataForEncrypt(buffer,source_encoding),usePrivate);return "buffer"!=encoding&&encoding?res.toString(encoding):res}catch(e){throw console.log(e),Error("Error during encryption. Original error: "+e)}},NodeRSA.prototype.$$decryptKey=function(usePublic,buffer,encoding){try{buffer=_$3.isString(buffer)?Buffer.from(buffer,"base64"):buffer;var res=this.keyPair.decrypt(buffer,usePublic);if(null===res)throw Error("Key decrypt method returns null.");return this.$getDecryptedData(res,encoding)}catch(e){throw Error("Error during decryption (probably incorrect key). Original error: "+e)}},NodeRSA.prototype.sign=function(buffer,encoding,source_encoding){if(!this.isPrivate())throw Error("This is not private key");var res=this.keyPair.sign(this.$getDataForEncrypt(buffer,source_encoding));return encoding&&"buffer"!=encoding&&(res=res.toString(encoding)),res},NodeRSA.prototype.verify=function(buffer,signature,source_encoding,signature_encoding){if(!this.isPublic())throw Error("This is not public key");return signature_encoding=signature_encoding&&"buffer"!=signature_encoding?signature_encoding:null,this.keyPair.verify(this.$getDataForEncrypt(buffer,source_encoding),signature,signature_encoding)},NodeRSA.prototype.getKeySize=function(){return this.keyPair.keySize},NodeRSA.prototype.getMaxMessageSize=function(){return this.keyPair.maxMessageLength},NodeRSA.prototype.$getDataForEncrypt=function(buffer,encoding){if(_$3.isString(buffer)||_$3.isNumber(buffer))return Buffer.from(""+buffer,encoding||"utf8");if(isBuffer(buffer))return buffer;if(_$3.isObject(buffer))return Buffer.from(stringify$1(buffer));throw Error("Unexpected data type")},NodeRSA.prototype.$getDecryptedData=function(buffer,encoding){return encoding=encoding||"buffer","buffer"==encoding?buffer:"json"==encoding?JSON.parse(buffer.toString()):buffer.toString(encoding)},NodeRSA}();

	return MiniRSA;

}));
//# sourceMappingURL=mini-rsa.js.map
