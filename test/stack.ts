import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';

const test = suite('Stack Manipulation');


test('stack', async () => {
    let output = '';
    const print = (msg) => output = msg;
    const filth = new Filth({print});

    await filth.eval('3 dup -');
    assert.equal( filth.popValue(), 0);
    
    await filth.eval('2 5 swap /');
    assert.equal( filth.popValue(), 2.5);
    
    await filth.eval('6 4 5 rot .s');
    assert.equal( output, '4 5 6');
    
    await filth.eval('4 0 drop 2 /');
    assert.equal( filth.popValue(), 2);

    await filth.eval('cls 1 2 3 nip .s');
    assert.equal( output, '1 3');

    await filth.eval('cls 1 2 3 4 tuck .s');
    assert.equal( output, '1 2 4 3 4');
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