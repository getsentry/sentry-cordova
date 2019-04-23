const PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;

/**
 *  Normalize url in stacktrace
 */
export function normalizeUrl(url: string, pathStripRe: RegExp): string {
  return `app://${url.replace(/^file\:\/\//, '').replace(pathStripRe, '')}`;
}

export function normalizeData(data: any): any {
  if (data.culprit) {
    data.culprit = normalizeUrl(data.culprit, PATH_STRIP_RE);
  }
  const stacktrace =
    data.stacktrace || (data.exception && data.exception.values && data.exception.values[0].stacktrace);
  if (stacktrace) {
    stacktrace.frames.forEach((frame: any) => {
      if (frame.filename !== '[native code]' && frame.filename !== '<anonymous>') {
        frame.filename = normalizeUrl(frame.filename, PATH_STRIP_RE);
      }
    });
  }
  return data;
}
