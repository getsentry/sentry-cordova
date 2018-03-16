import * as fs from 'fs';
import * as path from 'path';

describe('JS conversion check', () => {
  test('Do not require @sentry/browser', () => {
    const content = fs.readFileSync('www/js/sentry-cordova.bundle.js');
    expect(content.toString().match(/^[^\*]*@sentry\/browser/gm)).toBeFalsy();
  });
});
