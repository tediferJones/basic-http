import { StrObj } from '@/types';

export default class Req {
  method: string;
  path: string;
  httpVersion: number;
  headers: StrObj; 
  body?: string;

  constructor(req: string) {
    const [ head, body ] = req.split(/\r?\n\r?\n/);
    const [ reqLine, ...headers ] = head.split(/\r?\n/);
    const [ method, path, httpVersion ] = reqLine.split(/[ \t]+/);
    let currentKey: string;

    this.method = method;
    this.path = path;
    this.httpVersion = Number(httpVersion.match(/\d+\.\d+$/)![0]);
    this.headers = headers.reduce((headers, line) => {
      // If line starts with some combination of tabs and spaces, then this value belongs to the previous key, 
      if (line.match(/^[\t ]+/)) {
        headers[currentKey] = headers[currentKey] + line.trim();
      } else {
        const [ key, val ] = line.split(/:[ \t]+/);
        currentKey = key.toLowerCase();
        headers[currentKey] = val;
      }
      return headers
    }, {} as StrObj);

    if (this.headers['transfer-encoding'] === 'chunked') {
      let length = 0;
      let doneWithChunks = false;
      let fullBody = '';
      const split = body.split(/\r?\n/).filter(line => line);
      split.forEach((line, i) => {
        if (doneWithChunks) {
          const [key, value] = line.split(/:\s+/);
          return this.headers[key] = value;
        }

        if (line === '0') return doneWithChunks = true;
        const isBody = Boolean(i % 2);
        if (isBody) return fullBody += line;

        const [ lineLength ] = line.split(';');
        return length += Number('0x' + lineLength);
      })
      this.headers['content-length'] = length.toString();
      this.body = fullBody;
    } else {
      this.body = body || undefined;
    }
  }

  getCookies() {
    return this.headers.cookie?.split(/; /).reduce((obj, cookie) => {
      const [key, val] = cookie.split('=');
      obj[key] = val;
      return obj
    }, {} as StrObj)
  }
}
