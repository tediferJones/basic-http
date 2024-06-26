import Req from '@/lib/Req';
import { HeaderObj, ResBody, StrObj } from '@/types';

export default class Res {
  req: Req;
  routeExists: boolean;
  body?: ResBody;
  headers?: StrObj;

  constructor(req: Req, routeExists: boolean) {
    this.req = req;
    this.routeExists = routeExists;
  }

  getStatusCode() {
    function dateHandler(dateStr: string) {
      if (!dateStr.match(/\s+[A-Za-z]+$/)) dateStr += ' GMT'
      return new Date(dateStr).getTime();
    }

    const conditions: { [key: string]: (req: Req) => boolean } = {
      404: () => !this.routeExists,
      501: (req) => !['GET', 'HEAD', 'POST', 'PUT', 'DELETE'].includes(req.method),
      400: (req) => (
        (req.httpVersion === 1.1 && !req.headers.host) ||
          (req.httpVersion > 1.1 && (!req.headers.host && !req.path.match(/^https?:\/\//)))
      ),
      304: (req) => {
        // Only send the resource if the file has been modified since given date
        const modSince = req.headers['if-modified-since'];
        if (!modSince || this.req.method !== 'GET') return false;
        const modSinceDate = dateHandler(modSince);
        if (isNaN(modSinceDate) || Date.now() < modSinceDate) return false;
        return (this.body?.lastModified || NaN) < modSinceDate; },
      412: (req) => {
        // Only send the resource if the file NOT been modified since given date
        const notModSince = req.headers['if-unmodified-since'];
        if (!notModSince) return false;
        const notModSinceDate = dateHandler(notModSince)
        if (isNaN(notModSinceDate) || Date.now() < notModSinceDate) return false;
        return (this.body?.lastModified || NaN) > notModSinceDate;
      },
      100: (req) => req.httpVersion > 1 && req.headers['expect'] === '100-continue',
    }
    
    return Number(
      Object.keys(conditions)
        .find(statusCode => conditions[statusCode](this.req))
    ) || 200;
  }

  // This returns a string that ends in \r\n
  getHeaders() {
    function toStr(obj?: HeaderObj) {
      if (!obj) return '';
      return Object.keys(obj).reduce((headers, key) => {
        return !obj[key] ? headers : headers + `${key}: ${obj[key]}\r\n`
      }, '')
    }

    const headerObj: HeaderObj = {
      'content-type': this.body?.type || undefined,
      'content-length': this.body?.size || undefined,
      'date': new Date().toUTCString(),
      'connection': 'close',
    }

    return toStr(headerObj) + toStr(this.headers);
  }

  sendBody() {
    return !!(this.body && this.getStatusCode() === 200 && this.req.method !== 'HEAD');
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

  getBytes() {
    return Buffer.concat([
      Buffer.from(`${this.getStatusLine()}\r\n${this.getHeaders()}\r\n`),
      Buffer.from((this.body?.content && this.sendBody()) ? this.body.content : ''),
    ])
  }
}
