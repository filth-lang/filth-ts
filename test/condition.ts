import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';


const test = suite('Conditions');


test.only('if', async () => {
    const f = new Filth();

    await f.eval(`
    "even" 2 1 % 0 == if
    "odd" 2 1 % 0 != if`);

    assert.equal(f.popValue(), 'even');
});


test('iif evaluates a boolean condition with a word result', async () => {
    const f = new Filth();

    await f.eval(`
       [ 2 3 + ] ok define
        wet ok true iif`);

    assert.equal(f.popValue(), 5);
});


test('iif evaluates a boolean condition', async () => {
    const f = new Filth();

    await f.eval(`
    [ 2 3 ] 
    [ 10 2 ]
    [ intersect! pop! ] [ diff! pop! ] true iif`);

    assert.equal(f.popValue(), 10);
});


test('list values are pushed', async () => {
    const f = new Filth();

    await f.eval(`
    [ 19, 9 ] true if`);

    assert.equal(f.popValue(), 9);
    assert.equal(f.popValue(), 19);
});

test('can still produce a list', async () => {
    const f = new Filth();

    await f.eval(`[ [19, 9] ] true if`);

    assert.equal(f.popValue(), [19, 9]);
});


test('and', async () => {
    const f = new Filth();

    await f.eval(`
    ok true true and if
    ok 6 4 > 5 10 < and if
    nok  ok  true false or iif`);

    assert.equal( f.popValue(), 'ok' );
    assert.equal( f.popValue(), 'ok' );
    assert.equal( f.popValue(), 'ok' );
});


test.run();