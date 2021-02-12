
import { isObject, isString, isPromise, isFunction, isInteger } from "@odgn/utils";
import { deepExtend } from "@odgn/utils";
import { stackToString, unpackStackValueR } from "./util";
import { toInteger } from "@odgn/utils";
import { BitField, create as createBitField, toValues as bfToValues } from '@odgn/utils/bitfield';
import {
    StackValue, WordFn, SType,
    StackError, InstResult, AsyncInstResult, WordSpec, WordEntry, Words
} from "./types";


let pushValuesRun = 0;

export interface CloneOptions {
    items?: boolean;
    words?: boolean;
}

export const ActiveMode = {
    Active: 0,
    Leave: 1,
    Break: 2,
    Return: 3,
} as const;
type ActiveMode = typeof ActiveMode[keyof typeof ActiveMode]

// export const MODE_LEAVE = 0;
// export const MODE_BREAK = 1;

// type ActiveMode = 0 | 1;

let stackId = 0;

interface QueryStackInst {
    id: number;
    items: StackValue[];
    words: Words;
    isUDWordsActive: boolean;
    isEscapeActive: boolean;
    isActive: boolean;
    // pendingActive?: boolean;
    // leaveSet?: boolean;
    // wordStack: any[];
    // udWords: { [key:string]: any };
}

function createInst(): QueryStackInst {
    return {
        id: ++stackId,
        items: [],
        words: {},
        isUDWordsActive: true,
        isEscapeActive: true,
        isActive: true,
    };
}


export class QueryStack {

    _idx: number = 0;
    _stacks: QueryStackInst[];

    // _udWords = new WeakMap();
    _udWords: { [key: string]: any } = {};

    debug: boolean = false;

    constructor(stack?: QueryStack) {
        this._stacks = [createInst()];
    }

    get inst(): QueryStackInst {
        return this._stacks[this._idx];
    }

    get words(): Words {
        return this._stacks[this._idx].words;
    }
    // get udWords(): { [key:string]: any } {
    //     return this._stacks[ this._idx ].udWords;
    // }
    get items(): StackValue[] {
        return this._stacks[this._idx].items;
    }

    set isUDWordsActive(val: boolean) {
        this._stacks[this._idx].isUDWordsActive = val;
    }
    get isUDWordsActive() {
        return this._stacks[this._idx].isUDWordsActive;
    }

    set isEscapeActive(val: boolean) {
        this._stacks[this._idx].isEscapeActive = val;
    }
    get isEscapeActive() {
        return this._stacks[this._idx].isEscapeActive;
    }

    set isActive(val: boolean) {
        this._stacks[this._idx].isActive = val;
    }

    get isActive() {
        return this._stacks[this._idx].isActive;
    }


    setItems(items: StackValue[]): QueryStack {
        this._stacks[this._idx].items = items;
        return this;
    }

    get size(): number {
        return this._stacks[this._idx].items.length;
    }

    getUDValue(word: string) {
        let value = this.getUDWord(word);
        return unpackStackValueR(value);
    }

    peek(offset: number = 0): StackValue {
        let items = this.items;
        const length = items.length;
        const idx = length - 1 - offset;
        // if (idx < 0 || length === 0) {
        //     // console.log('[pop]', this);
        //     throw new StackError(`stack underflow ${offset} / ${length}`);
        // }

        // const stack = this.focus();
        return items[idx];
    }

    clear(clearItems: boolean = true, clearWords: boolean = false): QueryStack {
        if (clearItems) {
            this._stacks[this._idx].items = [];
        }
        if (clearWords) {
            this._stacks[this._idx].words = {};
        }
        return this;
    }

    focus(): QueryStack {
        this._idx = this._stacks.length - 1;
        return this;
    }

    focusParent(): QueryStack {
        this._idx = this._idx > 1 ? this._idx - 1 : 0;
        return this;
    }

    // focusChild():QueryStack {
    //     const len = this._stacks.length-1;
    //     this._idx = this._idx < len ? this._idx + 1 : len;
    //     return this;
    // }

    setChild(stack?: QueryStack): QueryStack {
        let sub = createInst();
        if (stack !== undefined) {
            sub.words = deepExtend(stack.words);
        }
        this._stacks.push(sub);
        this._idx = this._stacks.length - 1;

        return this;
    }

    restoreParent(): QueryStack {
        if (this._stacks.length <= 1) {
            return this;
        }

        this._stacks.pop();
        this._idx = this._stacks.length - 1;

        return this;
    }

    // async push(input: any | StackValue): Promise<StackValue> {
    //     let [stack, value] = await push(this, input);
    //     Object.assign(this, stack);
    //     return value;
    // }


    /**
     * Pushes a stack value onto the stack
     */
    async push(input: any | StackValue, options?: PushOptions): Promise<StackValue> {
        let value: StackValue;
        let handler: WordFn;
        // const ticket = options.ticket;

        value = isStackValue(input) ? input : [SType.Value, input];
        let [type, word] = value;

        // Log.debug('[push]', 'pre', this.isActive, value);

        if (this.isEscapeActive) {
            if (word == '@!' ) {
                this.isActive = false;
                // this.setActive(false, ActiveMode.Return, word);
            } else if (word == '@>' ) {
                this.isActive = true;
                // this.setActive(true, ActiveMode.Active, word);
                return value;
            }
        }

        if (this.isActive === false) {
            // Log.debug('[push]', 'inactive stack');
            return undefined;
        }


        // let doPush = true;
        const debug = options?.debug ?? false;
        const evalEscape = options?.evalEscape ?? false;

        if (type === SType.Value && isString(word)) {
            const len = word.length;
            let evalWord = true;

            if (len > 1 && word.charAt(0) === '~') {
                const sigil = word.charAt(1);
                const sep = word.charAt(2);
                const end = word.lastIndexOf(sep);
                const flags = word.substring(end + 1);
                const sigilV = word.substring(3, end);

                if (sigil === 'r') {
                    // Log.debug('[push]', 'regex', sigilV);
                    const regex = new RegExp(sigilV, flags);
                    value = [SType.Regex, regex];
                }
                else if (sigil === 'd') {
                    value = [SType.DateTime, sigilV == '' ? new Date() : new Date(sigilV)];
                }
            }

            // escape char for values which might otherwise get processed as words
            if ( len > 1 && word.charAt(0) === '*') {
                word = word.substring(1);
                value = [SType.Value, word] as any;
                evalWord = evalEscape;// false;
                
                // if( debug ) Log.debug('[push]', value, 'escaped');
            }

            if( evalWord ) {
                // save the current stack
                let stackIndex = this._idx;

                if (len > 1) {
                    // words beginning with ^ cause the stack focus to move up
                    while (word.charAt(0) === '^') {
                        this.focusParent();
                        word = word.substring(1);
                        value = [type, word];
                    }
                }

                // words beginning with $ refer to offsets on the root stack if they are integers,
                // or user defined words
                const pr = word.charAt(0);
                if (len > 1 && pr === '$' || (len > 1 && pr === '%') ) {
                    let sub = word.substring(1);
                    // Log.debug('[push]', word, this._idx, isInteger(sub), this.isUDWordsActive );
                    if (isInteger(sub)) {
                        const idx = toInteger(sub);
                        // Log.debug('[push]', '$ pr', word, this.toString() );
                        
                        value = pr === '$' ? this.pop(idx) : this.peek(idx);
                        // Log.debug('[push]', '$ pr', word, this.toString() );
                    }
                    else if (this.isUDWordsActive) {
                        handler = this.getUDWord(sub);
                        // Log.debug('[push]', 'getUDWord', sub, handler);

                    }
                    // Log.debug('[push]', '$ po', word, wordStack.items, wordStack.id);
                    // Log.debug('[push]', '$', idx, 'pop', value, stack.id, wordStack.id);
                }

                else {
                    // try for a user defined word - these are global
                    // if( len > 1 && word.charAt(0) === '@' ){
                    //     handler = this.getUDWord( word.substring(1) );
                    // }

                    // try for a regular word - these are scoped to the current stack
                    // if( handler === undefined ){
                    handler = this.getWord(value);
                    // Log.debug('[push][getWord]', value, handler );
                    // if( this.debug && word === 'count' ) Log.debug( this.words );
                    // if( this.debug && word === 'count' ) throw new StackError('stop');
                    // }

                    // Log.debug('[push]', 'word', stack?.id, wordStack?.id );
                    // handler = this.getWord(value);
                    // if( value[1] === 'dstId' ){
                    //     let wh = this.getUDWord(value[1]);
                    //     Log.debug('[push]', 'word?', value);
                    //     Log.debug('[push]', 'word', stackIndex, handler, wh );
                    // }
                    // DLog(stack, '[push]', 'word', stack.id, wordStack.id, value );
                }

                // restore back to original index
                this._idx = stackIndex;
            }
        }

        // if( word === 'leave' ){
        // Log.debug('[push]', word, handler );
        // }

        // Log.debug('[push]', 'pre', { isActive: this.isActive, isEscapeActive: this.isEscapeActive }, value, handler);

        if (handler !== undefined) {
            try {
                if (isStackValue(handler)) {
                    value = (handler as any);
                }
                else {

                    let handlerVal = value;
                    // Log.debug('[push]', 'pre', this.isActive, value);
                    let result = handler(this, value);
                    value = isPromise(result) ? await result : result as InstResult;
                    this.focus();
                    if (value === undefined) {
                        // Log.debug('[push]', 'post', this.isActive, this.items );
                    }
                }
                // if( value && this.debug ) Log.debug('[push]', value); 
            } catch (err) {
                if( err instanceof StackError ){
                    throw err;
                }
                let e = new StackError(`${err.message}`);
                e.original = err
                e.stack = e.stack.split('\n').slice(0, 2).join('\n') + '\n'
                    + [...new Set(err.stack?.split('\n'))].join('\n');
                throw e;
            }
        }

        if (value !== undefined) {
            this.items.push(value);
        }
        // Log.debug('[push]', word, value, handler, this.isActive );
        // Log.debug('[push]', this.items );

        return value;
    }

    /**
     * Pushes a value onto the stack without processing it
     * 
     * @param value 
     */
    pushRaw(value: StackValue): QueryStack {
        const stack = this;//.focus();
        // stack.items = [...stack.items, value];
        stack.items.push(value);
        return stack;
    }

    async pushValues(values: StackValue[], options: PushOptions = {}): Promise<number> {
        // let ovalues: StackValue[] = [];
        const ignoreActive = options.ignoreActive ?? false;
        // const ticket = options.ticket;
        const debug = options.debug;

        let count = 0;
        // let revertActive = false;
        // Log.debug('[pushValues$]', this.isActive, {run,ticket}, values);
        // let startActive = this.isActive;

        // record pushed values so we can report errors better
        let pushed = [];

        try {
            for (const value of values) {
                await this.push(value, options);
                count++;
                pushed.push(value);
            }

            if (ignoreActive) {
                // this.isActive = true;
            }

        } catch (err) {
            // if( err instanceof StackError ){
            //     throw err;
            // }
            let dump = stackToString(this, true, pushed.slice(1).slice(-5));
            let msg = err.message;
            if( msg.indexOf(': (') == -1 ){
                msg = `${err.message}: (${dump})`;
            } else {
                throw err;
            }
            let e = new StackError(msg);
            // let e = new StackError(`${err.message}: (${pushed.slice(1).slice(-5).join(' ')})`);
            e.original = err
            e.stack = e.stack.split('\n').slice(0, 2).join('\n') + '\n'
                // + err.stack;
                + [...new Set(err.stack?.split('\n'))].join('\n');
            throw e;
        }

        return count;
        // return ovalues;
    }

    popValue(offset: number = 0, recursive: boolean = true): any {
        const sv = this.pop(offset);
        return sv === undefined ? undefined : recursive ? unpackStackValueR(sv) : sv[1];
    }

    /**
     * 
     * @param offset 
     */
    pop(offset: number = 0): StackValue {
        // const stack = this; //this.focus();

        const length = this.items.length;
        const idx = length - 1 - offset;
        if (idx < 0 || length === 0) {
            // console.log('[pop]', this);
            throw new StackError('stack underflow');
        }
        const value = this.items[idx];
        let items;


        if (offset > 0) {
            // Log.debug('[pop]', idx, value );
            items = this.items.filter((val, ii) => idx !== ii)
            // return [{...stack, items }, value];
        } else {
            items = this.items.slice(0, -1);
        }
        this.setItems(items);// = items;
        return value;
    }


    /**
     * Pops values from the stack while the type matches
     * 
     * @param stack 
     * @param type 
     */
    popOfType(...types: SType[]): StackValue[] {
        // const stack = this; //this.focus();
        const length = this.items.length;
        if (length === 0) {
            return [];
        }

        let results = [];
        let ii = length - 1;

        for (ii; ii >= 0; ii--) {
            const value = this.items[ii];
            if (types.indexOf(value[0] as SType) === -1) {
                break;
            }
            results.push(value);
        }

        // cut the stack down to size
        this.setItems(this.items.slice(0, ii + 1));

        return results;
    }

    addUDWord(word: string, val: any): QueryStack {
        // console.log('[addUDWord]', this._idx, word, val );
        // this.udWords[word] = val;
        this._udWords[word] = val;
        // this._udWords.set(word, val);
        // return this.addWords([[word,val]], true);
        return this;
    }

    getUDWord(word: string) {
        return this._udWords[word];
    }

    addWords(words: WordSpec[], replace: boolean = false): QueryStack {

        for (const spec of words) {
            const [word, fn, ...args] = spec;

            let patterns = replace ?
                []
                : (this.words[word] || []);
            // : Array.isArray(word) ? this.words[word[0]] : (this.words[word] || []);
            // : Array.isArray(word) ? word.reduce( (o,w) => [...o,this.words[w]], [] ) : (this.words[word] || []);
            patterns = [...patterns, [fn, (args as (SType[]))]] as WordEntry[];

            // if( Array.isArray(word) ){
            //     this.words = word.reduce( (out,w) => ({...out,[w]:patterns }), this.words );
            //     // console.log('[getWord]', this.words);
            //     // throw 'stop';
            // } else {
            this.words[word] = patterns;
            // this.words = { ...this.words, [word]: patterns };
            // }
        }

        return this;
    }


    getWord(value: StackValue): WordFn | undefined {
        // const [type,word] = value;
        if (value[0] !== SType.Value || !isString(value[1])) {
            return undefined;
        }
        const wval = value[1];

        const patterns = this.words[wval];
        if (patterns === undefined) {
            return undefined;
        }
        let pattern = patterns.find(pat => {
            const [, args] = pat;

            return matchStack(this.items, args) ? pat : undefined;

            // Log.debug('[getWord]', 'match', `'${wval}'`, args, stack.items );
        });
        // Log.debug('[getWord]', value, wval, pattern);
        if (pattern !== undefined) {
            return pattern[0];
        }

        // Log.debug('[getWord]', 'match', `'${wval}'`, patterns.map(p => p.slice(1)));
        // Log.debug('[getWord]', 'match', `'${wval}'`, stackToString(this));
        throw new StackError(`invalid params for ${wval}`);
    }


    // clone<QS extends QueryStack>(stack: QS, options:CloneOptions = {}): QS {
    clone(options: CloneOptions = {}): QueryStack {
        let result = new QueryStack();

        // if (options.items ?? true) {
        //     result.items = deepExtend(this.items);
        // }
        // if (options.words ?? true) {
        //     result.words = deepExtend(this.words);
        // }

        return result;
    }




    /**
     * 
     */
    findWithIndex(type: SType): [number, StackValue] {
        const stack = this;// this.focus();
        for (let ii = stack.items.length - 1; ii >= 0; ii--) {
            const item = stack.items[ii];
            if (type === item[0]) {
                // Log.debug('[findWithIndex]', 'found', item, ii );
                return [ii, item];
            }
        }
        return [-1, undefined];
    }

    /**
     * Returns the first value of type from the stack
     * 
     * @param stack 
     * @param type 
     */
    findV(type: SType): any {
        const stack = this;// this.focus();
        const [_, value] = stack.findWithIndex(type);
        return value ? value[1] : undefined;
    }
    find(type: SType): StackValue {
        const stack = this; //this.focus();
        const [_, value] = stack.findWithIndex(type);
        return value;
    }


    toString(reverse: boolean = true): string {
        return stackToString(this, reverse);
    }
}



export function isStackValue(value: any): boolean {
    return Array.isArray(value) && value.length == 2;
}


// function printStackLineage(st: QueryStack, result: string = '') {
//     result += String(st.id);
//     let curr = st;
//     let pre = '';

//     while (curr.getParent()) {
//         pre = `${curr._parent} < ` + pre;
//         curr = curr.focus(curr._parent);
//     }

//     curr = st;
//     let post = '';
//     while (curr.getChild()) {
//         post = post + `> ${curr._child}`;
//         curr = curr.getChild();
//     }

//     return `${pre} (${st.id}) ${post}`;
// }

export interface PushOptions {
    debug?: boolean;
    ignoreActive?: boolean;
    ticket?: string;
    isWord?: boolean;
    evalEscape?: boolean;
}




export interface ExecuteOptions {
    pushResult?: boolean;
}


function matchStack(stackItems: StackValue[], pattern: SType[]) {
    const pLength = pattern.length;
    if (pLength === 0) {
        return true;
    }
    const sLength = stackItems.length;
    if (pLength > sLength) {
        return false;
    }
    for (let ii = 0; ii < pLength; ii++) {
        const sym = pattern[pLength - 1 - ii];
        const [vt, v] = stackItems[sLength - 1 - ii];
        if (sym !== SType.Any && sym !== vt && sym !== v) {
            // Log.debug('[matchStack]', sym, vt, v );
            return false;
        }
    }
    // Log.debug('[matchStack]', pattern, stackItems );
    return true;
}


export function assertStackSize(stack: QueryStack, expected: number, msg?: string) {
    const len = stack.items.length;
    if (len < expected) {
        if (msg === undefined) {
            msg = `expected stack size ${expected}, actual: ${len}`;
        }
        throw new Error(msg);
    }
}

export function assertStackValueType(stack: QueryStack, index: number, opType: string, argType?: any) {
    // Log.debug('[assertStackValueType]', 'argType', argType );
    const len = stack.items.length;
    const idx = len - 1 - index;
    if (idx < 0) {
        throw new Error(`value out of bounds: -${index + 1} : ${len}`);
    }
    const value: StackValue = stack.items[idx];
    if (value[0] !== opType) {
        throw new Error(`expected value of type ${opType} at index ${idx} : got ${value[0]}`);
    }
    if (argType !== undefined && typeof value[1] !== argType) {
        throw new Error(`expected arg of type ${argType} at index ${idx} : got ${typeof value[1]}`);
    }
}



// export function isDLogEnabled<QS extends QueryStack>(stack: QS) {
//     const wordFn = stack.getWord([SType.Value, 'trace']);
//     return (wordFn !== undefined && isStackValue(wordFn) && wordFn[1] === true);
// }

// export function DLog<QS extends QueryStack>(stack: QS, ...args) {
//     const wordFn = stack.getWord([SType.Value, 'trace']);
//     if (wordFn === undefined || !isStackValue(wordFn)) {
//         return;
//     }

//     if (wordFn[1]) {
//         Log.debug(...args);
//     }
// }