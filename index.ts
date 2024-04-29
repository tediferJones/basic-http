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
//  - This request line is still valid:
//      'GET       /myPath       HTTP/1.0'
//  - This header is also still valid:
//      'cookie:      cookieName=cookieValue'
// If a header line starts with a tab or a space, then it belongs to a previous header key
// Header names should NOT be case-sensitive, we'll probably make them all lowercase
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

Bun.listen({
  hostname: 'localhost',
  port: 3000,
  socket: {
    async data(socket, data) {
      const req = new Req(data.toString());
      console.log(req);

      // Get file from current directory based on path
      const resBody = `
        <!doctype html>
        <html>
          <body>
            <h1>Hello World!</h1>
          </body>
        </html>
      `

      socket.end(`HTTP/1.1 200 OK\r\n\r\n${resBody}`)
    },
  }
})

// type Req = {
//   method: string,
//   path: string,
//   httpVersion: string,
//   headers: { [key: string]: string }
//   body?: string;
// }

// const formatHeader: { [key: string]: (str: string) => any } = {
//   cookie: (str) => str.split('; ').reduce((cookies, rawCookie) => {
//     const [ name, val ] = rawCookie.split('=')
//     cookies[name] = val;
//     return cookies
//   }, {} as { [key: string]: string })
// }

// function getReqObj(data: string) {
//   return data.split('\r\n')
//     .filter(line => line) // An empty line indicates start of body, in both req and res
//     .reduce((req, line) => {
//       if (line.includes(': ')) {
//         const [ key, val ] = line.split(': ')
//         req.headers[key] = val;
//         // req.headers[key] = formatHeader[key.toLowerCase()] ? formatHeader[key.toLowerCase()](val) : val;
//       } else {
//         const [ method, path, httpVersion ] = line.split(' ')
//         req = { ...req, method, path, httpVersion }
//       }
// 
//       return req
//     }, { headers: {} } as Req)
// }


