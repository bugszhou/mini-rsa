import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import builtins from '@joseph184/rollup-plugin-node-builtins';
import globals from "rollup-plugin-node-globals";
import { terser } from "rollup-plugin-terser";

export default {
  input: 'src/entry/index.js',
  output: [
    // umd模式，打包所有的依赖，可供浏览器直接使用
    {
      name: 'mini-rsa',
      file: 'dist/mini-rsa.dev.js',
      format: 'umd',
      sourcemap: true,
      strict: true,
      noConflict: true,
    },
    // umd模式，压缩后，打包所有的依赖，可供浏览器直接使用
    {
      name: 'mini-rsa',
      file: 'dist/mini-rsa.min.js',
      format: 'umd',
      sourcemap: true,
      strict: true,
      noConflict: true,
    },
  ],
  plugins: [
    json(),
    resolve(),
    commonjs(),
    globals(),
    builtins(),
    babel({
      configFile: path.resolve(__dirname, './src/entry/.babelrc'),
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    terser({
      include: [/^.+\.min\.js$/],
    }),
  ],
};
