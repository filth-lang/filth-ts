import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';


const test = suite('Loop');


test('simple loop', async () => {
    let output = [];
    const print = (msg) => output.push(msg);
    const f = new Filth({print});

    await f.eval(`
    [
        Hello! .
        // the $i variable keeps the current index 
        $i 4 <
    ] loop
    `)

    assert.equal( output.join(' '), 'Hello! Hello! Hello! Hello! Hello!' );
});

test('loops until done', async () => {
    let output = [];
    const print = (msg) => output.push(msg);
    const f = new Filth({print});

    await f.eval(`
    [
        $i .
    ] 12 0 do
    `);
    assert.equal( output.join(' '), '0 1 2 3 4 5 6 7 8 9 10 11 12' );
});

test('squares', async () => {
    let output = [];
    const print = (msg) => output.push(msg);
    const f = new Filth({print});

    await f.eval(`
    [ dup * ] square define

    [
        [ $i square . ] *$1 0 ?do
    ] squares define
    
    10 squares
    `);
    assert.equal( output.join(' '), '0 1 4 9 16 25 36 49 64 81' );
});



test('loops until done', async () => {
    const f = new Filth();

    await f.eval(`
        // the count is defined outside the loop as usual
        5 count let
        [
            // increment count by one
            // the '!' word is replacing the existing value
            $count 1 + count !
            
            // the loop continues while we return true (not just truthy)
            // the condition returns true if count < 10, otherwise
            // it returns the final count
            $count
            true 
            10 $count > 
            iif
        ] loop
    `);

    assert.equal(f.popValue(), 10);

});


test.run();
