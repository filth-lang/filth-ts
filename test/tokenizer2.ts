import assert from 'uvu/assert';
import { suite } from 'uvu';
import { Filth } from '../src';
import { tokenizeString } from '../src/tokenizer';

const test = suite('Tokenizer2');


test('stack', async () => {

    // console.log(tokenizeString(`:hello world`));
    // console.log(tokenize2(`:hello world\n`));
    console.log(tokenize2(`{ :hello: :world}`));

});

test.run();



const MODE_IDLE = 0;
const MODE_VALUE = 1 << 0;
const MODE_MAP = 1 << 1;
const MODE_COMMENT = 1 << 2;

const set = (flag, val) => flag | val;
const isSet = (flag, val) => (flag & val) === val;
const unset = (flag, val) => flag & ~val;

// enum Mode { Idle, Value, Map, Comment };
// type Mode = MODE_IDLE | MODE_VALUE | MODE_MAP | MODE_COMMENT;

type Token = [string, number, number];

interface Context {
    buffer: string;
    pos: number;
    length: number;
    offset: number;
    line: number;
    linePos: number;
    markPos: number;
    markLine: number;
    output: Token[];
    lastChar: string;
    charCount: number;
    mode: number;
}

interface TokenizeOptions {
    returnValues?: boolean;
}

function createContext(): Context {
    return {
        buffer: '',
        pos: 0, length: 0, offset: 0,
        line: 0, linePos: 0,
        markPos: 0, markLine: 0,
        output: [],
        lastChar: null, charCount: 0,
        mode: MODE_IDLE,
    };
}


function tokenize2(input: string, options: TokenizeOptions = {}) {
    const returnValues = options.returnValues ?? false;
    let ctx = createContext();
    ctx.length = ctx.pos + input.length;

    ctx = process(ctx, input);

    return ctx;
    // return returnValues ? ctx.output.map(e => e[0]) : ctx.output;
}

[`{["'`, '}]"']

function process(ctx: Context, input: string): Context {
    let { pos, length,
        offset,
        markPos, markLine,
        buffer, output,
        mode,
        lastChar, charCount,
        line, linePos } = ctx;
    let cpos = 0;

    log('[process]', { pos, length });

    for (pos; pos < length; cpos++, pos++) {
        let char = input.charAt(cpos);
        const isNewline = char === '\n';
        const isWhiteSpace = char === ' ' || char === '\t';

        if (char === lastChar) {
            charCount++;
        } else {
            charCount = 0;
        }


        if ( isSet(mode, MODE_IDLE)) {
            if (!isWhiteSpace) {
                // log('[p]', 'start value');
                mode = set(mode, MODE_VALUE);
                markPos = pos;
                markLine = line;

                if (char === '{') {
                    mode = set(mode, MODE_MAP);
                    // output.push([char, pos, line]);
                    log('[p]', 'start map');
                }
            }
        }
        else {
            if (isSet(mode, MODE_MAP)) {
                if (char === '}') {
                    mode = unset(mode, MODE_MAP);
                    output.push([char, pos, line]);
                    log('[p]', 'end map');
                }
            }
            if (isSet(mode, MODE_VALUE)) {
                if (isWhiteSpace || isNewline) {
                    log('[p]', 'end value', buffer);
                    output.push([buffer, markPos, markLine]);
                    buffer = '';
                    mode = unset(mode, MODE_VALUE);
                }
            }
        }
        log('[p]', char, lastChar, {value:isSet(mode,MODE_VALUE), map:isSet(mode,MODE_MAP)} );

        lastChar = char;

        if (isNewline) {
            line++;
            linePos = 0;
        }

        if (isSet(mode, MODE_VALUE)) {
            // log('[p]', 'add', char, buffer);
            buffer = buffer + char;
        }
    }

    return {
        ...ctx, charCount,
        buffer,
        output,
        lastChar,
        markPos, markLine,
        pos, line, linePos, mode
    };
}


const log = (...args) => console.log(...args);