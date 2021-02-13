import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';

const test = suite('Defining words');


test('define', async () => {
    let output = '';
    const print = (msg) => output = msg;
    const filth = new Filth({print});

    await filth.eval('[ dup * ] square define');
    await filth.eval('5 square')
    assert.equal( filth.popValue(), 25);
    
});


test.run();