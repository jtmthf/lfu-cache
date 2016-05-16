(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["lfuCache"] = factory();
	else
		root["lfuCache"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function insertionSort(cache) {
	  var len = cache.length;
	  var j = void 0;
	  for (var i = 0; i < len; i++) {
	    var tmp = cache[i];
	    for (j = i - 1; j >= 0 && cache[j].hits > tmp.hits; j--) {
	      cache[j + 1] = cache[j]; // eslint-disable-line no-param-reassign
	    }
	    cache[j + 1] = tmp; // eslint-disable-line no-param-reassign
	  }
	  return cache;
	}
	
	var LFUCache = function () {
	  function LFUCache() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	    _classCallCheck(this, LFUCache);
	
	    if (typeof options === 'number') {
	      options = { max: options }; // eslint-disable-line no-param-reassign
	    }
	    var _options = options;
	    var _options$max = _options.max;
	    var max = _options$max === undefined ? Infinity : _options$max;
	    var _options$maxAge = _options.maxAge;
	    var maxAge = _options$maxAge === undefined ? 0 : _options$maxAge;
	    var _options$length = _options.length;
	    var length = _options$length === undefined ? function () {
	      return 1;
	    } : _options$length;
	    var _options$dispose = _options.dispose;
	    var dispose = _options$dispose === undefined ? function () {} : _options$dispose;
	    var _options$stale = _options.stale;
	    var stale = _options$stale === undefined ? false : _options$stale;
	
	
	    this.max = max;
	    this.maxAge = maxAge;
	    this.lengthCalc = length;
	    this.dispose = dispose;
	    this.stale = stale;
	    this.cache = [];
	  }
	
	  _createClass(LFUCache, [{
	    key: 'set',
	    value: function set(key, value) {
	      var maxAge = arguments.length <= 2 || arguments[2] === undefined ? this.maxAge : arguments[2];
	
	      var now = maxAge ? Date.now() : 0;
	      var length = this.lengthCalc(value, key);
	
	      if (this.has(key)) {
	        if (length > this.max) {
	          this.del(key);
	          return false;
	        }
	
	        var _entry = this.cache.get(key);
	        this.dispose(key, _entry.value);
	
	        _entry.now = now;
	        _entry.maxAge = maxAge;
	        _entry.value = value;
	        _entry.length = length;
	        this.trim(length, _entry);
	      }
	      var entry = {
	        key: key,
	        value: value,
	        length: length,
	        now: now,
	        maxAge: maxAge,
	        hits: 0
	      };
	
	      if (entry.length > this.max) {
	        this.dispose(key, value);
	      }
	      this.cache.push(entry);
	      this.trim(length);
	      return true;
	    }
	  }, {
	    key: 'get',
	    value: function get(key) {
	      var doUse = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
	
	      var entry = this.cache.find(function (item) {
	        return item.key === key;
	      });
	      var hit = void 0;
	      if (entry) {
	        hit = entry.value;
	        if (this.isStale(hit)) {
	          this.del(entry.key);
	          if (!this.stale) {
	            hit = undefined;
	          } else {
	            if (doUse) {
	              entry.hits++;
	              insertionSort(this.cache);
	            }
	          }
	        }
	      }
	      return hit;
	    }
	  }, {
	    key: 'peek',
	    value: function peek(key) {
	      this.get(key, false);
	    }
	  }, {
	    key: 'del',
	    value: function del(key) {
	      var _this = this;
	
	      this.cache = this.cache.filter(function (entry) {
	        if (entry.key === key) {
	          _this.dispose(key, entry.value);
	          return false;
	        }
	        return true;
	      });
	    }
	  }, {
	    key: 'reset',
	    value: function reset() {
	      var _this2 = this;
	
	      this.cache.forEach(function (entry) {
	        return _this2.dispose(entry.key, entry.value);
	      });
	      this.cache = [];
	    }
	  }, {
	    key: 'has',
	    value: function has(key) {
	      return this.peek(key) ? true : false; // eslint-disable-line no-unneeded-ternary
	    }
	  }, {
	    key: 'forEach',
	    value: function forEach(fn) {
	      var _this3 = this;
	
	      var thisp = arguments.length <= 1 || arguments[1] === undefined ? this : arguments[1];
	
	      this.cache.forEach(function (entry) {
	        return _this3.forEachStep(fn, entry, thisp);
	      });
	    }
	  }, {
	    key: 'rforEach',
	    value: function rforEach(fn) {
	      var thisp = arguments.length <= 1 || arguments[1] === undefined ? this : arguments[1];
	
	      for (var i = this.cache.length - 1; i >= 0; i++) {
	        this.forEachStep(fn, this.cache[i], thisp);
	      }
	    }
	  }, {
	    key: 'forEachStep',
	    value: function forEachStep(fn, entry, thisp) {
	      var hit = entry.value;
	      if (this.isStale(entry)) {
	        this.del(entry.key);
	        if (!this.stale) {
	          hit = undefined;
	        }
	      }
	      if (hit) {
	        fn.call(thisp, hit, entry.key, this);
	      }
	    }
	  }, {
	    key: 'keys',
	    value: function keys() {
	      return this.cache.map(function (item) {
	        return item.key;
	      });
	    }
	  }, {
	    key: 'values',
	    value: function values() {
	      return this.cache.map(function (item) {
	        return item.value;
	      });
	    }
	  }, {
	    key: 'dump',
	    value: function dump() {
	      var _this4 = this;
	
	      return this.cache.map(function (hit) {
	        if (!_this4.isStale(hit)) {
	          return {
	            k: hit.key,
	            v: hit.value.value,
	            e: hit.now + (hit.maxAge || 0)
	          };
	        }
	        return undefined;
	      }).filter(function (h) {
	        return h;
	      });
	    }
	  }, {
	    key: 'dumpLfu',
	    value: function dumpLfu() {
	      return this.cache;
	    }
	  }, {
	    key: 'load',
	    value: function load(cacheArray) {
	      var _this5 = this;
	
	      // reset the cache
	      this.reset();
	
	      var now = Date.now();
	      cacheArray.forEach(function (entry) {
	        var expiresAt = entry.e || 0;
	        if (expiresAt === 0) {
	          // the item was created without expiration in a non aged cache
	          _this5.set(entry.k, entry.v);
	        } else {
	          var maxAge = expiresAt - now;
	          // dont add already expired items
	          if (maxAge > 0) {
	            _this5.set(entry.k, entry.v, maxAge);
	          }
	        }
	      });
	    }
	  }, {
	    key: 'prune',
	    value: function prune() {}
	  }, {
	    key: 'isStale',
	    value: function isStale(hit) {
	      if (!hit || !hit.maxAge && !this.maxAge) {
	        return false;
	      }
	      var stale = false;
	      var diff = Date.now() - hit.now;
	      if (hit.maxAge) {
	        stale = diff > hit.maxAge;
	      } else {
	        stale = this.maxAge && diff > this.maxAge;
	      }
	      return stale;
	    }
	  }, {
	    key: 'trim',
	    value: function trim(length) {
	      var prev = arguments.length <= 1 || arguments[1] === undefined ? { length: 0, key: NaN } : arguments[1];
	
	      var capture = void 0;
	      while (this.length + length - prev.length > this.max) {
	        var temp = this.cache.pop();
	        if (temp.key === prev.key) {
	          capture = temp;
	        } else {
	          this.del(temp.key);
	        }
	      }
	      if (capture) {
	        this.cache.push(capture);
	      }
	    }
	  }, {
	    key: 'length',
	    get: function get() {
	      return this.cache.reduce(function (sum, item) {
	        return item.length;
	      }, 0);
	    }
	  }, {
	    key: 'itemCount',
	    get: function get() {
	      return this.cache.length;
	    }
	  }]);
	
	  return LFUCache;
	}();
	
	exports.default = LFUCache;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=lfu-cache.js.map