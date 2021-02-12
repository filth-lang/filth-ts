import { SType, StackError, AsyncInstResult, StackValue, InstResult } from "../types";
import { unpackStackValue, unpackStackValueR, stackToString } from "../util";
import { isObject } from "@odgn/utils";
import { isStackValue, QueryStack } from "../stack";
import Jsonpointer from 'jsonpointer';


export function onPluck(stack: QueryStack, [, op]: StackValue): InstResult {

    // console.log('[onPluck]', stackToString(stack) );
    const isDes = op === 'pluck!';

    let right = stack.pop();
    // let left = stack.pop();
    let left = isDes ? stack.pop() : stack.peek();

    let key = unpackStackValueR(right, SType.Any);
    let list = unpackStackValue(left, [SType.List, SType.Map]);

    let isInputArray = !isObject(list);
    if (isObject(list)) {
        list = [[SType.Map, list]];
    }

    // console.log('[onPluck]', { key }, { list });

    let out: any[] = [];
    if (Array.isArray(key)) {

        for (const it of list) {
            let obj = unpackStackValue(it);

            if (!isObject(obj)) {
                throw new StackError(`expected map, got ${it[0]}`);
            }

            // console.log('[onPluck]', 'well', key, obj);

            let result = [];

            for (let ii = 0; ii < key.length; ii++) {
                let val = getStackValue(obj, key[ii]);
                result[ii] = val;
            }

            out.push([SType.List, result]);
        }
    }
    else {


        for (const it of list) {
            let obj = unpackStackValue(it);
            if (!isObject(obj)) {
                throw new StackError(`expected map, got ${it[0]}`);
            }
            let val = getStackValue(obj, key);

            out.push(val);
        }

    }
    if (out.length === 1 && !isInputArray) {// !Array.isArray(key)) {
        return out[0];
    }

    // console.log('[onPluck]', out);
    return [SType.List, out];
}

function getStackValue(obj: any, key: string) {
    let val = Jsonpointer.get(obj, key);

    if (isStackValue(val)) { return val; }

    return isStackValue(val) ? val : [SType.Value, val];
}