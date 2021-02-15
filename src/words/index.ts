import {
    Filth
} from '../';
import {
    SType,
    StackValue,
    InstResult, AsyncInstResult,
    StackError,
} from '../types';
import {
    isInteger, isString, isFunction
} from '@odgn/utils';

import { stackToString, valueToString, unpackStackValue, unpackStackValueR } from '../util';
import { compareDates } from './util';
import { BitField, TYPE_OR, toValues as bfToValues } from '@odgn/utils/bitfield';
import { stringify } from '@odgn/utils';
import { evalList } from './list';




/**
 * Duplicates the top stack value, or if the op is 'over', duplicates the previous
 * 
 * ( n1 n2 — n1 n2 n1 )
 * 
 * @param stack 
 * @param op 
 */
export async function onDup<QS extends Filth>(stack: QS, [,op]): AsyncInstResult {
    let val = stack.peek( op === 'over' ? 1 : 0);
    return [...val];
}

/**
 * 
 * ( n1 n2 -- n2 )
 * @param stack 
 * @param op 
 */
export function onNip<QS extends Filth>(stack: QS): InstResult {
    let items = stack.items;
    items.splice(-2,1);
    stack.setItems(items);
    return undefined;
}

/**
 * 
 * ( n1 n2 -- n2 n1 n2 )
 * @param stack 
 * @param op 
 */
export function onTuck<QS extends Filth>(stack: QS): InstResult {
    let items = stack.items;
    items.splice(-2, 0, items[items.length-1]);
    // console.log('ok now', items);
    stack.setItems(items);
    return undefined;
}

/**
 * Rotates third item to top
 * 
 * ( n1 n2 n3 — n2 n3 n1 )
 */
export async function onRot<QS extends Filth>(stack: QS): AsyncInstResult {
    let items = stack.items;

    if (items.length < 3) {
        throw new StackError('stack underflow');
    }

    const rem = items.splice(-3, 1);
    items.push(rem[0]);
    stack.setItems(items);

    return undefined;
}



export async function onPrint<QS extends Filth>(stack: QS, val: StackValue): AsyncInstResult {
    let msg;
    const [, op] = val;
    if (op === '.s') {
        stack.print( stackToString(stack,false) );
    }
    else if (op === '..') {
        stack.print('(', stackToString(stack), ')');
    } else {
        // let msg =  await onToString(stack, [,'to_str!']);
        let msg = stack.pop();
        stack.print(unpackStackValueR(msg));
    }
    return undefined;
}


export function onFetchList<QS extends Filth>(stack: QS, val: StackValue): InstResult {
    let left = stack.pop();
    let right = stack.pop();
    let arr = unpackStackValue(right, SType.List);
    let idx = unpackStackValue(left, SType.Value);
    return arr[idx];
}


export function onRegexBuild(stack: Filth): InstResult {
    let val = stack.popValue();
    // console.log('[onRegexBuild]', new RegExp(val) );
    return [SType.Regex, new RegExp(val)];
}

export function onRegex(stack: Filth, [, op]: StackValue): InstResult {
    let regex: RegExp = stack.popValue();
    let val = stack.popValue();

    // console.log('[onRegex]', regex, val );

    if (!isString(val)) {
        return [SType.Value, false];
    }

    let value: any = false;

    if (op === 'split') {
        value = val.split(regex);
    }
    else if (op === 'replace') {
        let repl = stack.popValue();
        // console.log('[onRegex]', 'replace', regex, val, repl );
        value = val.replace(regex, repl);
    }
    else if (op === 'eval') {
        let result = regex.exec(val);
        // console.log('[onRegex]', 'result', regex, val, result );
        if (result) {
            value = Array.from(result);
        }
    }
    else if (op === '==') {
        value = regex.test(val);
    } else if (op === '!=') {
        value = !regex.test(val);
    }

    if (Array.isArray(value)) {
        return [SType.List, value.map(v => [SType.Value, v])];
    }

    return [SType.Value, value];
}

export function onCompare(stack: Filth, [, op]: StackValue): InstResult {
    let left = JSON.stringify(stack.pop());
    let right = JSON.stringify(stack.pop());

    let value = op == '!=' ? left != right : left == right;

    return [SType.Value, value];
}

export function onDateTime(stack: Filth, [, op]: StackValue): InstResult {
    let dateA = stack.popValue();
    let dateB = stack.popValue();

    let value = compareDates(op, dateA, dateB);

    return [SType.Value, value];
}

/**
 * Places an undefined value on the stack
 */
export function onUndefined(stack: Filth): InstResult {
    return [SType.Value, undefined];
}


export function onBitFieldOr(stack: Filth): InstResult {
    let bf = stack.popValue();
    bf.type = TYPE_OR;
    return [SType.BitField, bf];
}

export function onAdd(stack: Filth, [, op]: StackValue): InstResult {

    let right = stack.popValue();
    let left = stack.popValue();

    let value = left;
    switch (op) {
        case '+': value = left + right; break;
        case '*': value = left * right; break;
        case '/': value = left / right; break;
        case '-': value = left - right; break;
        case '%':
        case 'mod':
            value = left % right;
            break;
        case '==':
            value = left === right;
            break;
        case '!=':
            value = left !== right;
            break;
        case '>': value = left > right; break;
        case '>=': value = left >= right; break;
        case '<': value = left < right; break;
        case '<=': value = left <= right; break;
        case 'max': value = Math.max(left, right); break;
        case 'min': value = Math.min(left, right); break;
    }

    return [SType.Value, value];
}

export function onAbs(stack:Filth, [,op]:StackValue): InstResult {
    let v = stack.popValue();
    if( op === 'abs' ){
        v = Math.abs(v);
    } else {
        v = -v;
    }
    return [SType.Value, v];
}



export function onListOpen(stack: Filth): InstResult {
    let sub = stack.setChild();

    sub.addWords([
        ['{', onMapOpen],
        ['[', onListOpen],
        [']', onListClose],
        ['}', onUnexpectedError],
    ], true);
    sub.isUDWordsActive = false;
    sub.isEscapeActive = false;
    // Log.debug('[onListOpen]', 'stack', stack._idx, stack.isUDWordsActive, 'sub', sub._idx, sub.isUDWordsActive );

    return undefined;
}

export function onListClose<QS extends Filth>(stack: QS): InstResult {
    // Log.debug('[onListClose]', stack );
    let val: StackValue = [SType.List, stack.items];
    stack.restoreParent();
    return val;
}

export function onMapOpen(stack: Filth): InstResult {

    // Log.debug('[onMapOpen]', stack.items);//Object.keys(stack.words));

    let sub = stack.setChild();

    // add something which will interpret each push
    sub.addWords([
        ['{', onMapOpen],
        ['[', onListOpen],
        ['}', onMapClose],
        [']', onUnexpectedError],
    ], true);
    // throw 'stop';
    // (sub as any)._stack = stack;
    // Log.debug('[onMapOpen]', {id:sub.id, parent:stack.id});
    return undefined;
}


export function onMapClose<QS extends Filth>(stack: QS, val: StackValue): InstResult {
    // if( stack.id === 158 ){
    //     Log.debug('[onMapClose]', {id:stack.id, parent:stack._parent?.id}, stackToString(stack) );
    //     Log.debug('[onMapClose]', stack);
    // }

    let map = stack.items.reduce((result, val, idx, array) => {
        if (idx % 2 === 0) {
            let key = unpackStackValue(val);
            let mval = array[idx + 1];
            // console.log('key!', key, array);
            result[key] = mval === undefined ? [SType.Value, undefined] : mval;
        }
        return result;
    }, {});
    val = [SType.Map, map];
    // Log.debug('[onMapClose]', {id:stack.id, parent:stack._parent.id});
    // stack = stack._parent;
    stack.restoreParent();
    return val;
}


export function onUnexpectedError<QS extends Filth>(stack: QS, val: StackValue): InstResult {
    throw new StackError(`unexpected word '${val}'`);
}


export function onValue<QS extends Filth>(stack: QS): InstResult {
    let val = stack.pop();
    let value = unpackStackValueR(val);
    if (val[0] === SType.List) {
        value = value.map(v => [Array.isArray(v) ? SType.List : SType.Value, v]);
        // stack = { ...stack, items: [...stack.items, ...value] };
        // stack.items = [...stack.items, ...value];
        stack.items.push(value);
    }
    return undefined;
}


/**
 * ( [] -- vl )
 * ( %{} -- vl )
 * @param stack 
 */
export async function onSize<QS extends Filth>(stack: QS, [, op]: StackValue): AsyncInstResult {
    let size = 0;
    // by default, the word consumes what it is measuring
    const isDes = op === 'size!';
    let [type, val] = isDes ? stack.pop() : stack.peek();

    if (type === SType.List) {
        size = (val as any[]).length;
    }
    else if (type === SType.Map) {
        size = Object.keys(val).length;
    } else if (isString(val)) {
        size = (val as string).length;
    }

    return [SType.Value, size];
}

export function onBuildMap<QS extends Filth>(stack: QS): InstResult {
    let values: StackValue[];
    let left = stack.pop();
    let array = unpackStackValue(left, SType.List, false);



    let map = array.reduce((result, val, idx, array) => {
        if (idx % 2 === 0) {
            let key = unpackStackValue(val, SType.Value);
            let mval = array[idx + 1];
            // Log.debug('[onBuildMap]', key, mval );
            result[key] = mval === undefined ? [SType.Value, undefined] : mval;
        }
        return result;
    }, {});

    // Log.debug('[onBuildMap]', map );

    return [SType.Map, map];
}

export async function onToString(stack: Filth, [, op]: StackValue): AsyncInstResult {
    const isJoin = op === 'to_str!';
    let val = stack.pop();
    let str = '';
    // with to string
    // Log.debug('[onToString]', op, isJoin, val );
    if (isJoin && val[0] === SType.List) {
        let list = unpackStackValue(val, SType.List);
        val = await evalList(stack, list);
        str = valueToString(val, true);
    }
    else {
        str = valueToString(val);
    }

    return [SType.Value, str];
}


/**
 * 
 * ( [] vl -- vl )
 * ( vl vl -- vl )
 * 
 * [ hello world ] ' ' join -- 'hello world'
 */
export async function onJoin(stack: Filth): AsyncInstResult {
    let joinStr = stack.pop();
    let list = stack.pop();
    let result;

    if (list[0] === SType.List) {
        list = await evalList(stack, list[1]);
        list = unpackStackValueR(list, SType.List);
        result = list.join(joinStr[1]).trim();
    } else {
        result = list[1] + joinStr[1];
    }

    // Log.debug('[onJoin]', joinStr[1], list, `"${result}"` );
    return [SType.Value, result];
}

/**
 * 
 * ( [] vl -- [] )
 */
export function onPush<QS extends Filth>(stack: QS, val: StackValue): InstResult {
    let rv = stack.pop();
    let lv = stack.pop();

    let list = unpackStackValue(lv, SType.List);

    // Log.debug('[onPush]', list, rv );

    list = [...list, rv];

    return [SType.List, list];
}


/**
 * 
 * pop! ( [] -- vl ) - destructive
 * pop ( [] -- [] vl ) - retains list
 * 
 * @param stack 
 */
export function onPop<QS extends Filth>(stack: QS, [, op]: StackValue): InstResult {
    const isPopRet = op == 'pop';
    const isPopSafe = op == 'pop?';

    let lv = stack.pop();

    let list = unpackStackValue(lv, SType.List);
    const len = list.length;
    if (len === 0) {
        if (isPopSafe) {
            stack.pushRaw([SType.List, list]);
            return [SType.Value, undefined];
        }
        throw new StackError('stack underflow');
    }

    let value = list.pop();

    if (isPopRet || isPopSafe) {
        stack.pushRaw([SType.List, list]);
    }

    stack.pushRaw(value);

    return undefined;
}





export function onSwap<QS extends Filth>(stack: QS): InstResult {
    let left = stack.pop();
    let right = stack.pop();

    stack.pushRaw(left);
    stack.pushRaw(right);

    return undefined;
}

export function onDrop<QS extends Filth>(stack: QS): InstResult {
    stack.pop();
    return undefined;
}


export function onClear<QS extends Filth>(stack: QS): InstResult {
    stack.clear();
    return undefined;
};

export function onVersion<QS extends Filth>(stack: QS): InstResult {
    return [SType.Value, '1.0.0'];
};


export function onAssertType<QS extends Filth>(stack: QS): InstResult {
    let value: StackValue = stack.pop();
    let type = unpackStackValue(value, SType.Value);
    value = stack.peek();
    if (value === undefined) {
        throw new Error(`[onAssertType] stack underflow`);
    }
    if (value[0] !== type) {
        throw new Error(`[onAssertType] expected type ${type}, got ${value}`);
    }
    return undefined;
}

export function onPrintStack<QS extends Filth>(stack: QS): InstResult {
    const vals = [...stack.items];
    print(0, `> stack ${stack._idx}`);

    const words = stack._udWords;
    for (const word in words) {
        print(0, `${word}:`);
        printType(1, words[word]);
        // print(1, typeof words[word], {}.toString.call(words[word]), isFunction(words[word]) );
    }

    print(0, '---');
    for (const val of vals.reverse()) {
        printType(0, val);
        // console.log( `${indent} (${type}) ${val}`);
    }

    // Log.debug( '??', stack.toString() );
    return undefined;
}

function printType(indent: number = 0, val: StackValue) {
    if (!Array.isArray(val)) {
        print(indent, isFunction(val) ? 'Fn' : val);
        return;
    }
    const type = val[0];
    switch (type) {
        case SType.List:
            printList(indent, val);
            break;
        case SType.BitField:
            const bf: BitField = val[1];
            print(indent, `(${type}) [${bfToValues(bf)}]`)
            break;

        default:
            print(indent, `(${type}) ${stringify(val[1])}`);
            break;
    }
}

function printList(indent: number = 0, list: StackValue) {
    print(indent, `${list[0]}`);
    for (const val of list[1]) {
        printType(indent + 1, val);
    }
}

function print(indent, ...val) { console.log(`${' '.repeat(indent)}`, ...val); }

// export function onAssert( stack:Filth, val:StackValue ):InstResult {
//     // Log.debug('[assert]', val);
//     [stack,val] = pop(stack);
//     assert( val[1], `failed to assert value ${val}` );
//     return undefined;
// }

