import * as fs from 'fs';

describe('JS conversion check', () => {
  test('Do not require @sentry/browser', () => {
    const content = fs.readFileSync('dist/js/sentry-cordova.bundle.js');
    // expect(content.toString().match(/^[^\*]*@sentry\/browser/gm)).toBeFalsy();
    expect(content.toString().match(/require\(/)).toBeFalsy();
  });
});
