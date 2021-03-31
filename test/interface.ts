import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';

const test = suite('Interfacing');


test('nodejs', async () => {
    let output = '';
    const print = (msg) => output = msg;
    const filth = new Filth({print});

    // await filth.eval('"nodejs://process/cwd" cwd define');
    // await filth.eval('cwd');
    await filth.eval('"js://Math/min" jsmin define');
    await filth.eval('22 33 jsmin');

    assert.equal( filth.popValue(), 22);
    
});


test.run();