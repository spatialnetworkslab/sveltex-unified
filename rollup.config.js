import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import json from '@rollup/plugin-json'
import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    // external: [],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      resolve({ preferBuiltins: true }),
      commonjs(),
      json(),
      babel({
        exclude: ['node_modules/**']
      })
    ]
  }
]
