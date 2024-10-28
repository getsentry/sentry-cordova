import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import ts from '@rollup/plugin-typescript';
import typescript from 'typescript';

const terserInstance = terser({
  mangle: {
    // Preserve public API methods from mangling
    reserved: ['captureException', 'captureMessage', 'sentryWrapped'],
    properties: {
      regex: /^_[^_]/, // Regex to match properties to mangle
    },
  },
});

const defaultPlugins = [
  ts({
    tsconfig: 'tsconfig.build.json',
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      module: 'ES2015', // Set module to ES2015
    },
  }),
  resolve({
    mainFields: ['module'], // Use module field for resolution
  }),
  commonjs(), // Enable CommonJS module resolution
];

const defaultMinPlugins = [...defaultPlugins, terserInstance]; // Include terser for minification

export default [
  {
    input: 'src/js/sentry-cordova.ts',
    output: {
      file: 'dist/js/sentry-cordova.bundle.min.js',
      format: 'cjs', // CommonJS format for output
      exports: 'named', // Named exports
      sourcemap: true, // Generate sourcemaps
    },
    plugins: defaultMinPlugins, // Use plugins with minification
  },
  {
    input: 'src/js/sentry-cordova.ts',
    output: {
      file: 'dist/js/sentry-cordova.bundle.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    plugins: defaultPlugins, // Use default plugins without minification
  },
];
