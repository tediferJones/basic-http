// Refrences:
// Python Example: https://bhch.github.io/posts/2017/11/writing-an-http-server-from-scratch/
// Rust Example:   https://www.youtube.com/watch?v=7GBlCinu9yg
// Bun TCP Docs:   https://bun.sh/docs/api/tcp
// HTTP Docs:      https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages
// HTTP Basics:    https://www.jmarshall.com/easy/http/
//
// Curl Example:
// curl http://localhost:3000 -X POST -H 'content-type: text/plain' -d 'Request body goes here' -w '\n'
//
// NOTES:
// [ DONE ] All lines in head should end in \r\n, but could end with just \n
// [ DONE ] All lines in head can have an arbitrary number of tabs/spaces between them
//  - [ DONE ] This request line is still valid:
//    [ DONE ]   'GET       /myPath       HTTP/1.0'
//  - [ DONE ] This header is also still valid:
//    [ DONE ]   'cookie:      cookieName=cookieValue'
// [ DONE ] If a header line starts with a tab or a space, then it belongs to a previous header key
// [ DONE ] Header names should NOT be case-sensitive, we'll probably make them all lowercase
// If there is a body in either a request or response, includes the following headers:
//  - content-type: MIME type, i.e. 'application/json' or 'text/html'
//  - content-length: The length of the body content in bytes
// We probably want to be able to handle the following methods: GET, POST, PUT, DELETE, HEAD

type StrObj = { [key: string]: string }

class Req {
  method: string;
  path: string;
  httpVersion: string;
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
    this.httpVersion = httpVersion;
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

class Res {
  httpVersion: string;
  status: number;
  reason: string;
  filePath?: string;
  headers: StrObj;

  constructor(req: Req) {
    const match = router.match(req.path)
    this.httpVersion = 'HTTP/1.0';
    this.status = match ? 200 : 404;
    this.reason = match ? 'OK' : 'Not Found';
    this.filePath = match?.filePath
    console.log(req.path)
    this.headers = {
      'content-type': match ? Bun.file(match.filePath).type : 'text/plain',
      // 'content-length': match ? Bun.file(match.filePath).size.toString() : '0',
    }
  }

  getHeaders() {
    return Object.keys(this.headers).reduce((headers, key) => {
      return headers + `${key}: ${this.headers[key]}\r\n`
    }, '')
  }

  async getText() {
    const body = this.filePath ? await Bun.file(this.filePath).text() : '';
    // if (this.filePath && this.filePath.match(/\.ico$/)) {
    //   const arrBuf = await Bun.file(this.filePath).arrayBuffer()
    //   console.log(arrBuf)
    //   const base64Enc = Buffer.from(arrBuf).toString('base64')
    //   console.log(base64Enc)
    //   const body = base64Enc
    //   return `HTTP/1.0 ${this.status} ${this.reason}\r\n${this.getHeaders()}\r\n${body}`
    // }
    return `HTTP/1.0 ${this.status} ${this.reason}\r\n${this.getHeaders()}\r\n${body}`
  }
}

const router = new Bun.FileSystemRouter({
  dir: './src',
  style: 'nextjs',
  fileExtensions: ['.js', '.css', '.ico', '.html'],
  origin: 'localhost:3000'
});
console.log(router)

Bun.listen({
  hostname: 'localhost',
  port: 3000,
  socket: {
    async data(socket, data) {
      // const req = new Req(data.toString());
      // socket.end(await (new Res(req)).getText())
      socket.end(
        await new Res(
          new Req(data.toString())
        ).getText()
      )
    },
  }
})

// type ResProps = [number, string, string | undefined]
// OLD WORKING RES CLASS
// body?: string;
// constructor(status: number, reason: string, body?: string) {
//   this.httpVersion = 'HTTP/1.0';
//   this.status = status;
//   this.reason = reason;
//   this.body = body;
// }
// getText() {
//   return `${this.httpVersion} ${this.status} ${this.reason}\r\n\r\n${this.body || ''}`
// }

// fileExtensions: Object.keys(getDirFromSuffex),

// const getDirFromSuffex: { [key: string]: string } = {
//   '.js': '/scripts',
//   '.css': '/styles',
//   '.ico': '/favicon',
//   '.html': '/pages',
// }

// OLD WORKING, restore /src using notes/old-src
// const suffex = req.path.match(/\.\w+/)?.[0];
// const dir = getDirFromSuffex[suffex || '.html'];
// const file = req.path === '/' ? '/index' : req.path;
// const fileType = suffex ? '' : '.html';

// console.log(req.path, '->', `./src${dir}${file}${fileType}`);

// const resBody = Bun.file(`./src${dir}${file}${fileType}`);

// const match = router.match(req.path)
// console.log(req.path, 'ROUTER MATCH', match)
// const resBody = Bun.file(match?.filePath || 'fakeFile')
// const resProps: ResProps = (
//   await resBody.exists() ?
//     [200, 'OK', await resBody.text()] :
//     [404, 'Not Found', undefined]
// );
// socket.end(new Res(...resProps).getText());
