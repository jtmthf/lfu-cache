import LFU from '../../src/lfu-cache';

describe('basic', () => {
  it('basic', () => {
    const cache = new LFU({max: 10});
    cache.set('key', 'value');
    expect(cache.get('key')).to.equal('value');
    expect(cache.get('nada')).to.equal(undefined);
    expect(cache.length).to.equal(1);
    expect(cache.max).to.equal(10);
  });

  it('least frequently set', () => {
    const cache = new LFU(2);
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.set('c', 'C');
    expect(cache.get('c')).to.equal('C');
    expect(cache.get('b')).to.equal(undefined);
    expect(cache.get('a')).to.equal('A');
  });

  it('lfu frequently gotten', () => {
    const cache = new LFU(2);
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.get('b');
    cache.set('c', 'C');
    expect(cache.get('a')).to.equal(undefined);
    expect(cache.get('b')).to.equal('B');
    expect(cache.get('c')).to.equal('C');
  });

  it('del', () => {
    const cache = new LFU(2);
    cache.set('a', 'A');
    cache.del('a');
    expect(cache.get('a'), undefined);
  });

  it('max', () => {
    const cache = new LFU(3);

    // test changing the max, verify that the LFU items get dropped.
    cache.max = 100;
    for (let i = 0; i < 100; i++) {
      cache.set(i, i);
    }
    for (let i = 0; i < 100; i++) {
      expect(cache.get(i)).to.equal(i);
    }
    cache.max = 3;
    expect(cache.max).to.equal(3);
    for (let i = 3; i < 100; i++) {
      expect(cache.get(i)).to.equal(undefined);
    }
    for (let i = 0; i < 3; i++) {
      expect(cache.get(i)).to.equal(i);
    }
  });

  it('reset', () => {
    const cache = new LFU(10);
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.reset();
    expect(cache.length).to.equal(0);
    expect(cache.max).to.equal(10);
    expect(cache.get('a')).to.equal(undefined);
    expect(cache.get('b')).to.equal(undefined);
  });

  it('basic with weighed length', () => {
    const cache = new LFU({
      max: 100,
      length: (item, key) => {
        expect(key).to.be.a('string');
        return item.size;
      }
    });
    cache.set('key', { val: 'value', size: 50 });
    expect(cache.get('key').val).to.equal('value');
    expect(cache.get('nada')).to.equal(undefined);
    expect(cache.lengthCalc(cache.get('key'), 'key')).to.equal(50);
    expect(cache.length).to.equal(50);
    expect(cache.max).to.equal(100);
  });

  it('weighed length item too large', () => {
    const cache = new LFU({
      max: 10,
      length: item => item.size
    });
    expect(cache.max).to.equal(10);

    // should fall out immediately
    cache.set('key', { val: 'value', size: 50 });

    expect(cache.length).to.equal(0);
    expect(cache.get('key')).to.equal(undefined);
  });

  it('least frequently set with weighed length', () => {
    const cache = new LFU({
      max: 8,
      length: item => item.length
    });
    cache.set('a', 'A');
    cache.set('b', 'BB');
    cache.set('c', 'CCC');
    cache.set('d', 'DDDD');
    expect(cache.get('d')).to.equal('DDDD');
    expect(cache.get('c')).to.equal(undefined);
    expect(cache.get('b')).to.equal('BB');
    expect(cache.get('a')).to.equal('A');
  });

  it('least frequently gotten with weighed length', () => {
    const cache = new LFU({
      max: 8,
      length: item => item.length
    });
    cache.set('a', 'A');
    cache.set('b', 'BB');
    cache.set('c', 'CCC');
    cache.get('a');
    cache.get('b');
    cache.set('d', 'DDDD');
    expect(cache.get('c')).to.equal(undefined);
    expect(cache.get('d')).to.equal('DDDD');
    expect(cache.get('b')).to.equal('BB');
    expect(cache.get('a')).to.equal('A');
  });

  it('lfu frequently updated with weighed length', () => {
    const cache = new LFU({
      max: 8,
      length: item => item.length
    });
    cache.set('a', 'A');
    cache.set('b', 'BB');
    cache.set('c', 'CCC');
    expect(cache.length).to.equal(6);
    cache.set('a', '+A');
    expect(cache.length).to.equal(7);
    cache.set('b', '++BB');
    expect(cache.length).to.equal(6);
    expect(cache.get('c')).to.equal(undefined);

    cache.set('c', 'oversized');
    expect(cache.length).to.equal(6);
    expect(cache.get('c')).to.equal(undefined);

    cache.set('a', 'oversized');
    expect(cache.length).to.equal(4);
    expect(cache.get('a')).to.equal(undefined);
    expect(cache.get('b')).to.equal('++BB');
  });

  it('returns proper booleans', () => {
    const cache = new LFU({
      max: 5,
      length: item => item.length
    });

    expect(cache.set('a', 'A')).to.equal(true);

    // should return false for max exceeded
    expect(cache.set('b', 'donuts')).to.equal(false);

    expect(cache.set('b', 'B')).to.equal(true);
    expect(cache.set('c', 'CCCC')).to.equal(true);
  });

  it('drops the old items', done => {
    const cache = new LFU({
      max: 5,
      maxAge: 50
    });

    cache.set('a', 'A');

    setTimeout(() => {
      cache.set('b', 'b');
      expect(cache.get('a')).to.equal('A');
    }, 25);

    setTimeout(() => {
      cache.set('c', 'C');
      // timed out
      expect(cache.get('a')).to.not.be.ok;
    }, 60 + 25);

    setTimeout(() => {
      expect(cache.get('b')).to.not.be.ok;
      expect(cache.get('c')).to.equal('C');
    }, 90);

    setTimeout(() => {
      expect(cache.get('c')).to.not.be.ok;
      done();
    }, 155);
  });

  it('manually prunes', done => {
    const cache = new LFU({
      max: 5,
      maxAge: 50
    });

    cache.set('a', 'A');
    cache.set('b', 'b');
    cache.set('c', 'C');

    setTimeout(() => {
      cache.prune();

      expect(cache.get('a')).to.not.be.ok;
      expect(cache.get('a')).to.not.be.ok;
      expect(cache.get('a')).to.not.be.ok;

      done();
    }, 100);
  });

  it('individual item can have its own maxAge', done => {
    const cache = new LFU({
      max: 5,
      maxAge: 50
    });

    cache.set('a', 'A', 20)
    setTimeout(() => {
      expect(cache.get('a')).to.not.be.ok;
      done();
    }, 25);
  });

  it('individual item can have its own maxAge > cache', done => {
    const cache = new LFU({
      max: 5,
      maxAge: 20
    });

    cache.set('a', 'A', 50);
    setTimeout(() => {
      expect(cache.get('a')).to.equal('A');
      done();
    }, 25);
  });

  it('disposal function', () => {
    let disposed = false;
    const cache = new LFU({
      max: 1,
      dispose: (k, n) => disposed = n
    });

    cache.set(1, 1);
    cache.set(2, 2);
    expect(disposed).to.equal(1);
    cache.set(2, 10);
    expect(disposed).to.equal(2);
    cache.set(3, 3);
    expect(disposed).to.equal(10);
    cache.reset();
    expect(disposed).to.equal(3);
  });

  it('disposes on too big of item', () => {
    let disposed = false;
    const cache = new LFU({
      max: 1,
      length: k => k.length,
      dispose: (k, n) => disposed = n
    });

    const obj = [1,2];
    expect(disposed).to.be.false;
    cache.set('obj', obj);
    expect(disposed).to.deep.equal(obj);
  });

  it('has()', done => {
    const cache = new LFU({
      max: 1,
      maxAge: 10
    });

    cache.set('foo', 'bar');
    expect(cache.has('foo')).to.be.true;
    cache.set('blu', 'baz');
    expect(cache.has('foo')).to.be.false;
    expect(cache.has('blu')).to.be.true;
    setTimeout(() => {
      expect(cache.has('blu')).to.be.false;
      done();
    }, 15);
  });

  it('stale', done => {
    const cache = new LFU({
      maxAge: 10,
      stale: true
    });

    expect(cache.allowStale).to.be.true;

    cache.set('foo', 'bar');
    expect(cache.get('foo')).to.equal('bar');
    expect(cache.has('foo')).to.be.true;
    setTimeout(() => {
      expect(cache.has('foo')).to.be.false;
      expect(cache.get('foo')).to.equal('bar');
      expect(cache.get('foo')).to.equal(undefined);
      done();
    }, 15);
  });
});
