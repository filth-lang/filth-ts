import { parseJSON } from "@odgn/utils";

const MODE_IDLE = 0;
const MODE_COMMENT = 1<<0;
const MODE_MULTI_COMMENT = 1<<1;
const MODE_MULTI_QUOTE = 1<<2;
const MODE_QUOTE = 1<<3;
const MODE_MAYBE_QUOTE = 1<<4;
const MODE_VALUE = 1<<5;
// const MODE_MAYBE_VALUE = 1<<6;

function set(flag,val){
    return flag | val;
}
function isSet(flag,val){
    return (flag & val) === val;
}
function unset(flag,val){
    return flag & ~val;
}

interface Context {
    buffer: string;
    offset: number;
    pos: number;
    length: number;
    output: any[];
    line: number;
    // position: number;
    markPosition: number;
    linePosition: number;
    charBuffer: string[];
    mode: number;
    endChar: string;
    // withinQuote: boolean;
    // maybeWithinQuote: boolean;
    // withinMultiQuote: boolean;
    // withinComment: boolean;
    // withinMultiComment: boolean;
}


export interface ParseOptions {
    returnValues?: boolean;
}

/**
 * 
 * @param data 
 * @param options 
 */
export function parseString(data:string, options:ParseOptions = {}) {
    const returnValues = options.returnValues ?? false;
    let context = createContext();

    if( !data.endsWith('\n') ){
        data = data + '\n';
    }

    context = parse(context, data);

    return returnValues ? context.output.map( e => e[0] ) : context.output;
}

/**
 * Entry point for parsing a new string
 */
export function parse(context:Context, input:string):Context {
    context = context || createContext();
    context.length = context.pos + input.length;

    while (context.pos < context.length ) {
        context = process(context, input);
    }

    return context;
}

function process(context:Context, input:string):Context {
    let { pos, length, offset, mode,
        markPosition,
        output, 
        endChar,
        buffer, charBuffer, line, linePosition = 0 } = context;
    
    let cpos = 0;
    for (pos; pos < length; cpos++, pos++) {
        let char = input.charAt(cpos);
        linePosition++;

        // console.log('>', pos, length, char, markPosition, linePosition, modeToString(mode), JSON.stringify(buffer) );

        charBuffer[2] = charBuffer[1];
        charBuffer[1] = charBuffer[0];
        charBuffer[0] = char;

        const isNewline = char === '\n';
        

        if ( isSet(mode,MODE_MAYBE_QUOTE)) {
            // console.log('maybequote', charBuffer );
            let clear = false;
            if( char === '*' || char === '/' || char === "'" ){
                if (char === '*' && charBuffer[1] === '/') {
                    mode = set(mode,MODE_MULTI_COMMENT);
                    clear = true;
                }
                else if (char === '/' && charBuffer[1] === '/') {
                    mode = set(mode, MODE_COMMENT);
                    clear = true;
                }
                else if (char === "'" && charBuffer[1] === "'" && charBuffer[2] === "'") {
                    mode = set(mode,MODE_MULTI_QUOTE);
                    offset = linePosition;
                    // Log('process', 'multiquote offset', offset);
                    clear = true;
                }
            }
            else {
                // console.log('start val', char, pos);
                mode = set(mode,MODE_VALUE);
                mode = unset(mode, MODE_MAYBE_QUOTE );
                offset = linePosition;
            }

            if (clear) {
                mode = unset(mode, MODE_MAYBE_QUOTE );
                // mode = MODE_IDLE;
                // maybeWithinQuote = false;
                buffer = '';
                continue;
            }

            if( isNewline || char === ' ' ){
                // console.log('endof', markPosition, buffer );
                output.push([
                    parseValue(buffer.trimEnd()),
                    markPosition,
                    line
                ]);
                mode = unset(mode, MODE_MULTI_QUOTE | MODE_VALUE);
                // maybeWithinQuote = false;
                buffer = '';
            }
            else {
                switch (char) {
                    // unquoted strings contain everything up to the next line!
                    case '{':
                    case '}':
                    case '[':
                    case ']':
                    case ':':
                    case ',':
                    // case '\n':
                        // console.log('but what', char, buffer, mode);
                        output.push([
                            parseValue(buffer.trimEnd()),
                            markPosition,
                            line
                        ]);
                        mode = unset(mode, MODE_MULTI_QUOTE | MODE_VALUE);
                        // maybeWithinQuote = false;
                        buffer = '';

                        if ( char !== ',') {
                            output.push([char,pos,line]);
                        }
                        break;
                }
            }
        } else if (mode === MODE_MULTI_QUOTE) {
            // check for end quote
            if (char == "'" && charBuffer[1] == "'" && charBuffer[2] == "'") {
                // mode = MODE_IDLE;
                mode = unset(mode, MODE_MULTI_QUOTE);

                output.push([
                    trimMultiQuote(buffer, offset),
                    markPosition,
                    line
                ]);
                buffer = '';
            }
        } else if( isSet(mode, MODE_VALUE) ){
            if( char === ' ' || isNewline || char === ',' || char === ':' || char === ']' || char === '}' ){
                // console.log('end value', mode, pos, char);
                // mode = set(mode, MODE_MAYBE_VALUE);
                let value = parseValue(buffer.trimEnd());
                output.push([value,markPosition,line]);
                mode = unset(mode, MODE_VALUE);
                // console.log('end val', char, value, pos);
                if( char === ']' || char === '}' ){
                    // output.push([ char,markPosition,line]);
                    // buffer = '';
                    cpos -=1;
                    pos -=1;
                    linePosition -=1;
                }
                buffer = '';
            }
        
        } else if ( isSet(mode, MODE_QUOTE) ) {
            // console.log('mode quote', pos, char, isNewline);
            if ( endChar.indexOf(char) !== -1 ) {
                output.push([buffer,markPosition,line]);
                mode = unset(mode, MODE_QUOTE);
                buffer = '';
            }
        } else if ( isSet(mode, MODE_MULTI_COMMENT) ) {
            if (char == '/' && charBuffer[1] == '*') {
                // withinMultiComment = false;
                mode = unset(mode, MODE_MULTI_COMMENT);
            }
        } else if ( isSet(mode, MODE_COMMENT)) {
            if ( isNewline ) {
                mode = unset(mode, MODE_COMMENT);
                // withinComment = false;
            }
        } else {
            // console.log('hmm', mode, char);
            switch (char) {
                case '{':
                case '}':
                case '[':
                case ']':
                    output.push([char,pos,line]);
                case ':':
                case ',':
                    break;
                case ' ':
                case '\n':
                    break;
                case '#':
                    mode = set(mode,MODE_COMMENT);
                    // withinComment = true;
                    break;
                case '"':
                    mode = set(mode,MODE_QUOTE);
                    // withinQuote = true;
                    markPosition = pos;
                    char = '';
                    endChar = '"';
                    break;
                case '~':
                    mode = set(mode,MODE_QUOTE);
                    markPosition = pos;
                    char = '~';
                    endChar = ' \n';
                    break;
                default:
                    mode = set(mode, MODE_MAYBE_QUOTE);
                    markPosition = pos;
                    break;
            }
        }

        if (isNewline) {
            line++;
            linePosition = 0;
        }

        if (
            isSet(mode, MODE_QUOTE) 
            || isSet(mode, MODE_VALUE) 
            // || isSet(mode, MODE_MAYBE_VALUE) 
            || isSet(mode, MODE_MAYBE_QUOTE) 
            || isSet(mode, MODE_MULTI_QUOTE)
        ) {
            buffer = buffer + char;
        }

        // Log(
        //     'readAhead',
        //     context.position + pos,
        //     linePosition,
        //     char == '\n' ? '\\n' : char,
        //     char.charCodeAt(0),
        //     '-*',
        //     charBuffer,
        //     context.markPosition,
        //     modeToString(context),
        //     buffer
        // );
    }


    return {...context, 
        pos, buffer, endChar,
        offset, markPosition, mode, charBuffer, 
        output, line, linePosition };
}


function trimMultiQuote(buffer:string, headerOffset:number) {
    // trim all whitespace up to the first character
    buffer = buffer.substring(0, buffer.length - 2).trimStart();
    let len,
        ii,
        lines = buffer.split('\n');

    for (ii = lines.length - 1; ii >= 0; ii--) {
        lines[ii] = trimLeftMax(lines[ii], headerOffset - 2);
    }

    buffer = lines.join('\n');

    return buffer;
}

// function modeToString(mode:number) {
//     if ( isSet(mode, MODE_COMMENT) ) {
//         return 'comment';
//     }
//     if (isSet(mode, MODE_MULTI_COMMENT)) {
//         return 'multiComment';
//     }
//     if ( isSet(mode, MODE_VALUE) ) {
//         return 'value';
//     }
//     if ( isSet(mode, MODE_QUOTE) ) {
//         return 'quote';
//     }
//     if ( isSet(mode, MODE_MAYBE_QUOTE) ) {
//         return 'quote?';
//     }
//     if ( isSet(mode, MODE_MULTI_QUOTE) ) {
//         return 'multiQuote';
//     }
//     return 'idle';
// }

function createContext():Context {
    return {
        buffer: '',
        pos: 0,
        offset: 0,
        length: 0,
        output: [],
        line: 0,
        mode: MODE_IDLE,
        linePosition: 0,
        markPosition: 0,
        charBuffer: ['', '', ''],
        endChar:''
    };
}

/**
 * Trims whitespace from the left side of a string up to the offset
 * @param {*} str
 * @param {*} offset
 */
function trimLeftMax(str:string, offset:number) {
    let ws = /\s/,
        ii = 0;
    while (ii < offset && ws.test(str.charAt(ii++)));
    return str.substring(ii - 1);
}


function parseValue(str:string) {
    return parseJSON(str, str);
}