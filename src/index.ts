import { isObject, isString, isPromise, isFunction, isInteger } from "@odgn/utils";
import { deepExtend } from "@odgn/utils";
import { isStackValue, stackToString, unpackStackValueR } from "./util";
import { toInteger } from "@odgn/utils";
import { stdWords } from './words/std';
import { BitField, create as createBitField, toValues as bfToValues } from '@odgn/utils/bitfield';
import {
    StackValue, WordFn, SType,
    StackError, InstResult, AsyncInstResult, WordSpec, WordEntry, Words
} from "./types";
import { parseString } from './parser';


export interface CloneOptions {
    items?: boolean;
    words?: boolean;
}

// export const ActiveMode = {
//     Active: 0,
//     Leave: 1,
//     Break: 2,
//     Return: 3,
// } as const;
// type ActiveMode = typeof ActiveMode[keyof typeof ActiveMode]

// export const MODE_LEAVE = 0;
// export const MODE_BREAK = 1;

// type ActiveMode = 0 | 1;

let stackId = 0;

interface FilthInst {
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

function createInst(): FilthInst {
    return {
        id: ++stackId,
        items: [],
        words: {},
        isUDWordsActive: true,
        isEscapeActive: true,
        isActive: true,
    };
}

type PrintFn = (string) => void;

export interface FilthOptions {
    print?: PrintFn;
    words?: WordSpec[];
}

export class Filth {

    _idx: number = 0;
    _stacks: FilthInst[];

    // _udWords = new WeakMap();
    _udWords: { [key: string]: any } = {};

    debug: boolean = false;

    printFn: PrintFn

    constructor(options:FilthOptions = {}) {
        this._stacks = [createInst()];
        this.printFn = options.print ?? undefined;
        
        this.addWords(options.words ?? stdWords);
        
    }

    /**
     * 
     */
    get inst(): FilthInst {
        return this._stacks[this._idx];
    }

    /**
     * 
     */
    get words(): Words {
        return this._stacks[this._idx].words;
    }
    
    /**
     * 
     */
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


    setItems(items: StackValue[]): Filth {
        this._stacks[this._idx].items = items;
        return this;
    }

    get size(): number {
        return this._stacks[this._idx].items.length;
    }

    /**
     * 
     * @param args 
     */
    print( ...args ){
        if( this.printFn ){
            this.printFn( args.join(' ') );
        }
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

    clear(clearItems: boolean = true, clearWords: boolean = false): Filth {
        if (clearItems) {
            this._stacks[this._idx].items = [];
        }
        if (clearWords) {
            this._stacks[this._idx].words = {};
        }
        return this;
    }

    focus(): Filth {
        this._idx = this._stacks.length - 1;
        return this;
    }

    focusParent(): Filth {
        this._idx = this._idx > 1 ? this._idx - 1 : 0;
        return this;
    }

    // focusChild():Filth {
    //     const len = this._stacks.length-1;
    //     this._idx = this._idx < len ? this._idx + 1 : len;
    //     return this;
    // }

    setChild(stack?: Filth): Filth {
        let sub = createInst();
        if (stack !== undefined) {
            sub.words = deepExtend(stack.words);
        }
        this._stacks.push(sub);
        this._idx = this._stacks.length - 1;

        return this;
    }

    restoreParent(): Filth {
        if (this._stacks.length <= 1) {
            return this;
        }

        this._stacks.pop();
        this._idx = this._stacks.length - 1;

        return this;
    }

    
    /**
     * Evaluates a string
     * 
     * @param input 
     */
    async eval( input:string ){
        const insts = parseString(input,{returnValues:true});
        await this.pushValues(insts);
        return this;
    }


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
                    if (isInteger(sub)) {
                        const idx = toInteger(sub);
                        
                        value = pr === '$' ? this.pop(idx) : this.peek(idx);
                    }
                    else if (this.isUDWordsActive) {
                        handler = this.getUDWord(sub);
                    }
                }

                else {
                    handler = this.getWord(value);
                }

                // restore back to original index
                this._idx = stackIndex;
            }
        }

        if (handler !== undefined) {
            try {
                if (isStackValue(handler)) {
                    value = (handler as any);
                    if( value[0] === SType.Word ){
                        await this.pushValues(value[1]);
                        value = undefined;
                    }
                }
                else {
                    let result = handler(this, value);
                    value = isPromise(result) ? await result : result as InstResult;
                }
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
        return value;
    }

    /**
     * Pushes a value onto the stack without processing it
     * 
     * @param value 
     */
    pushRaw(value: StackValue): Filth {
        const stack = this;//.focus();
        // stack.items = [...stack.items, value];
        stack.items.push(value);
        return stack;
    }

    async pushValues(values: StackValue[], options: PushOptions = {}): Promise<number> {
        
        let count = 0;
        
        // record pushed values so we can report errors better
        let pushed = [];

        try {
            for (const value of values) {
                await this.push(value, options);
                count++;
                pushed.push(value);
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

    addUDWord(word: string, val: any): Filth {
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

    addWords(words: WordSpec[], replace: boolean = false): Filth {

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


    // clone<QS extends Filth>(stack: QS, options:CloneOptions = {}): QS {
    clone(options: CloneOptions = {}): Filth {
        let result = new Filth();

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


// function printStackLineage(st: Filth, result: string = '') {
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
