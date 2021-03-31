import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';

const test = suite('Stack Manipulation');


test('stack', async () => {
    let output = '';
    const print = (msg) => output = msg;
    const filth = new Filth({print});

    await filth.eval(`"hello" size! .`);
    
    // console.log( filth.items );
    assert.equal( output, '5');
    
    
    await filth.eval(`'good' size! .`);
    assert.equal( output, '4');

});

test.run();