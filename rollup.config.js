import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';

const defaultPlugins = [
  resolve({
    jsnext: true,
    main: true,
    browser: true,
  }),
  commonjs(),
];

const defaultMinPlugins = [
  resolve({
    jsnext: true,
    main: true,
    browser: true,
  }),
  commonjs(),
  uglify(),
];

export default [
  {
    input: 'dist/js/sentry-cordova.js',
    output: {
      file: 'dist/js/sentry-cordova.bundle.min.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins: defaultMinPlugins,
  },
  {
    input: 'dist/js/sentry-cordova.js',
    output: {
      file: 'dist/js/sentry-cordova.bundle.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins: defaultPlugins,
  },
];
