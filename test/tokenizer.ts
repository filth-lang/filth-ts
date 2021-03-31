import assert from 'uvu/assert';
import { suite } from 'uvu';
import { tokenizeString } from '../src/tokenizer';

const test = suite('Tokenizer');


test('tokenizeString', () => {
    let cases = [
        ['[29]',
            [
                ['[', 0, 0],
                [29, 1, 0],
                [']', 3, 0],
            ]],
        ['[29] 30',
            [
                ['[', 0, 0],
                [29, 1, 0],
                [']', 3, 0],
                [30, 5, 0],
            ]],
        ['[29,+] 30',
            [
                ['[', 0, 0],
                [29, 1, 0],
                ['+', 4, 0],
                [']', 5, 0],
                [30, 7, 0],
            ]],
        [`"get out of bed"`,
            [
                ['get out of bed', 0, 0]
            ]],
        [`{"name":"Completed","uri":"/component/completed","properties":[{"name":"isComplete","type":"boolean"}]} !d`,
            [
                ["{", 0, 0],
                ["name", 1, 0],
                ["Completed", 8, 0],
                ["uri", 20, 0],
                ["/component/completed", 26, 0],
                ["properties", 49, 0],
                ["[", 62, 0],
                ["{", 63, 0],
                ["name", 64, 0],
                ["isComplete", 71, 0],
                ["type", 84, 0],
                ["boolean", 91, 0],
                ["}", 100, 0],
                ["]", 101, 0],
                ["}", 102, 0],
                ["!d", 104, 0],
            ]],
        [`~d|2020-06-04T06:38:12.261Z|`,
            [
                ['~d|2020-06-04T06:38:12.261Z|', 0, 0]
            ]],
        [`"file:///test/fixtures/rootA/static/"`,
            [
                ['file:///test/fixtures/rootA/static/', 0, 0]
            ]],
        [`{
            md:
                '''
                First line.
                Second line.
                  This line is indented by two spaces.
                '''
            }`,
            [
                ['{', 0, 0],
                ['md', 14, 1],
                [
                    'First line.\nSecond line.\n  This line is indented by two spaces.\n',
                    34,
                    6
                ],
                ['}', 182, 7]
            ]],
        [
            `{
                # TL;DR
                human:   Hjson
                machine: JSON
            }`,
            [
                ['{', 0, 0],
                ['human', 42, 2],
                ['Hjson', 51, 2],
                ['machine', 73, 3],
                ['JSON', 82, 3],
                ['}', 99, 4]
            ]
        ],
        [
            `{ 'name':'finn' }`,
            [
                ["{", 0, 0],
                ["name", 3, 0],
                ["finn", 10, 0],
                ["}", 16, 0],
            ]
        ],
        [
            `[ "oh cheese" '' size! ]`,
            [
                ["[", 0, 0],
                ["oh cheese", 2, 0],
                ["", 14, 0],
                ["size!", 17, 0],
                ["]", 23, 0],
            ]
        ]
    ];

    cases.forEach(([input, expected]) => {
        let output = tokenizeString(input as string);
        // console.log(input, output);
        assert.equal(output, expected as []);

    });

});


test.run();