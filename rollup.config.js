import ts from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import node from '@rollup/plugin-node-resolve';
import path from 'path';
import json from '@rollup/plugin-json';
import terser from 'rollup-plugin-terser';
import cjs from '@rollup/plugin-commonjs';
import { DEFAULT_EXTENSIONS } from '@babel/core';
export default [{
    input: path.resolve(__dirname, 'src', 'lib.ts'),
    plugins: [node({
            browser: true,
            preferBuiltins: false
        }), cjs({ sourceMap: true }), ts({
            tsconfig: path.resolve(__dirname, 'tsconfig.json'),
            useTsconfigDeclarationDir: false,
        }), json({ compact: true }), babel({
            presets: ['@babel/env', {
                exclude: [
                    // "transform-async-to-generator",
                    // "transform-regenerator",
                ]
            }],
            plugins: [

                "@babel/plugin-syntax-class-properties"
            ],
            extensions: [
                ...DEFAULT_EXTENSIONS,
                '.ts',
                '.tsx'
            ],
            babelHelpers: 'bundled'
        }),
        terser.terser({
            mangle: true,
        })
    ],
    external: [
        'buffer',
        'ws',
        'http',
        'https',
        'net', 
        'buffer',
        'crypto'
    ],


    output: [
        { file: "dist/libaria2.browser.esm.js", format: "es" },
        { file: "dist/libaria2.browser.cjs.js", format: "cjs" },
    ]
}, {
    input: path.resolve(__dirname, 'src', 'lib.ts'),
    plugins: [node({
            browser: false,
            "exportConditions": ["node"]
        }), cjs({ sourceMap: true }), ts({
            tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        }), json({ compact: true }), babel({
            presets: ['@babel/env', {
                exclude: [
                    // "transform-async-to-generator",
                    // "transform-regenerator",
                    
                ]
            }],
            plugins: [
                "@babel/plugin-syntax-class-properties"
            ],
            extensions: [
                ...DEFAULT_EXTENSIONS,
                '.ts',
                '.tsx'
            ],
            babelHelpers: 'bundled'
        }),
         terser.terser({
            mangle: true,
        }),

    ],
    external: [
        'buffer',
        'ws',
        'http',
        'https',
        'net',
        'buffer',
        'crypto',
        'events',
    ],
    output: [
        { file: "dist/libaria2.node.esm.js", format: "es" },
        { file: "dist/libaria2.node.cjs.js", format: "cjs" },
    ]
}]