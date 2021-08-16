import * as fs from 'fs';

describe('JS conversion check', () => {
  test('Do not require @sentry/browser', () => {
    const content = fs.readFileSync('dist/js/sentry-cordova.bundle.js');
    // expect(content.toString().match(/^[^\*]*@sentry\/browser/gm)).toBeFalsy();
    expect(content.toString().match(/ require\(/)).toBeFalsy();
  });

  test('Check required JS file for native build', () => {

    const jsExists = fs.existsSync('dist/js/sentry-cordova.bundle.min.js');
    expect(jsExists).toBeTruthy();
  });

  test('Check required source map file for native build', () => {
    const sourceMapExists = fs.existsSync('dist/js/sentry-cordova.bundle.min.js.map');
    expect(sourceMapExists).toBeTruthy();
  });
});
