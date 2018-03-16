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
    input: 'www/js/sentry-cordova.js',
    output: {
      file: 'www/js/sentry-cordova.bundle.min.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins: defaultMinPlugins,
  },
  {
    input: 'www/js/sentry-cordova.js',
    output: {
      file: 'www/js/sentry-cordova.bundle.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins: defaultPlugins,
  },
];
