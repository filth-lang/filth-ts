import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';


const test = suite('References');


test('pops an earlier word', async () => {
    const f = new Filth();
    await f.eval(`planet world hello $1`);
    assert.equal(f.toString(), '"world" "hello" "planet"');
});

test('works within a list', async () => {
    const f = new Filth();
    await f.eval(`planet world [ hello $0 ]`);
    assert.equal(f.toString(), '["hello"] "world" "planet"');
});

test('pops above a list', async () => {
    const f = new Filth();
    await f.eval(`planet [ world [ hello ^^$0 ]]`);
    assert.equal(f.toString(), '["world", ["hello", "planet"]]');
});


test('not evaluated the first time', async () => {
    // spread evaluates the reference    
    const f = new Filth();
    await f.eval(`planet world [ hello ^$1 ] spread`);
    assert.equal(f.toString(), '"planet" "hello" "world"');
});


test('references words outside of array', async () => {
    const f = new Filth();
    await f.eval(`
            1977 1974
            [ 1900 ^$0 ^$0 2018 ]
            `);
    
    assert.equal(f.popValue(), [1900, 1974, 1977, 2018]);
})


test('peeks an earlier word', async () => {
    const f = new Filth();
    await f.eval(`planet world hello %1`);
    assert.equal(f.toString(), '"world" "hello" "world" "planet"');
})

test('out of range on peeking an earlier word', async () => {
    const f = new Filth();
    try {
        await f.eval(`planet world hello %5`);
    } catch( err ){
        assert.equal( err.message, 'stack underflow: ("hello" "world" "planet")');
    }
    // assert.equal(stack.toString(), '"hello" "world" "planet"');
})


test.run();
