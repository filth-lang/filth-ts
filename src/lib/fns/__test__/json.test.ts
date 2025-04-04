import { beforeEach, describe, expect, it, test } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';
import { createFilthJSON } from '@filth/fns/json';
import { createFilthList } from '@filth/helpers';
import { FilthExpr } from '@filth/types';

describe('Filth', () => {
  describe('JSON', () => {
    let env: EvalEnvironment;
    let testResult: FilthExpr[];

    beforeEach(() => {
      env = createEnv();
      env.define('tr', (...args: FilthExpr[]) => {
        testResult = args;
        return null;
      });
    });

    test.each([
      [`"filth"`, '"filth"'],

      [`{"lang": "filth"} "lang"`, createFilthList(['filth'])],

      [
        `{"lang": "filth"} {"isFilthy": true}`,
        createFilthJSON({ isFilthy: true, lang: 'filth' })
      ]
    ])('json %p should evalute to %p', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    it.skip('should perform json operations', async () => {
      await env.eval(`


        (get {"lang": "filth"} "lang")
        ; "filth"
        
        dehydrate { "state": "open" }
        ; ( "/state" "open" )

        has? { "milk": true, "butter": false } "milk"
        ; true

        has? { "milk": true, "butter": false } "bread"
        ; false
        

        + {} "milk"
        ; { "milk": null }

        + {} ( "milk" true )
        ; { "milk": true }

        + {} (( "milk" true ) ( "butter" false ))
        ; { "milk": true, "butter": false }
        

        + { "milk": true } ( "butter" false )
        ; { "milk": true, "butter": false }

        + { "milk": true } { "butter": false }
        ; { "milk": true, "butter": false }
        

        - { "milk": true } "milk"
        ; { }
        

        hydrate ( "/a/1/b" "single" )
        ; { "a": [null, { "b": "single" }] }

        dehydrate { "a": { "b": ["c","d"]}}
        ; ( "/a/b/0" "c" "/a/b/1" "d" )
         

        { "a": 4, "b": { "c": true }}
         
        ; transform <json> (from to)
        transform { "a": 4, "b": { "c": true }} ("/b/c" "/valid")
        ; { "a": 4, "valid": true }

        ; transform <json> (from to fn)
        transform { "a": 4 } ("/a" "/count", (fn (val) (* val 2 ) ) 
        ; { "a": 8 }

        to_s { "a": 4 }
        ; "{a: 4}"

        to_json "{a: 4}"
        ; { "a": 4 }
         
        `);

      expect(testResult[0]).toEqualFilthList(['state', 'open']);
    });
  });
});
