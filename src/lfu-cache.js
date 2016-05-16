
function insertionSort(cache) {
  const len = cache.length;
  let j;
  for (let i = 0; i < len; i++) {
    const tmp = cache[i];
    for (j = i - 1; j >= 0 && (cache[j].hits < tmp.hits); j--) {
      cache[j + 1] = cache[j]; // eslint-disable-line no-param-reassign
    }
    cache[j + 1] = tmp; // eslint-disable-line no-param-reassign
  }
  return cache;
}

export default class LFUCache {
  constructor(options = {}) {
    if (typeof options === 'number') {
      options = { max: options }; // eslint-disable-line no-param-reassign
    }
    const {
      max = Infinity,
      maxAge = 0,
      length = () => 1,
      dispose = () => {},
      stale = false
    } = options;

    this._max = max; // eslint-disable-line no-underscore-dangle
    this.maxAge = maxAge;
    this.lengthCalc = length;
    this.dispose = dispose;
    this.allowStale = stale;
    this.cache = [];
  }

  set max(max) {
    this._max = max; // eslint-disable-line no-underscore-dangle
    this.trim();
  }

  get max() {
    return this._max; // eslint-disable-line no-underscore-dangle
  }

  set(key, value, maxAge = this.maxAge) {
    const now = maxAge ? Date.now() : 0;
    const length = this.lengthCalc(value, key);

    if (this.has(key)) {
      if (length > this.max) {
        this.del(key);
        return false;
      }

      const entry = this.cache.find(item => item.key === key);
      this.trim(length, entry);
      this.dispose(key, entry.value);
      entry.now = now;
      entry.maxAge = maxAge;
      entry.value = value;
      entry.length = length;
      return true;
    }
    const entry = {
      key,
      value,
      length,
      now,
      maxAge,
      hits: 0
    };

    if (entry.length > this.max) {
      this.dispose(key, value);
      return false;
    }
    this.trim(length);
    this.cache.push(entry);
    return true;
  }

  get(key, doUse = true) {
    const entry = this.cache.find(item => item.key === key);
    let hit;
    if (entry) {
      hit = entry.value;
      if (this.isStale(entry)) {
        this.del(entry.key);
        if (!this.allowStale) {
          hit = undefined;
        }
      } else {
        if (doUse) {
          entry.hits++;
          insertionSort(this.cache);
        }
      }
    }
    return hit;
  }

  peek(key) {
    this.get(key, false);
  }

  del(key) {
    this.cache = this.cache.filter(entry => {
      if (entry.key === key) {
        this.dispose(key, entry.value);
        return false;
      }
      return true;
    });
  }

  reset() {
    this.cache.forEach(entry => this.dispose(entry.key, entry.value));
    this.cache = [];
  }

  has(key) {
    const entry = this.cache.find(item => item.key === key);
    if (!entry) {
      return false;
    }
    if (this.isStale(entry)) {
      return false;
    }
    return true;
  }

  forEach(fn, thisp = this) {
    this.cache.forEach(entry => this.forEachStep(fn, entry, thisp));
  }

  rforEach(fn, thisp = this) {
    for (let i = this.cache.length - 1; i >= 0; i++) {
      this.forEachStep(fn, this.cache[i], thisp);
    }
  }

  forEachStep(fn, entry, thisp) {
    let hit = entry.value;
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

  keys() {
    return this.cache.map(item => item.key);
  }

  values() {
    return this.cache.map(item => item.value);
  }

  get length() {
    return this.cache.reduce((sum, item) =>
      sum + item.length
    , 0);
  }

  get itemCount() {
    return this.cache.length;
  }

  dump() {
    return this.cache.map(hit => {
      if (!this.isStale(hit)) {
        return {
          k: hit.key,
          v: hit.value.value,
          e: hit.now + (hit.maxAge || 0)
        };
      }
      return undefined;
    }).filter(h => h);
  }

  dumpLfu() {
    return this.cache;
  }

  load(cacheArray) {
    // reset the cache
    this.reset();

    const now = Date.now();
    cacheArray.forEach(entry => {
      const expiresAt = entry.e || 0;
      if (expiresAt === 0) {
        // the item was created without expiration in a non aged cache
        this.set(entry.k, entry.v);
      } else {
        const maxAge = expiresAt - now;
        // dont add already expired items
        if (maxAge > 0) {
          this.set(entry.k, entry.v, maxAge);
        }
      }
    });
  }

  prune() {
    this.cache.forEach(entry => this.get(entry.key, false));
  }

  isStale(hit) {
    if (!hit || (!hit.maxAge && !this.maxAge)) {
      return false;
    }
    let stale = false;
    const diff = Date.now() - hit.now;
    if (hit.maxAge) {
      stale = diff > hit.maxAge;
    } else {
      stale = this.maxAge && (diff > this.maxAge);
    }
    return stale;
  }

  trim(length = 0, prev = { length: 0, key: NaN }) {
    let capture = undefined;
    while (this.length + length - prev.length > this.max) {
      const temp = this.cache.pop();
      if (temp.key === prev.key) {
        capture = temp;
      } else {
        this.dispose(temp.key, temp.value);
      }
    }
    if (capture) {
      this.cache.push(capture);
    }
  }
}
