/* eslint-disable @typescript-eslint/no-unsafe-member-access */
const PATH_STRIP_RE = /^.*\/[^.]+(\.app|CodePush|.*(?=\/))/;
/**
 *  Normalize url in stacktrace
 */
export function normalizeUrl(url, pathStripRe) {
    return `app://${url.replace(/^file:\/\//, '').replace(pathStripRe, '')}`;
}
/**
 * Normalizes the stacktrace
 * @param data
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function normalizeData(data) {
    if (data.culprit) {
        data.culprit = normalizeUrl(data.culprit, PATH_STRIP_RE);
    }
    const stacktrace = data.stacktrace || (data.exception && data.exception.values && data.exception.values[0].stacktrace);
    if (stacktrace) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stacktrace.frames.forEach((frame) => {
            if (frame.filename !== '[native code]' && frame.filename !== '<anonymous>') {
                frame.filename = normalizeUrl(frame.filename, PATH_STRIP_RE);
            }
        });
    }
    return data;
}
//# sourceMappingURL=normalize.js.map