import { BunFile, MatchedRoute } from 'bun';
import { StrObj } from '@/types';
import Req from '@/lib/Req';

export default class Res {
  httpVersion: string;
  status: number;
  reason: string;
  headers: StrObj;
  body?: BunFile;

  constructor(req: Req, match: MatchedRoute | null) {
    console.log(req.path, '->', match?.filePath);
    const File = match ? Bun.file(match?.filePath) : undefined;
    const exists = File && File.exists();
    this.httpVersion = 'HTTP/1.0';
    this.status = exists ? 200 : 404;
    this.reason = exists ? 'OK' : 'Not Found';
    this.body = exists ? File : undefined;
    this.headers = {
      'content-type': exists ? File.type : 'text/plain',
      'content-length': exists ? File.size.toString() : '0',
    }
  }

  getHeaders() {
    return Object.keys(this.headers).reduce((headers, key) => {
      return headers + `${key}: ${this.headers[key]}\r\n`
    }, '')
  }

  async getBytes() {
    return Buffer.concat([
      Buffer.from(`HTTP/1.0 ${this.status} ${this.reason}\r\n${this.getHeaders()}\r\n`),
      Buffer.from(this.body ? await this.body.arrayBuffer() : new ArrayBuffer(0))
    ])
  }
}
