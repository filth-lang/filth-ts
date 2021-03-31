import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';

const test = suite('Stack Manipulation');


test('stack', async () => {
    let output = '';
    const print = (msg) => output = msg;
    const filth = new Filth({print});

    // duplicate the top item (1st now equals 2nd)
    await filth.eval('3 dup -');
    assert.equal( filth.popValue(), 0);
    
    // duplicate the top item (1st now equals 2nd)
    await filth.eval('3 %0 -');
    assert.equal( filth.popValue(), 0);
    
    await filth.eval('2 5 swap /');
    assert.equal( filth.popValue(), 2.5);
    
    // or...
    await filth.eval('2 5 $1 /');
    assert.equal( filth.popValue(), 2.5);
    
    await filth.eval('6 4 5 rot .s');
    assert.equal( output, '4 5 6');
    
    // or...
    await filth.eval('cls 6 4 5 $2 .s');
    assert.equal( output, '4 5 6');
    
    // remove the top item
    await filth.eval('4 0 drop 2 /');
    assert.equal( filth.popValue(), 2);
    
    await filth.eval('4 0 ~0 2 /');
    assert.equal( filth.popValue(), 2);

    // remove the second item
    await filth.eval('cls 1 2 3 ~1 .s');
    assert.equal( output, '1 3');

    // duplicate the second item to the top
    await filth.eval('cls 1 2 3 4 %1 .s');
    assert.equal( output, '1 2 3 4 3');
})

test('reference words', async () => {
    let output = '';
    const print = (msg) => output = msg;
    const filth = new Filth({print});

    // copy word at offset to top
    await filth.eval('cls 1 2 3 4 %1 .s');
    assert.equal( output, '1 2 3 4 3');

    await filth.eval('cls 1 2 3 4 %3 .s');
    assert.equal( output, '1 2 3 4 1');

    // move word at offset to top
    await filth.eval('cls 1 2 3 4 $1 .s');
    assert.equal( output, '1 2 4 3');

    await filth.eval('cls 1 2 3 4 $3 .s');
    assert.equal( output, '2 3 4 1');
});



test.run();