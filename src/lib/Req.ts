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

    this.body = body || undefined;
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
  }
}
