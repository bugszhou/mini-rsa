!function(t,r){"object"==typeof exports&&"undefined"!=typeof module?module.exports=r():"function"==typeof define&&define.amd?define(r):(t=t||self,function(){var e=t["mini-rsa"],n=t["mini-rsa"]=r();n.noConflict=function(){return t["mini-rsa"]=e,n}}())}(this,function(){"use strict";var t=function(t,r){return t(r={exports:{}},r.exports),r.exports}(function(t){var r=t.exports={version:"2.6.9"};"number"==typeof __e&&(__e=r)}),r=(t.version,t.JSON||(t.JSON={stringify:JSON.stringify})),e=function(t){return r.stringify.apply(r,arguments)},n="undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{},i=[],o=[],s="undefined"!=typeof Uint8Array?Uint8Array:Array,h=!1;function u(){h=!0;for(var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",r=0,e=t.length;r<e;++r)i[r]=t[r],o[t.charCodeAt(r)]=r;o["-".charCodeAt(0)]=62,o["_".charCodeAt(0)]=63}function f(t,r,e){for(var n,o,s=[],h=r;h<e;h+=3)n=(t[h]<<16)+(t[h+1]<<8)+t[h+2],s.push(i[(o=n)>>18&63]+i[o>>12&63]+i[o>>6&63]+i[63&o]);return s.join("")}function a(t){var r;h||u();for(var e=t.length,n=e%3,o="",s=[],a=0,c=e-n;a<c;a+=16383)s.push(f(t,a,a+16383>c?c:a+16383));return 1===n?(r=t[e-1],o+=i[r>>2],o+=i[r<<4&63],o+="=="):2===n&&(r=(t[e-2]<<8)+t[e-1],o+=i[r>>10],o+=i[r>>4&63],o+=i[r<<2&63],o+="="),s.push(o),s.join("")}function c(t,r,e,n,i){var o,s,h=8*i-n-1,u=(1<<h)-1,f=u>>1,a=-7,c=e?i-1:0,p=e?-1:1,l=t[r+c];for(c+=p,o=l&(1<<-a)-1,l>>=-a,a+=h;a>0;o=256*o+t[r+c],c+=p,a-=8);for(s=o&(1<<-a)-1,o>>=-a,a+=n;a>0;s=256*s+t[r+c],c+=p,a-=8);if(0===o)o=1-f;else{if(o===u)return s?NaN:1/0*(l?-1:1);s+=Math.pow(2,n),o-=f}return(l?-1:1)*s*Math.pow(2,o-n)}function p(t,r,e,n,i,o){var s,h,u,f=8*o-i-1,a=(1<<f)-1,c=a>>1,p=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,l=n?0:o-1,g=n?1:-1,y=r<0||0===r&&1/r<0?1:0;for(r=Math.abs(r),isNaN(r)||r===1/0?(h=isNaN(r)?1:0,s=a):(s=Math.floor(Math.log(r)/Math.LN2),r*(u=Math.pow(2,-s))<1&&(s--,u*=2),(r+=s+c>=1?p/u:p*Math.pow(2,1-c))*u>=2&&(s++,u/=2),s+c>=a?(h=0,s=a):s+c>=1?(h=(r*u-1)*Math.pow(2,i),s+=c):(h=r*Math.pow(2,c-1)*Math.pow(2,i),s=0));i>=8;t[e+l]=255&h,l+=g,h/=256,i-=8);for(s=s<<i|h,f+=i;f>0;t[e+l]=255&s,l+=g,s/=256,f-=8);t[e+l-g]|=128*y}var l={}.toString,g=Array.isArray||function(t){return"[object Array]"==l.call(t)};function y(){return w.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function d(t,r){if(y()<r)throw new RangeError("Invalid typed array length");return w.TYPED_ARRAY_SUPPORT?(t=new Uint8Array(r)).__proto__=w.prototype:(null===t&&(t=new w(r)),t.length=r),t}function w(t,r,e){if(!(w.TYPED_ARRAY_SUPPORT||this instanceof w))return new w(t,r,e);if("number"==typeof t){if("string"==typeof r)throw new Error("If encoding is specified then the first argument must be a string");return E(this,t)}return m(this,t,r,e)}function m(t,r,e,n){if("number"==typeof r)throw new TypeError('"value" argument must not be a number');return"undefined"!=typeof ArrayBuffer&&r instanceof ArrayBuffer?function(t,r,e,n){if(r.byteLength,e<0||r.byteLength<e)throw new RangeError("'offset' is out of bounds");if(r.byteLength<e+(n||0))throw new RangeError("'length' is out of bounds");r=void 0===e&&void 0===n?new Uint8Array(r):void 0===n?new Uint8Array(r,e):new Uint8Array(r,e,n);w.TYPED_ARRAY_SUPPORT?(t=r).__proto__=w.prototype:t=b(t,r);return t}(t,r,e,n):"string"==typeof r?function(t,r,e){"string"==typeof e&&""!==e||(e="utf8");if(!w.isEncoding(e))throw new TypeError('"encoding" must be a valid string encoding');var n=0|P(r,e),i=(t=d(t,n)).write(r,e);i!==n&&(t=t.slice(0,i));return t}(t,r,e):function(t,r){if(S(r)){var e=0|A(r.length);return 0===(t=d(t,e)).length?t:(r.copy(t,0,0,e),t)}if(r){if("undefined"!=typeof ArrayBuffer&&r.buffer instanceof ArrayBuffer||"length"in r)return"number"!=typeof r.length||(n=r.length)!=n?d(t,0):b(t,r);if("Buffer"===r.type&&g(r.data))return b(t,r.data)}var n;throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")}(t,r)}function v(t){if("number"!=typeof t)throw new TypeError('"size" argument must be a number');if(t<0)throw new RangeError('"size" argument must not be negative')}function E(t,r){if(v(r),t=d(t,r<0?0:0|A(r)),!w.TYPED_ARRAY_SUPPORT)for(var e=0;e<r;++e)t[e]=0;return t}function b(t,r){var e=r.length<0?0:0|A(r.length);t=d(t,e);for(var n=0;n<e;n+=1)t[n]=255&r[n];return t}function A(t){if(t>=y())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+y().toString(16)+" bytes");return 0|t}function S(t){return!(null==t||!t._isBuffer)}function P(t,r){if(S(t))return t.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(t)||t instanceof ArrayBuffer))return t.byteLength;"string"!=typeof t&&(t=""+t);var e=t.length;if(0===e)return 0;for(var n=!1;;)switch(r){case"ascii":case"latin1":case"binary":return e;case"utf8":case"utf-8":case void 0:return Q(t).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*e;case"hex":return e>>>1;case"base64":return W(t).length;default:if(n)return Q(t).length;r=(""+r).toLowerCase(),n=!0}}function R(t,r,e){var n=!1;if((void 0===r||r<0)&&(r=0),r>this.length)return"";if((void 0===e||e>this.length)&&(e=this.length),e<=0)return"";if((e>>>=0)<=(r>>>=0))return"";for(t||(t="utf8");;)switch(t){case"hex":return N(this,r,e);case"utf8":case"utf-8":return C(this,r,e);case"ascii":return L(this,r,e);case"latin1":case"binary":return M(this,r,e);case"base64":return D(this,r,e);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return j(this,r,e);default:if(n)throw new TypeError("Unknown encoding: "+t);t=(t+"").toLowerCase(),n=!0}}function _(t,r,e){var n=t[r];t[r]=t[e],t[e]=n}function T(t,r,e,n,i){if(0===t.length)return-1;if("string"==typeof e?(n=e,e=0):e>2147483647?e=2147483647:e<-2147483648&&(e=-2147483648),e=+e,isNaN(e)&&(e=i?0:t.length-1),e<0&&(e=t.length+e),e>=t.length){if(i)return-1;e=t.length-1}else if(e<0){if(!i)return-1;e=0}if("string"==typeof r&&(r=w.from(r,n)),S(r))return 0===r.length?-1:O(t,r,e,n,i);if("number"==typeof r)return r&=255,w.TYPED_ARRAY_SUPPORT&&"function"==typeof Uint8Array.prototype.indexOf?i?Uint8Array.prototype.indexOf.call(t,r,e):Uint8Array.prototype.lastIndexOf.call(t,r,e):O(t,[r],e,n,i);throw new TypeError("val must be string, number or Buffer")}function O(t,r,e,n,i){var o,s=1,h=t.length,u=r.length;if(void 0!==n&&("ucs2"===(n=String(n).toLowerCase())||"ucs-2"===n||"utf16le"===n||"utf-16le"===n)){if(t.length<2||r.length<2)return-1;s=2,h/=2,u/=2,e/=2}function f(t,r){return 1===s?t[r]:t.readUInt16BE(r*s)}if(i){var a=-1;for(o=e;o<h;o++)if(f(t,o)===f(r,-1===a?0:o-a)){if(-1===a&&(a=o),o-a+1===u)return a*s}else-1!==a&&(o-=o-a),a=-1}else for(e+u>h&&(e=h-u),o=e;o>=0;o--){for(var c=!0,p=0;p<u;p++)if(f(t,o+p)!==f(r,p)){c=!1;break}if(c)return o}return-1}function U(t,r,e,n){e=Number(e)||0;var i=t.length-e;n?(n=Number(n))>i&&(n=i):n=i;var o=r.length;if(o%2!=0)throw new TypeError("Invalid hex string");n>o/2&&(n=o/2);for(var s=0;s<n;++s){var h=parseInt(r.substr(2*s,2),16);if(isNaN(h))return s;t[e+s]=h}return s}function B(t,r,e,n){return X(Q(r,t.length-e),t,e,n)}function $(t,r,e,n){return X(function(t){for(var r=[],e=0;e<t.length;++e)r.push(255&t.charCodeAt(e));return r}(r),t,e,n)}function Y(t,r,e,n){return $(t,r,e,n)}function I(t,r,e,n){return X(W(r),t,e,n)}function k(t,r,e,n){return X(function(t,r){for(var e,n,i,o=[],s=0;s<t.length&&!((r-=2)<0);++s)e=t.charCodeAt(s),n=e>>8,i=e%256,o.push(i),o.push(n);return o}(r,t.length-e),t,e,n)}function D(t,r,e){return 0===r&&e===t.length?a(t):a(t.slice(r,e))}function C(t,r,e){e=Math.min(t.length,e);for(var n=[],i=r;i<e;){var o,s,h,u,f=t[i],a=null,c=f>239?4:f>223?3:f>191?2:1;if(i+c<=e)switch(c){case 1:f<128&&(a=f);break;case 2:128==(192&(o=t[i+1]))&&(u=(31&f)<<6|63&o)>127&&(a=u);break;case 3:o=t[i+1],s=t[i+2],128==(192&o)&&128==(192&s)&&(u=(15&f)<<12|(63&o)<<6|63&s)>2047&&(u<55296||u>57343)&&(a=u);break;case 4:o=t[i+1],s=t[i+2],h=t[i+3],128==(192&o)&&128==(192&s)&&128==(192&h)&&(u=(15&f)<<18|(63&o)<<12|(63&s)<<6|63&h)>65535&&u<1114112&&(a=u)}null===a?(a=65533,c=1):a>65535&&(a-=65536,n.push(a>>>10&1023|55296),a=56320|1023&a),n.push(a),i+=c}return function(t){var r=t.length;if(r<=x)return String.fromCharCode.apply(String,t);var e="",n=0;for(;n<r;)e+=String.fromCharCode.apply(String,t.slice(n,n+=x));return e}(n)}w.TYPED_ARRAY_SUPPORT=void 0===n.TYPED_ARRAY_SUPPORT||n.TYPED_ARRAY_SUPPORT,w.poolSize=8192,w._augment=function(t){return t.__proto__=w.prototype,t},w.from=function(t,r,e){return m(null,t,r,e)},w.TYPED_ARRAY_SUPPORT&&(w.prototype.__proto__=Uint8Array.prototype,w.__proto__=Uint8Array),w.alloc=function(t,r,e){return function(t,r,e,n){return v(r),r<=0?d(t,r):void 0!==e?"string"==typeof n?d(t,r).fill(e,n):d(t,r).fill(e):d(t,r)}(null,t,r,e)},w.allocUnsafe=function(t){return E(null,t)},w.allocUnsafeSlow=function(t){return E(null,t)},w.isBuffer=tt,w.compare=function(t,r){if(!S(t)||!S(r))throw new TypeError("Arguments must be Buffers");if(t===r)return 0;for(var e=t.length,n=r.length,i=0,o=Math.min(e,n);i<o;++i)if(t[i]!==r[i]){e=t[i],n=r[i];break}return e<n?-1:n<e?1:0},w.isEncoding=function(t){switch(String(t).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},w.concat=function(t,r){if(!g(t))throw new TypeError('"list" argument must be an Array of Buffers');if(0===t.length)return w.alloc(0);var e;if(void 0===r)for(r=0,e=0;e<t.length;++e)r+=t[e].length;var n=w.allocUnsafe(r),i=0;for(e=0;e<t.length;++e){var o=t[e];if(!S(o))throw new TypeError('"list" argument must be an Array of Buffers');o.copy(n,i),i+=o.length}return n},w.byteLength=P,w.prototype._isBuffer=!0,w.prototype.swap16=function(){var t=this.length;if(t%2!=0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var r=0;r<t;r+=2)_(this,r,r+1);return this},w.prototype.swap32=function(){var t=this.length;if(t%4!=0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var r=0;r<t;r+=4)_(this,r,r+3),_(this,r+1,r+2);return this},w.prototype.swap64=function(){var t=this.length;if(t%8!=0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var r=0;r<t;r+=8)_(this,r,r+7),_(this,r+1,r+6),_(this,r+2,r+5),_(this,r+3,r+4);return this},w.prototype.toString=function(){var t=0|this.length;return 0===t?"":0===arguments.length?C(this,0,t):R.apply(this,arguments)},w.prototype.equals=function(t){if(!S(t))throw new TypeError("Argument must be a Buffer");return this===t||0===w.compare(this,t)},w.prototype.inspect=function(){var t="";return this.length>0&&(t=this.toString("hex",0,50).match(/.{2}/g).join(" "),this.length>50&&(t+=" ... ")),"<Buffer "+t+">"},w.prototype.compare=function(t,r,e,n,i){if(!S(t))throw new TypeError("Argument must be a Buffer");if(void 0===r&&(r=0),void 0===e&&(e=t?t.length:0),void 0===n&&(n=0),void 0===i&&(i=this.length),r<0||e>t.length||n<0||i>this.length)throw new RangeError("out of range index");if(n>=i&&r>=e)return 0;if(n>=i)return-1;if(r>=e)return 1;if(this===t)return 0;for(var o=(i>>>=0)-(n>>>=0),s=(e>>>=0)-(r>>>=0),h=Math.min(o,s),u=this.slice(n,i),f=t.slice(r,e),a=0;a<h;++a)if(u[a]!==f[a]){o=u[a],s=f[a];break}return o<s?-1:s<o?1:0},w.prototype.includes=function(t,r,e){return-1!==this.indexOf(t,r,e)},w.prototype.indexOf=function(t,r,e){return T(this,t,r,e,!0)},w.prototype.lastIndexOf=function(t,r,e){return T(this,t,r,e,!1)},w.prototype.write=function(t,r,e,n){if(void 0===r)n="utf8",e=this.length,r=0;else if(void 0===e&&"string"==typeof r)n=r,e=this.length,r=0;else{if(!isFinite(r))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");r|=0,isFinite(e)?(e|=0,void 0===n&&(n="utf8")):(n=e,e=void 0)}var i=this.length-r;if((void 0===e||e>i)&&(e=i),t.length>0&&(e<0||r<0)||r>this.length)throw new RangeError("Attempt to write outside buffer bounds");n||(n="utf8");for(var o=!1;;)switch(n){case"hex":return U(this,t,r,e);case"utf8":case"utf-8":return B(this,t,r,e);case"ascii":return $(this,t,r,e);case"latin1":case"binary":return Y(this,t,r,e);case"base64":return I(this,t,r,e);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return k(this,t,r,e);default:if(o)throw new TypeError("Unknown encoding: "+n);n=(""+n).toLowerCase(),o=!0}},w.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var x=4096;function L(t,r,e){var n="";e=Math.min(t.length,e);for(var i=r;i<e;++i)n+=String.fromCharCode(127&t[i]);return n}function M(t,r,e){var n="";e=Math.min(t.length,e);for(var i=r;i<e;++i)n+=String.fromCharCode(t[i]);return n}function N(t,r,e){var n=t.length;(!r||r<0)&&(r=0),(!e||e<0||e>n)&&(e=n);for(var i="",o=r;o<e;++o)i+=H(t[o]);return i}function j(t,r,e){for(var n=t.slice(r,e),i="",o=0;o<n.length;o+=2)i+=String.fromCharCode(n[o]+256*n[o+1]);return i}function K(t,r,e){if(t%1!=0||t<0)throw new RangeError("offset is not uint");if(t+r>e)throw new RangeError("Trying to access beyond buffer length")}function z(t,r,e,n,i,o){if(!S(t))throw new TypeError('"buffer" argument must be a Buffer instance');if(r>i||r<o)throw new RangeError('"value" argument is out of bounds');if(e+n>t.length)throw new RangeError("Index out of range")}function F(t,r,e,n){r<0&&(r=65535+r+1);for(var i=0,o=Math.min(t.length-e,2);i<o;++i)t[e+i]=(r&255<<8*(n?i:1-i))>>>8*(n?i:1-i)}function q(t,r,e,n){r<0&&(r=4294967295+r+1);for(var i=0,o=Math.min(t.length-e,4);i<o;++i)t[e+i]=r>>>8*(n?i:3-i)&255}function J(t,r,e,n,i,o){if(e+n>t.length)throw new RangeError("Index out of range");if(e<0)throw new RangeError("Index out of range")}function G(t,r,e,n,i){return i||J(t,0,e,4),p(t,r,e,n,23,4),e+4}function V(t,r,e,n,i){return i||J(t,0,e,8),p(t,r,e,n,52,8),e+8}w.prototype.slice=function(t,r){var e,n=this.length;if((t=~~t)<0?(t+=n)<0&&(t=0):t>n&&(t=n),(r=void 0===r?n:~~r)<0?(r+=n)<0&&(r=0):r>n&&(r=n),r<t&&(r=t),w.TYPED_ARRAY_SUPPORT)(e=this.subarray(t,r)).__proto__=w.prototype;else{var i=r-t;e=new w(i,void 0);for(var o=0;o<i;++o)e[o]=this[o+t]}return e},w.prototype.readUIntLE=function(t,r,e){t|=0,r|=0,e||K(t,r,this.length);for(var n=this[t],i=1,o=0;++o<r&&(i*=256);)n+=this[t+o]*i;return n},w.prototype.readUIntBE=function(t,r,e){t|=0,r|=0,e||K(t,r,this.length);for(var n=this[t+--r],i=1;r>0&&(i*=256);)n+=this[t+--r]*i;return n},w.prototype.readUInt8=function(t,r){return r||K(t,1,this.length),this[t]},w.prototype.readUInt16LE=function(t,r){return r||K(t,2,this.length),this[t]|this[t+1]<<8},w.prototype.readUInt16BE=function(t,r){return r||K(t,2,this.length),this[t]<<8|this[t+1]},w.prototype.readUInt32LE=function(t,r){return r||K(t,4,this.length),(this[t]|this[t+1]<<8|this[t+2]<<16)+16777216*this[t+3]},w.prototype.readUInt32BE=function(t,r){return r||K(t,4,this.length),16777216*this[t]+(this[t+1]<<16|this[t+2]<<8|this[t+3])},w.prototype.readIntLE=function(t,r,e){t|=0,r|=0,e||K(t,r,this.length);for(var n=this[t],i=1,o=0;++o<r&&(i*=256);)n+=this[t+o]*i;return n>=(i*=128)&&(n-=Math.pow(2,8*r)),n},w.prototype.readIntBE=function(t,r,e){t|=0,r|=0,e||K(t,r,this.length);for(var n=r,i=1,o=this[t+--n];n>0&&(i*=256);)o+=this[t+--n]*i;return o>=(i*=128)&&(o-=Math.pow(2,8*r)),o},w.prototype.readInt8=function(t,r){return r||K(t,1,this.length),128&this[t]?-1*(255-this[t]+1):this[t]},w.prototype.readInt16LE=function(t,r){r||K(t,2,this.length);var e=this[t]|this[t+1]<<8;return 32768&e?4294901760|e:e},w.prototype.readInt16BE=function(t,r){r||K(t,2,this.length);var e=this[t+1]|this[t]<<8;return 32768&e?4294901760|e:e},w.prototype.readInt32LE=function(t,r){return r||K(t,4,this.length),this[t]|this[t+1]<<8|this[t+2]<<16|this[t+3]<<24},w.prototype.readInt32BE=function(t,r){return r||K(t,4,this.length),this[t]<<24|this[t+1]<<16|this[t+2]<<8|this[t+3]},w.prototype.readFloatLE=function(t,r){return r||K(t,4,this.length),c(this,t,!0,23,4)},w.prototype.readFloatBE=function(t,r){return r||K(t,4,this.length),c(this,t,!1,23,4)},w.prototype.readDoubleLE=function(t,r){return r||K(t,8,this.length),c(this,t,!0,52,8)},w.prototype.readDoubleBE=function(t,r){return r||K(t,8,this.length),c(this,t,!1,52,8)},w.prototype.writeUIntLE=function(t,r,e,n){(t=+t,r|=0,e|=0,n)||z(this,t,r,e,Math.pow(2,8*e)-1,0);var i=1,o=0;for(this[r]=255&t;++o<e&&(i*=256);)this[r+o]=t/i&255;return r+e},w.prototype.writeUIntBE=function(t,r,e,n){(t=+t,r|=0,e|=0,n)||z(this,t,r,e,Math.pow(2,8*e)-1,0);var i=e-1,o=1;for(this[r+i]=255&t;--i>=0&&(o*=256);)this[r+i]=t/o&255;return r+e},w.prototype.writeUInt8=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,1,255,0),w.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),this[r]=255&t,r+1},w.prototype.writeUInt16LE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,2,65535,0),w.TYPED_ARRAY_SUPPORT?(this[r]=255&t,this[r+1]=t>>>8):F(this,t,r,!0),r+2},w.prototype.writeUInt16BE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,2,65535,0),w.TYPED_ARRAY_SUPPORT?(this[r]=t>>>8,this[r+1]=255&t):F(this,t,r,!1),r+2},w.prototype.writeUInt32LE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,4,4294967295,0),w.TYPED_ARRAY_SUPPORT?(this[r+3]=t>>>24,this[r+2]=t>>>16,this[r+1]=t>>>8,this[r]=255&t):q(this,t,r,!0),r+4},w.prototype.writeUInt32BE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,4,4294967295,0),w.TYPED_ARRAY_SUPPORT?(this[r]=t>>>24,this[r+1]=t>>>16,this[r+2]=t>>>8,this[r+3]=255&t):q(this,t,r,!1),r+4},w.prototype.writeIntLE=function(t,r,e,n){if(t=+t,r|=0,!n){var i=Math.pow(2,8*e-1);z(this,t,r,e,i-1,-i)}var o=0,s=1,h=0;for(this[r]=255&t;++o<e&&(s*=256);)t<0&&0===h&&0!==this[r+o-1]&&(h=1),this[r+o]=(t/s>>0)-h&255;return r+e},w.prototype.writeIntBE=function(t,r,e,n){if(t=+t,r|=0,!n){var i=Math.pow(2,8*e-1);z(this,t,r,e,i-1,-i)}var o=e-1,s=1,h=0;for(this[r+o]=255&t;--o>=0&&(s*=256);)t<0&&0===h&&0!==this[r+o+1]&&(h=1),this[r+o]=(t/s>>0)-h&255;return r+e},w.prototype.writeInt8=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,1,127,-128),w.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),t<0&&(t=255+t+1),this[r]=255&t,r+1},w.prototype.writeInt16LE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,2,32767,-32768),w.TYPED_ARRAY_SUPPORT?(this[r]=255&t,this[r+1]=t>>>8):F(this,t,r,!0),r+2},w.prototype.writeInt16BE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,2,32767,-32768),w.TYPED_ARRAY_SUPPORT?(this[r]=t>>>8,this[r+1]=255&t):F(this,t,r,!1),r+2},w.prototype.writeInt32LE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,4,2147483647,-2147483648),w.TYPED_ARRAY_SUPPORT?(this[r]=255&t,this[r+1]=t>>>8,this[r+2]=t>>>16,this[r+3]=t>>>24):q(this,t,r,!0),r+4},w.prototype.writeInt32BE=function(t,r,e){return t=+t,r|=0,e||z(this,t,r,4,2147483647,-2147483648),t<0&&(t=4294967295+t+1),w.TYPED_ARRAY_SUPPORT?(this[r]=t>>>24,this[r+1]=t>>>16,this[r+2]=t>>>8,this[r+3]=255&t):q(this,t,r,!1),r+4},w.prototype.writeFloatLE=function(t,r,e){return G(this,t,r,!0,e)},w.prototype.writeFloatBE=function(t,r,e){return G(this,t,r,!1,e)},w.prototype.writeDoubleLE=function(t,r,e){return V(this,t,r,!0,e)},w.prototype.writeDoubleBE=function(t,r,e){return V(this,t,r,!1,e)},w.prototype.copy=function(t,r,e,n){if(e||(e=0),n||0===n||(n=this.length),r>=t.length&&(r=t.length),r||(r=0),n>0&&n<e&&(n=e),n===e)return 0;if(0===t.length||0===this.length)return 0;if(r<0)throw new RangeError("targetStart out of bounds");if(e<0||e>=this.length)throw new RangeError("sourceStart out of bounds");if(n<0)throw new RangeError("sourceEnd out of bounds");n>this.length&&(n=this.length),t.length-r<n-e&&(n=t.length-r+e);var i,o=n-e;if(this===t&&e<r&&r<n)for(i=o-1;i>=0;--i)t[i+r]=this[i+e];else if(o<1e3||!w.TYPED_ARRAY_SUPPORT)for(i=0;i<o;++i)t[i+r]=this[i+e];else Uint8Array.prototype.set.call(t,this.subarray(e,e+o),r);return o},w.prototype.fill=function(t,r,e,n){if("string"==typeof t){if("string"==typeof r?(n=r,r=0,e=this.length):"string"==typeof e&&(n=e,e=this.length),1===t.length){var i=t.charCodeAt(0);i<256&&(t=i)}if(void 0!==n&&"string"!=typeof n)throw new TypeError("encoding must be a string");if("string"==typeof n&&!w.isEncoding(n))throw new TypeError("Unknown encoding: "+n)}else"number"==typeof t&&(t&=255);if(r<0||this.length<r||this.length<e)throw new RangeError("Out of range index");if(e<=r)return this;var o;if(r>>>=0,e=void 0===e?this.length:e>>>0,t||(t=0),"number"==typeof t)for(o=r;o<e;++o)this[o]=t;else{var s=S(t)?t:Q(new w(t,n).toString()),h=s.length;for(o=0;o<e-r;++o)this[o+r]=s[o%h]}return this};var Z=/[^+\/0-9A-Za-z-_]/g;function H(t){return t<16?"0"+t.toString(16):t.toString(16)}function Q(t,r){var e;r=r||1/0;for(var n=t.length,i=null,o=[],s=0;s<n;++s){if((e=t.charCodeAt(s))>55295&&e<57344){if(!i){if(e>56319){(r-=3)>-1&&o.push(239,191,189);continue}if(s+1===n){(r-=3)>-1&&o.push(239,191,189);continue}i=e;continue}if(e<56320){(r-=3)>-1&&o.push(239,191,189),i=e;continue}e=65536+(i-55296<<10|e-56320)}else i&&(r-=3)>-1&&o.push(239,191,189);if(i=null,e<128){if((r-=1)<0)break;o.push(e)}else if(e<2048){if((r-=2)<0)break;o.push(e>>6|192,63&e|128)}else if(e<65536){if((r-=3)<0)break;o.push(e>>12|224,e>>6&63|128,63&e|128)}else{if(!(e<1114112))throw new Error("Invalid code point");if((r-=4)<0)break;o.push(e>>18|240,e>>12&63|128,e>>6&63|128,63&e|128)}}return o}function W(t){return function(t){var r,e,n,i,f,a;h||u();var c=t.length;if(c%4>0)throw new Error("Invalid string. Length must be a multiple of 4");f="="===t[c-2]?2:"="===t[c-1]?1:0,a=new s(3*c/4-f),n=f>0?c-4:c;var p=0;for(r=0,e=0;r<n;r+=4,e+=3)i=o[t.charCodeAt(r)]<<18|o[t.charCodeAt(r+1)]<<12|o[t.charCodeAt(r+2)]<<6|o[t.charCodeAt(r+3)],a[p++]=i>>16&255,a[p++]=i>>8&255,a[p++]=255&i;return 2===f?(i=o[t.charCodeAt(r)]<<2|o[t.charCodeAt(r+1)]>>4,a[p++]=255&i):1===f&&(i=o[t.charCodeAt(r)]<<10|o[t.charCodeAt(r+1)]<<4|o[t.charCodeAt(r+2)]>>2,a[p++]=i>>8&255,a[p++]=255&i),a}(function(t){if((t=function(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")}(t).replace(Z,"")).length<2)return"";for(;t.length%4!=0;)t+="=";return t}(t))}function X(t,r,e,n){for(var i=0;i<n&&!(i+e>=r.length||i>=t.length);++i)r[i+e]=t[i];return i}function tt(t){return null!=t&&(!!t._isBuffer||rt(t)||function(t){return"function"==typeof t.readFloatLE&&"function"==typeof t.slice&&rt(t.slice(0,0))}(t))}function rt(t){return!!t.constructor&&"function"==typeof t.constructor.isBuffer&&t.constructor.isBuffer(t)}var et=require("constants"),nt=require("./libs/rsa.js"),it=(require("crypto"),require("asn1").Ber,require("./utils")._),ot=require("./utils"),st=require("./schemes/schemes.js"),ht=require("./formats/formats.js");return void 0===et.RSA_NO_PADDING&&(et.RSA_NO_PADDING=3),function(){function t(r,e,o){return this instanceof t?(it.isObject(e)&&(o=e,e=void 0),this.$options={signingScheme:i,signingSchemeOptions:{hash:"sha256",saltLength:null},encryptionScheme:n,encryptionSchemeOptions:{hash:"sha1",label:null},environment:ot.detectEnvironment(),rsaUtils:this},this.keyPair=new nt.Key,this.$cache={},tt(r)||it.isString(r)?this.importKey(r,e):it.isObject(r)&&this.generateKeyPair(r.b,r.e),void this.setOptions(o)):new t(r,e,o)}var r={node10:["md4","md5","ripemd160","sha1","sha224","sha256","sha384","sha512"],node:["md4","md5","ripemd160","sha1","sha224","sha256","sha384","sha512"],iojs:["md4","md5","ripemd160","sha1","sha224","sha256","sha384","sha512"],browser:["md5","ripemd160","sha1","sha256","sha512"]},n="pkcs1_oaep",i="pkcs1",o={private:"pkcs1-private-pem","private-der":"pkcs1-private-der",public:"pkcs8-public-pem","public-der":"pkcs8-public-der"};return t.prototype.setOptions=function(t){if((t=t||{}).environment&&(this.$options.environment=t.environment),t.signingScheme){if(it.isString(t.signingScheme)){var e=t.signingScheme.toLowerCase().split("-");1==e.length?-1<r.node.indexOf(e[0])?(this.$options.signingSchemeOptions={hash:e[0]},this.$options.signingScheme=i):(this.$options.signingScheme=e[0],this.$options.signingSchemeOptions={hash:null}):(this.$options.signingSchemeOptions={hash:e[1]},this.$options.signingScheme=e[0])}else it.isObject(t.signingScheme)&&(this.$options.signingScheme=t.signingScheme.scheme||i,this.$options.signingSchemeOptions=it.omit(t.signingScheme,"scheme"));if(!st.isSignature(this.$options.signingScheme))throw Error("Unsupported signing scheme");if(this.$options.signingSchemeOptions.hash&&-1===r[this.$options.environment].indexOf(this.$options.signingSchemeOptions.hash))throw Error("Unsupported hashing algorithm for "+this.$options.environment+" environment")}if(t.encryptionScheme){if(it.isString(t.encryptionScheme)?(this.$options.encryptionScheme=t.encryptionScheme.toLowerCase(),this.$options.encryptionSchemeOptions={}):it.isObject(t.encryptionScheme)&&(this.$options.encryptionScheme=t.encryptionScheme.scheme||n,this.$options.encryptionSchemeOptions=it.omit(t.encryptionScheme,"scheme")),!st.isEncryption(this.$options.encryptionScheme))throw Error("Unsupported encryption scheme");if(this.$options.encryptionSchemeOptions.hash&&-1===r[this.$options.environment].indexOf(this.$options.encryptionSchemeOptions.hash))throw Error("Unsupported hashing algorithm for "+this.$options.environment+" environment")}this.keyPair.setOptions(this.$options)},t.prototype.generateKeyPair=function(t,r){if(r=r||65537,0!=(t=t||2048)%8)throw Error("Key size must be a multiple of 8.");return this.keyPair.generate(t,r.toString(16)),this.$cache={},this},t.prototype.importKey=function(t,r){if(!t)throw Error("Empty key given");if(r&&(r=o[r]||r),!ht.detectAndImport(this.keyPair,t,r)&&void 0===r)throw Error("Key format must be specified");return this.$cache={},this},t.prototype.exportKey=function(t){return t=o[t=t||"private"]||t,this.$cache[t]||(this.$cache[t]=ht.detectAndExport(this.keyPair,t)),this.$cache[t]},t.prototype.isPrivate=function(){return this.keyPair.isPrivate()},t.prototype.isPublic=function(t){return this.keyPair.isPublic(t)},t.prototype.isEmpty=function(){return!(this.keyPair.n||this.keyPair.e||this.keyPair.d)},t.prototype.encrypt=function(t,r,e){return this.$$encryptKey(!1,t,r,e)},t.prototype.decrypt=function(t,r){return this.$$decryptKey(!1,t,r)},t.prototype.encryptPrivate=function(t,r,e){return this.$$encryptKey(!0,t,r,e)},t.prototype.decryptPublic=function(t,r){return this.$$decryptKey(!0,t,r)},t.prototype.$$encryptKey=function(t,r,e,n){try{var i=this.keyPair.encrypt(this.$getDataForEncrypt(r,n),t);return"buffer"!=e&&e?i.toString(e):i}catch(t){throw console.log(t),Error("Error during encryption. Original error: "+t)}},t.prototype.$$decryptKey=function(t,r,e){try{r=it.isString(r)?w.from(r,"base64"):r;var n=this.keyPair.decrypt(r,t);if(null===n)throw Error("Key decrypt method returns null.");return this.$getDecryptedData(n,e)}catch(t){throw Error("Error during decryption (probably incorrect key). Original error: "+t)}},t.prototype.sign=function(t,r,e){if(!this.isPrivate())throw Error("This is not private key");var n=this.keyPair.sign(this.$getDataForEncrypt(t,e));return r&&"buffer"!=r&&(n=n.toString(r)),n},t.prototype.verify=function(t,r,e,n){if(!this.isPublic())throw Error("This is not public key");return n=n&&"buffer"!=n?n:null,this.keyPair.verify(this.$getDataForEncrypt(t,e),r,n)},t.prototype.getKeySize=function(){return this.keyPair.keySize},t.prototype.getMaxMessageSize=function(){return this.keyPair.maxMessageLength},t.prototype.$getDataForEncrypt=function(t,r){if(it.isString(t)||it.isNumber(t))return w.from(""+t,r||"utf8");if(tt(t))return t;if(it.isObject(t))return w.from(e(t));throw Error("Unexpected data type")},t.prototype.$getDecryptedData=function(t,r){return"buffer"==(r=r||"buffer")?t:"json"==r?JSON.parse(t.toString()):t.toString(r)},t}()});
//# sourceMappingURL=mini-rsa.common.js.map
