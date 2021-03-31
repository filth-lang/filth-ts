import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';


const test = suite('Map/Reduce');


test('maps values', async () => {
    const f = new Filth();

    await f.eval(`[1 2 3 4] [10 *] map`);

    assert.equal(f.popValue(), [10, 20, 30, 40]);
})

test('maps values with a word', async () => {
    const f = new Filth();

    await f.eval(`
        [ 10 * ] mulByTen define
        [1 2 3 4] *mulByTen map
    `);

    let result = f.popValue();
    assert.equal(result, [10, 20, 30, 40]);
})

test('reduces values', async () => {
    const f = new Filth();

    await f.eval(`[1 2 3 4] 0 [+] reduce`);
    let result = f.popValue();
    assert.equal(result, 10);
});

test('filters values', async () => {
    // applies an is-even filter
    const f = new Filth();

    await f.eval(`[1 2 3 4] [ 2 % 0 == ] filter`);
    let result = f.popValue();
    assert.equal(result, [2, 4]);
});


test('reverse array', async () => {
    const f = new Filth();

    await f.eval(`
        [ 1 2 3 4 ] [] [ + ] reduce
    `);

    assert.equal( f.popValue(), [4,3,2,1] );
});


test.run();
