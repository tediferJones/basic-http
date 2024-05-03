import { BunFile, MatchedRoute } from 'bun';
// import { StrObj } from '@/types';
import Req from '@/lib/Req';

export default class Res {
  // httpVersion: string;
  status: number;
  // reason: string;
  // headers: StrObj;
  body?: BunFile;
  req: Req;

  constructor(req: Req, match: MatchedRoute | null) {
    const File = match ? Bun.file(match?.filePath) : undefined;
    const exists = File && File.exists();
    this.req = req;
    // this.httpVersion = 'HTTP/1.1';
    // this.status = exists ? 200 : 404;
    // this.reason = exists ? 'OK' : 'Not Found';
    this.body = exists ? File : undefined;
    this.status = this.getStatusCode();
    // this.headers = {
    //   'content-type': exists ? File.type : 'text/plain',
    //   'content-length': exists ? File.size.toString() : '0',
    // }
  }

  getStatusCode() {
    const req = this.req;
    if (!this.body) return 404;

    if (!['GET', 'HEAD'].includes(req.method)) {
      return 501
    }

    if (req.httpVersion > 1) {
      if (req.httpVersion === 1.1 && !req.headers.host) {
        console.log('is 1.1 and no host header')
        return 400;
      }
      if (req.httpVersion > 1.1 && (!req.headers.host && !req.path.match(/https?:\/\//))) {
        console.log('is greater than 1.1 and no host header or no absolute path')
        return 400;
      }
    }

    return 200;
  }

  // This returns a string that ends in \r\n
  getHeaders() {
    // return Object.keys(this.headers).reduce((headers, key) => {
    //   return headers + `${key}: ${this.headers[key]}\r\n`
    // }, '')
    const headerObj: { [key: string]: string | number | undefined} = {
      'content-type': this.body?.type || 'text/plain',
      'content-length': this.body?.size || 0,
      'date': new Date().toUTCString(),
      'connection': 'close',
    }
    return Object.keys(headerObj).reduce((headers, key) => {
      return !headerObj[key] ? headers :
        headers + `${key}: ${headerObj[key]}\r\n`
    }, '')
  }

  sendBody() {
    return !!(this.body && this.status === 200 && this.req.method !== 'HEAD')
  }

  getStatusLine() {
    const status = this.getStatusCode();
    const reason = {
      100: 'Continue',
      200: 'OK',
      304: 'Not Modified',
      400: 'Bad Request',
      404: 'Not Found',
      412: 'Precondition Failed',
      501: 'Not Implemented',
    }[status];

    return `HTTP/1.1 ${status} ${reason}`;
  }

  async getBytes() {
    return Buffer.concat([
      // Buffer.from(`HTTP/1.0 ${this.status} ${this.getReason()}\r\n${this.getHeaders()}\r\n`),
      Buffer.from(`${this.getStatusLine()}\r\n${this.getHeaders()}\r\n`),
      Buffer.from(this.sendBody() ? await this.body!.arrayBuffer() : new ArrayBuffer(0)),
    ])
  }
}
