import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';


const test = suite('Loop');


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
