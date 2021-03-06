import ts from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import node from '@rollup/plugin-node-resolve';
import terser from 'rollup-plugin-terser';
import path from 'path';
import { DEFAULT_EXTENSIONS } from '@babel/core';
export default [{
    input: path.resolve(__dirname, 'src', 'lib.ts'),
    plugins: [node({
            browser: true,
        }), ts({
            tsconfig: path.resolve(__dirname, 'tsconfig.json')
        }), babel({
            presets: ['@babel/env', {
                exclude: [
                    "transform-async-to-generator",
                    "transform-regenerator",
                ]
            }],
            plugins: [
                // '@babel/transform-runtime'
            ],
            extensions: [
                ...DEFAULT_EXTENSIONS,
                '.ts',
                '.tsx'
            ],
            babelHelpers: 'bundled'
        }),
        terser.terser({
            mangle: false,
        })
    ],
    external: [
        'buffer',
        'ws',
        'http',
        'https',
        'net', 'buffer',
        'crypto'
    ],
    output: [
        { file: "dist/libaria2.browser.esm.prod.js", format: "es" },
        { file: "dist/libaria2.browser.cjs.prod.js", format: "cjs" },
    ]
}, {
    input: path.resolve(__dirname, 'src', 'lib.ts'),
    plugins: [node({
            browser: false,
            "exportConditions": ["node"]
        }), ts({
            tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        }), babel({
            presets: ['@babel/env', {
                exclude: [
                    "transform-async-to-generator",
                    "transform-regenerator",
                ]
            }],
            plugins: [
                // '@babel/transform-runtime'
            ],
            extensions: [
                ...DEFAULT_EXTENSIONS,
                '.ts',
                '.tsx'
            ],
            babelHelpers: 'bundled'
        }),
        terser.terser({
            mangle: false,
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
        { file: "dist/libaria2.node.esm.prod.js", format: "es" },
        { file: "dist/libaria2.node.cjs.prod.js", format: "cjs" },
    ]
}]