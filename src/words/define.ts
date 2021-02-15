import { StackValue, InstResult, AsyncInstResult, SType } from "../types";
import { Filth } from "../";
import { isString } from "@odgn/utils";


/**
 * define and let words
 * 
 * a define value will be evaluated when it is pushed onto the stack
 * 
 * a let value will just be pushed onto the stack
 * 
 * @param stack 
 * @param param1 
 */
export function onDefine(stack: Filth, [, op]: StackValue): InstResult {
    let wordFn;
    let wordVal = stack.pop();
    
    let [valType,value] = stack.pop();
    let [, word] = wordVal;
    
    const isDefine = op === 'define';

    if (valType === SType.List && isDefine ) {
        wordFn = [SType.Word,value];
    } else if( isString(value) ){
        // parseUri(value);
    
    } else {
        wordFn = [valType,value];
    }

    if( isDefine ){
        stack.addWords([ [word, wordFn] ]);
    } else {
        stack.addUDWord(word, wordFn);
    }

    return undefined;
};
