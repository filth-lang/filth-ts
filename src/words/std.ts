import { onAbs, onAdd, onAssertType, onBuildMap, onClear, onCompare, onDateTime, onDrop, onDup, onFetchList, onJoin, onListOpen, onMapOpen, onNip, onPop, onPrint, onPrintStack, onPush, onRegex, onRegexBuild, onRot, onSize, onSwap, onToString, onTuck, onUndefined, onUnexpectedError } from ".";
import { SType, WordSpec } from "../types";
import { onCondition, onLogicalOp } from "./cond";
import { onDefine, onFetchWord, onSee } from "./define";
import { onAddList, onConcat, onDiff, onFilter, onGather, onListEval, onListIndexOf, onListSpread, onMap, onReduce, onUnique } from "./list";
import { onDo, onLoop } from "./loop";
import { onPluck } from "./pluck";


export const stdWords: WordSpec[] = [

    // pattern match stack args
    ['[', onListOpen],
    ['{', onMapOpen],
    ['}', onUnexpectedError],
    [']', onUnexpectedError],

    // a defined value is evaled when pushed onto the stack
    ['define', onDefine, SType.Any, SType.Value],
    // a let or ! value is just pushed onto the stack
    ['let', onDefine, SType.Any, SType.Value],
    ['!', onDefine, SType.Any, SType.Value],
    ['see', onSee, SType.Value],


    ['eval', onRegex, SType.Any, SType.Regex],
    ['split', onRegex, SType.Value, SType.Regex],
    ['replace', onRegex, SType.Value, SType.Value, SType.Regex],
    ['==', onRegex, SType.Value, SType.Regex],
    ['!=', onRegex, SType.Value, SType.Regex],
    ['!r', onRegexBuild, SType.Value],

    ['==', onDateTime, SType.DateTime, SType.DateTime],
    ['!=', onDateTime, SType.DateTime, SType.DateTime],
    ['>', onDateTime, SType.DateTime, SType.DateTime],
    ['>=', onDateTime, SType.DateTime, SType.DateTime],
    ['<', onDateTime, SType.DateTime, SType.DateTime],
    ['<=', onDateTime, SType.DateTime, SType.DateTime],

    // important that this is after more specific case
    ['+', onAddList, SType.List, SType.Any],
    ['+', onAddList, SType.Any, SType.List],
    ['+', onAdd, SType.Value, SType.Value],
    ['-', onAdd, SType.Value, SType.Value],

    ['*', onAdd, SType.Value, SType.Value],
    ['/', onAdd, SType.Value, SType.Value],
    ['%', onAdd, SType.Value, SType.Value],
    ['mod', onAdd, SType.Value, SType.Value],
    ['==', onAdd, SType.Value, SType.Value],
    ['!=', onAdd, SType.Value, SType.Value],
    ['>', onAdd, SType.Value, SType.Value],
    ['>=', onAdd, SType.Value, SType.Value],
    ['<', onAdd, SType.Value, SType.Value],
    ['<=', onAdd, SType.Value, SType.Value],

    // ['max', 'js://Math/max'],
    // ['min', 'js://Math/min'],
    // ['abs', 'js://Math/abs'],
    ['max', onAdd, SType.Value, SType.Value],
    ['min', onAdd, SType.Value, SType.Value],
    ['abs', onAbs, SType.Value],
    ['negate', onAbs, SType.Value],


    ['==', onCompare, SType.Any, SType.Any],
    ['!=', onCompare, SType.Any, SType.Any],

    ['@', onFetchList, SType.List, SType.Value],
    ['@', onFetchWord, SType.Value],




    ['to_map', onBuildMap],
    ['to_str!', onToString],
    ['to_str', onToString],
    ['join', onJoin, SType.Value, SType.Value],
    ['join', onJoin, SType.List, SType.Value],
    ['drop', onDrop, SType.Any],
    ['swap', onSwap, SType.Any, SType.Any],
    ['push', onPush, SType.List, SType.Any],

    ['nip', onNip, SType.Any, SType.Any],
    ['tuck', onTuck, SType.Any, SType.Any],
    ['over', onDup, SType.Any],

    ['pop?', onPop, SType.List],
    ['pop!', onPop, SType.List],
    ['pop', onPop, SType.List],
    ['map', onMap, SType.List, SType.Value],
    ['map', onMap, SType.List, SType.List],
    ['pluck', onPluck, SType.Map, SType.Value],
    ['pluck', onPluck, SType.List, SType.Value],
    ['pluck', onPluck, SType.List, SType.List],
    ['pluck', onPluck, SType.Any, SType.Any],
    ['pluck!', onPluck, SType.Any, SType.Any],
    ['diff', onDiff, SType.Any, SType.Any],
    ['diff!', onDiff, SType.Any, SType.Any],
    ['intersect', onDiff, SType.Any, SType.Any],
    ['intersect!', onDiff, SType.Any, SType.Any],

    ['unique', onUnique, SType.List],
    ['filter', onFilter, SType.List, SType.Value],
    ['filter', onFilter, SType.List, SType.List],
    ['reduce', onReduce, SType.List, SType.Any, SType.Any],

    ['index_of', onListIndexOf, SType.List, SType.Value],
    ['index_of!', onListIndexOf, SType.List, SType.Value],

    ['gather', onGather],
    // ['concat', onConcat],
    ['concat', onConcat, SType.Any, SType.List],
    ['cls', onClear],
    ['dup', onDup, SType.Any],

    ['rot', onRot, SType.Any, SType.Any, SType.Any],
    ['spread', onListSpread, SType.List],

    ['eval', onListEval, SType.List],
    // ['cond', onCondition, SType.Any, SType.Any, SType.Any], // cond, if, else
    ['iif', onCondition, SType.Any, SType.Any, SType.Any], // cond, if, else
    ['if', onCondition, SType.Any, SType.Any],


    ['and', onLogicalOp, SType.Any, SType.Any],
    ['or', onLogicalOp, SType.Any, SType.Any],
    ['??', onLogicalOp, SType.Any, SType.Any],

    ['size!', onSize, SType.Any], // destructive (any -- int)
    ['size', onSize, SType.Any], // non destructive (any -- any int)
    ['loop', onLoop, SType.List],
    ['do', onDo, SType.List, SType.Value, SType.Value],
    ['?do', onDo, SType.List, SType.Value, SType.Value],

    ['undefined', onUndefined],

    ['assert_type', onAssertType],

    ['.', onPrint, SType.Any],
    ['.s', onPrint],
    ['..', onPrint],
    ['prints', onPrintStack],
];

// /**
//  * 
//  * @param stack 
//  */
// export function addStdLib(stack?: Filth) {

//     stack = stack ?? new Filth();

//     stack = stack.addWords();

//     return stack;
// }