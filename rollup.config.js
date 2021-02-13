import Path from 'path';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import NodeResolve from '@rollup/plugin-node-resolve';
import Replace from '@rollup/plugin-replace';
import CommonJS from '@rollup/plugin-commonjs';


const environment = process.env.NODE_ENV || 'development';
const jsEnv = process.env.JS_ENV || 'browser';
const isProduction = false //environment === 'production';

const tsconfigOverride = {
    compilerOptions: { module: "es2015" }
};



// note: terser does not handle ts classes seemingly
// [!] (plugin terser) TypeError: Cannot read property 'references' of undefined
const compress = {
    defaults: false,
    arrows: true,
    booleans: true,
    collapse_vars: false, // <- this causes the typeerror!
    comparisons: true,
    computed_props: true,
    conditionals: true,
    dead_code: true,
    directives: true,
    // drop_console: true,
    drop_debugger: true,
    evaluate: true,
    hoist_props: true,
    if_return: true,
    inline: true,
    join_vars: true,
    keep_classnames: true,
    keep_fargs: true,
    keep_fnames: false,
    loops: true,
    module: true,
    negate_iife: true,
    properties: true,
    reduce_vars: true,
    sequences: true,
    side_effects: true,
    switches: true,
    toplevel: true,
    typeofs: true,
    unused: true,
    warnings: true
};

const config = {
    preserveModules: false, // or `false` to bundle as a single file
    input: ['src/index.ts'],
    output: [{ dir: 'dist', format: 'esm', esModule: true, entryFileNames: '[name].mjs' }],
    external: ['jsonpointer'],
    plugins: [],
};

// let output = {
//     format,
//     esModule: format === 'cjs' ? false : true,
//     sourcemap: true,
//     globals
// }

function build({ dir = 'dist', format = 'esm', input, output: outputFile = 'index.ts', minify = false, ext = "js" }) {
    const minifierSuffix = minify ? ".min" : "";

    let globals = [];

    ext = format === 'esm' ? 'mjs' : 'cjs';

    let output = {
        format,
        esModule: format === 'cjs' ? false : true,
        sourcemap: true,
        globals
    };

    if (typeof input === 'string') {
        const base = Path.basename(outputFile || input).replace(/\.[^/.]+$/, "");

        output = {
            ...output,
            name: 'filth',
            file: `${dir}/${base}.${format}${minifierSuffix}.${ext}`
        }
    } else {
        const entryFileNames = `[name]${minifierSuffix}.${ext}`;
        const chunkFileNames = `[name]-[hash]${minifierSuffix}.${ext}`
        output = {
            ...output,
            name: "filth",
            dir: `${dir}/${format}/`,
            entryFileNames,
            chunkFileNames,
        };
    }

    return {
        ...config,
        input,
        output,
        plugins: [
            Replace({ 'process.env.NODE_ENV': JSON.stringify(environment) }),
            Replace({ 'process.env.JS_ENV': JSON.stringify(jsEnv) }),
            NodeResolve({ browser: true, preferBuiltins: false }),
            typescript({ tsconfig: './tsconfig.json', tsconfigOverride }),
            minify ? terser({ compress, mangle: true }) : undefined,
        ].filter(Boolean)
    }

    return output;
}


export default [
    {
        ...config,
        input: 'src/index.ts',
        output: 'index.mjs',
        format: 'esm',
        minify: false
        // output: [{ dir: 'dist', format: 'esm', esModule: true, entryFileNames: '[name].mjs' }]
    },
    // {
    //     ...config,
    //     output: [{ dir: 'dist', format: 'cjs', esModule: false, entryFileNames: '[name].js' }]
    // }
].map(build);
