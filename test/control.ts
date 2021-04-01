import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';


const test = suite('Control');


test('stops stack execution', async () => {
    const f = new Filth();

    await f.eval(`1 2 3 @! 4`);

    assert.equal(f.popValue(), 3);
});

test('stops and restarts stack execution', async () => {
    const f = new Filth();

    await f.eval(`1 2 3 @! 4 5 @> 6 7`);

    assert.equal( f.toString(), '7 6 3 2 1');
});

test('stops and restarts stack execution 2', async () => {
    const f = new Filth();

    await f.eval(`
        1 2 3 
        [ @! ] 1 1 == if
        4 5 
        @> [ @! ] 1 2 == if
        6 7
    `);

    assert.equal( f.toString(), '7 6 3 2 1');
});



test('stops execution from if', async () => {
    const f = new Filth();

    await f.eval(`
    []
    [ ok @! ] swap size! 0 == if
    failed
    `);
    assert.equal(f.toString(), 'ok');
});

test('stops list execution', async () => {
    const f = new Filth();

    await f.eval(`[1 2 3 @! 4 @>] spread 5`);
    assert.equal(f.toString(), '5 3 2 1');
});

test('stops defined list execution', async () => {
    const f = new Filth();

    await f.eval(`
    [1 2 3 @! 4 ] theList define 
    [
        [ theList @! ] true if

        // the break within theList stops the break in the if
        // statement, therefore execution continue and 'no' is
        // added to the stack
        no
        @>
    ] answer define
    answer
    done
    `);
    
    assert.equal(f.toString(), 'done 3 2 1');
});


test('stops loop execution', async () => {
    const f = new Filth();

    await f.eval(`
    // increment up to 15
    10
    [
        1 +
        dup [ @! ] swap 15 >= if
        true
    ] loop
    
    // the loop will automatically continue after any break
    100 +
    `);
    assert.equal( f.popValue(), 115 );
});



test('break function', async () => {
    const f = new Filth();

    await f.eval(`
    // only returns false if the value is not even
    [
        [ true @! ] swap 2 % 0 == if
        false
        @>
    ] isNotEven define

    6 isNotEven
    5 isNotEven
    3 isNotEven
    2 isNotEven
    `);

    assert.equal( f.toString(), 'true false false true' );
})


test('defined break', async () => {
    const f = new Filth();

    await f.eval(`
    [
        [ true @! ] swap 2 % 0 == if
        false
        @>
    ] isEven define

    6 isEven
    5 isEven
    4 isEven
    `);

    assert.equal( f.toString(), 'true false true' );
});

test('inner function break', async () => {
    const f = new Filth();

    await f.eval(`
    [
        size 0 == [ drop nothing @! ] swap if
    ] returnUndefinedIfEmpty define

    [
        // returns as inactive - we want this to continue until the word is done
        returnUndefinedIfEmpty
        pop!
        
        // this word causes the stack to be active again
        @>
    ] checkIt define

    [] checkIt
    [ "hello" ] checkIt
    `);

    // console.log( f.items );
    assert.equal( f.toString(), 'hello nothing' );
})

test.run();