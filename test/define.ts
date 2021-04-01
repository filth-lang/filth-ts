import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';

const test = suite('Defining words');


test('define', async () => {
    let output = '';
    const print = (msg) => output = msg;
    const f = new Filth({print});

    await f.eval('[ dup * ] square define');
    await f.eval('5 square')
    assert.equal( f.popValue(), 25);

    await f.eval( '*square see' );
    assert.equal( output, '[ dup * ]');
});


test('accesses defined words', async () => {
    const f = new Filth();
    await f.eval(`
            active status let
            [ status is $status ] eval
            `);
    assert.equal(f.toString(), '[ status is active ]');
});


test('a defined word evaluates', async () => {
    const f = new Filth();
    await f.eval(`[ 2 3 + ] fn define fn`);
    // the fn word is evaled as it is pushed onto the stack
    assert.equal(f.popValue(), 5);
});

test('a let word pushes', async () => {
    const f = new Filth();
    await f.eval(`[ 2 3 + ] fn let $fn`);
    assert.equal(f.popValue(), [2, 3, '+']);
});

test('fetch word', async () => {
    const f = new Filth();

    await f.eval(`
        21 age !
        age @
    `);

    assert.equal( f.popValue(), 21 );
});


test('evals map', async () => {
    const f = new Filth();
    await f.eval(`
            active status let
            { status: $status }
            `);
    assert.equal(f.toString(), '{ status: active }');
});


test('define js', async () => {
    const f = new Filth();
    await f.eval(`
            "js://Math/min" jsmin define
            22 33 jsmin
        `);

    let result = f.popValue();
    assert.equal(result, 22);
    
});

test('define nodejs', async () => {
    const f = new Filth();
    await f.eval(`
            "nodejs://path/normalize" normalize define
            "/foo/bar//baz/asdf/quux/.." normalize
        `);

    let result = f.popValue();
    assert.equal(result, '/foo/bar/baz/asdf');
});

test.run();