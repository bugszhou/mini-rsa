import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import { terser } from "rollup-plugin-terser";

export default {
  external: ['assert', 'buffer', 'constants', 'create-hash'],
  input: 'src/entry/index.js',
  output: [
    // umd，第三方依赖未打包
    {
      name: 'mini-rsa',
      file: 'dist/mini-rsa.js',
      format: 'umd',
      sourcemap: true,
      strict: true,
      noConflict: true,
    },
    // umd压缩后，第三方依赖未打包
    {
      name: 'mini-rsa',
      file: 'dist/mini-rsa.common.js',
      format: 'umd',
      sourcemap: true,
      strict: true,
      noConflict: true,
    },
    // 使用es6 import语法
    {
      file: 'dist/mini-rsa.esm.js',
      format: 'es',
      sourcemap: true,
      strict: true,
    },
  ],
  plugins: [
    json(),
    builtins(),
    resolve(),
    commonjs(),
    babel({
      configFile: path.resolve(__dirname, './src/entry/.babelrc'),
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    terser({
      include: [/^.+\.common\.js$/],
    }),
  ],
};
