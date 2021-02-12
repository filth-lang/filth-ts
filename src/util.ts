import { StackError, StackValue, SType } from "./types";
import { stringify } from '@odgn/utils';
import { isStackValue, QueryStack } from "./stack";


export interface ToStringOptions {
    flat?: boolean;
}

export function stackToString(stack: QueryStack, reverse:boolean = true, items:StackValue[] = undefined): string {
    items = items ?? stack.items;
    let strs = items.map(val => valueToString(val));
    if( reverse ){
        strs.reverse();
    }
    return strs.join(' ');
}

export function valueToString(val: StackValue, listToString:boolean = false): string {
    if( !Array.isArray(val) ){
        return val as any;
    }
    const [type, value] = val;
    const strCheck = /^[a-z0-9\/_$]+$/i;

    // Log.debug('[valueToString]', type, value);
    switch (type) {
        case SType.List:
            if( listToString ){
                return value.map(v => valueToString(v,listToString)).join(' ');
            }
            return `[` + value.map(v => valueToString(v)).join(', ') + ']';
        case SType.Map:
            return '{' + Object.keys(value).reduce((res, key) => {
                return [...res, `"${key}": ${valueToString(value[key])}`];
            }, []).join(',') + '}';
        case SType.Value:
            return strCheck.test(value) ? JSON.stringify(value) : value;
            // return JSON.stringify(value);
        case SType.Regex:
            return '~r/' + value.toString() + '/';
        case SType.DateTime:
            return '~d|' + value.toISOString() + '|';
        default:
            return val.length === 2 ? `(${type}, ${stringify(value)})` : stringify(val);
    }
}



/**
 * 
 * @param val 
 * @param assertType 
 * @param recursive 
 */
export function unpackStackValue(val: StackValue, assertType: (SType | SType[]) = SType.Any, recursive: boolean = false): any {
    let [type, value] = val;
    if (!Array.isArray(assertType)) {
        assertType = [assertType];
    }

    if (assertType.indexOf(SType.Any) === -1 && assertType.indexOf(type) === -1) {
        throw new StackError(`expected type ${assertType}, got ${type}`);
    }

    switch (type) {
        case SType.List:
            // console.log('[unpackStackValue]', type, value);
            return recursive ? value.map(av => unpackStackValue(av, SType.Any, true)) : value;
        case SType.Map:
            return recursive ? Object.keys(value).reduce((res, key) => {
                let val = value[key];
                return { ...res, [key]: isStackValue(val) ? unpackStackValue(val, SType.Any, true) : val }
            }, {}) : value;
        case SType.Value:
        case SType.Any:
        case SType.Function:
        case SType.Regex:
        case SType.DateTime:
            return value;
        default:
            return val;
    }
}

/**
 * 
 * @param val 
 * @param assertType 
 */
export function unpackStackValueR(val: StackValue, assertType: SType = SType.Any) {
    return unpackStackValue(val, assertType, true);
}