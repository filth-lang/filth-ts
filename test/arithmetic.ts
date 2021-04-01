import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';

const test = suite('Arithmetic');


test('addition', async () => {
    const filth = new Filth();

    await filth.eval('5 4 +');
    assert.equal( filth.popValue(), 9);
    
    await filth.eval('6 7 *');
    assert.equal( filth.popValue(), 42);
    
    await filth.eval('1360 23 -');
    assert.equal( filth.popValue(), 1337);
    
    await filth.eval('12 12 /');
    assert.equal( filth.popValue(), 1);
    
    await filth.eval('13 2 mod');
    assert.equal( filth.popValue(), 1);
    
    await filth.eval('99 negate');
    assert.equal( filth.popValue(), -99);
    
    await filth.eval('-99 abs');
    assert.equal( filth.popValue(), 99);
    
    await filth.eval('52 23 max');
    assert.equal( filth.popValue(), 52);

    await filth.eval('52 23 min');
    assert.equal( filth.popValue(), 23);
})



test('comparison', async () => {
    const filth = new Filth();

    await filth.eval('6 4 >');
    assert.equal( filth.popValue(), true);
});

test.run();