#!/usr/bin/env npx ts-node
'use strict';

const Readline = require('readline');
let { Filth } = require('../src');
const pkg = require('../package.json');

const log = (...args) => console.log(...args);
let filth = new Filth({ print: log });


const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', async (input) => {
    if (input === 'bye') {
        process.exit(0);
    }
    // log(`Received: ${input}`);

    try {
        await filth.eval(input);
        // rl.write('\tok\n');
    } catch (err) {
        log(err.message);
    }
});



function onSee(stack) {
    let val = stack.pop();

    let word = stack.getWord(val);

    log('(', 'examining', word, ')');
    return undefined;
}

// export async function onDup<QS extends Filth>(stack: QS, [,op]): AsyncInstResult {
//     let val = stack.peek( op === 'over' ? 1 : 0);
//     return [...val];
// }

filth.addWords([
    ['see', onSee],
]);

if (process.stdin.isTTY) {
    log('filth v' + pkg.version + '\n');
}

process.stdin.isRaw

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (chunk) {
    data += chunk;
});

process.stdin.on('end', function () {
    callback(data)
});

// connect stdin/stdout to the forth stream
// process.stdin.setEncoding('ascii');
// process.stdin.pipe(f.s).pipe(process.stdout);
