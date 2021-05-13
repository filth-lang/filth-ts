import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';
import { StackError } from '../src/types';

const test = suite('Array');


test('create', async () => {
    const f = new Filth();

    await f.eval('[ hello, world ]');
    assert.equal(f.popValue(), ['hello', 'world']);
});

test('add', async () => {
    const f = new Filth();

    await f.eval('[ world ] hello +');
    assert.equal(f.popValue(), ['world', 'hello']);
});

test('prepend', async () => {
    const f = new Filth();

    await f.eval('hello [ world ] +');
    assert.equal(f.popValue(), ['hello', 'world']);
});

test('pop', async () => {
    const f = new Filth();

    await f.eval('[ hello world ] pop!');
    assert.equal(f.popValue(), 'world');
});

test('pop return', async () => {
    const f = new Filth();

    await f.eval('[ hello world ] pop');
    assert.equal(f.popValue(), 'world');
    assert.equal(f.popValue(), ['hello']);
});

test('pop empty', async () => {
    const f = new Filth();

    try {
        await f.eval('[ ] pop!');
    } catch (err) {
        assert.instance(err, StackError);
        assert.equal(err.message, 'stack underflow: (])');
    }

});



test('gather builds a list from similar items', async () => {
    const f = new Filth();
    
    await f.eval(`
    [hello] 10 12 14 gather
    `);

    // hello is not added to the result array
    assert.equal( f.toString(), `[ 10 12 14 ] [ hello ]`);
});

test('concat joins arrays', async () => {
    const f = new Filth();

    await f.eval(`
    [hello] [10 12] [14] concat
    `);

    // hello is not added to the result array
    assert.equal( f.toString(), `[ 10 12 14 ] [ hello ]`);

    await f.eval(`
    cls [ "hello world" ] [ today ] concat
    `);

    assert.equal( f.toString(), `[ "hello world" today ]` );
});

test('concat joins arrays and values', async () => {
    const f = new Filth();
    
    await f.eval(`
    hello [14] concat
    `);

    // hello is not added to the result array
    assert.equal( f.toString(), `[ hello 14 ]`);
});



test('indexOf', async () => {
    const f = new Filth();

    await f.eval(`
    [ hello world today ]
    world index_of
    `);

    assert.equal(f.popValue(), 1);

    await f.eval(`
    [ hello world today ]
    goodbye index_of
    `);

    assert.equal(f.popValue(), -1);
});


test('difference', async () => {
    const f = new Filth();
    await f.eval(`
            [ 1, 2, 3, 4, 5 ]
            [ 0, 3, 6, 9 ]
            diff!
            `);
    assert.equal(f.popValue(), [0,6,9] );
});

test('intersect', async () => {
    const f = new Filth();
    await f.eval(`
            [ 1, 2, 3, 4, 5 ]
            [ 2, 4, 6, 8 ]
            intersect!
            `);
    assert.equal(f.popValue(), [2,4] );
});

test('union', async () => {
    const f = new Filth();
    await f.eval(`
            [ 1, 2, 3 ]
            [ 2, 4, 5 ]
            union!
            `);
    assert.equal(f.popValue(), [1,2,3,4,5] );
});


test.run();