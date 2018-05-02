import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import shim from 'rollup-plugin-shim';
import typescript from 'rollup-plugin-typescript2';

const defaultPlugins = [
  typescript({
    tsconfig: 'tsconfig.build.json',
    tsconfigOverride: { compilerOptions: { declaration: false } },
  }),
  resolve({
    jsnext: true,
    main: true,
    browser: true,
  }),
  commonjs(),
  shim({
    domain: `export var active = false;`,
  }),
];

const defaultMinPlugins = [
  typescript({
    tsconfig: 'tsconfig.build.json',
    tsconfigOverride: { compilerOptions: { declaration: false } },
  }),
  resolve({
    jsnext: true,
    main: true,
    browser: true,
  }),
  commonjs(),
  shim({
    domain: `export var active = false;`,
  }),
  uglify(),
];

export default [
  {
    input: 'src/js/sentry-cordova.ts',
    output: {
      file: 'dist/js/sentry-cordova.bundle.min.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    plugins: defaultMinPlugins,
  },
  {
    input: 'src/js/sentry-cordova.ts',
    output: {
      file: 'dist/js/sentry-cordova.bundle.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    plugins: defaultPlugins,
  },
];
