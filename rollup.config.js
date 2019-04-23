import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const terserInstance = terser({
  mangle: {
    // captureExceptions and captureMessage are public API methods and they don't need to be listed here
    // as mangler doesn't touch user-facing thing, however sentryWrapepd is not, and it would be mangled into a minified version.
    // We need those full names to correctly detect our internal frames for stripping.
    // I listed all of them here just for the clarity sake, as they are all used in the frames manipulation process.
    reserved: ['captureException', 'captureMessage', 'sentryWrapped'],
    properties: {
      regex: /^_[^_]/,
    },
  },
});

const defaultPlugins = [
  typescript({
    tsconfig: 'tsconfig.build.json',
    tsconfigOverride: {
      compilerOptions: {
        declaration: false,
        declarationMap: false,
        module: 'ES2015',
      },
    },
  }),
  resolve({
    mainFields: ['module'],
  }),
  commonjs(),
];

const defaultMinPlugins = [...defaultPlugins, terserInstance];

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
