import Req from '@/lib/Req';
import { ResBody } from '@/types';

function dateHandler(dateStr: string) {
  if (!dateStr.match(/\s+[A-Za-z]+$/)) dateStr += ' GMT'
  return new Date(dateStr).getTime();
}

export default class Res {
  req: Req;
  body?: ResBody;

  constructor(req: Req, body?: ResBody) {
    this.req = req;
    this.body = body;
  }

  getStatusCode() {
    const conditions: { [key: string]: (req: Req) => boolean } = {
      404: (req) => req.method !== 'HEAD' && !this.body?.body,
      501: (req) => !['GET', 'HEAD', 'POST', 'PUT', 'DELETE'].includes(req.method),
      400: (req) => (
        (req.httpVersion === 1.1 && !req.headers.host) ||
          (req.httpVersion > 1.1 && (!req.headers.host && !req.path.match(/https?:\/\//)))
      ),
      304: (req) => {
        // Only send the resource if the file has been modified since given date
        const modSince = req.headers['if-modified-since'];
        if (!modSince || this.req.method !== 'GET') return false;
        const modSinceDate = dateHandler(modSince);
        if (isNaN(modSinceDate) || Date.now() < modSinceDate) return false;
        return (this.body?.lastModified || NaN) < modSinceDate;
      },
      412: (req) => {
        // Only send the resource if the file NOT been modified since given date
        const notModSince = req.headers['if-unmodified-since'];
        if (!notModSince) return false;
        const notModSinceDate = dateHandler(notModSince)
        if (isNaN(notModSinceDate) || Date.now() < notModSinceDate) return false;
        return (this.body?.lastModified || NaN) > notModSinceDate;
      }
    }
    
    return Number(
      Object.keys(conditions)
        .find(statusCode => conditions[statusCode](this.req))
    ) || 200;
  }

  // This returns a string that ends in \r\n
  getHeaders() {
    const headerObj: { [key: string]: string | number | undefined} = {
      'content-type': this.body?.type || undefined,
      'content-length': this.body?.size || undefined,
      'date': new Date().toUTCString(),
      'connection': 'close',
    }
    return Object.keys(headerObj).reduce((headers, key) => {
      return !headerObj[key] ? headers :
        headers + `${key}: ${headerObj[key]}\r\n`
    }, '')
  }

  sendBody() {
    return !!(this.body && this.getStatusCode() === 200 && this.req.method !== 'HEAD')
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
      Buffer.from(`${this.getStatusLine()}\r\n${this.getHeaders()}\r\n`),
      Buffer.from((this.body?.body && this.sendBody()) ? this.body.body : ''),
    ])
  }
}
