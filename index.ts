// Refrences:
// Python Example: https://bhch.github.io/posts/2017/11/writing-an-http-server-from-scratch/
// Rust Example:   https://www.youtube.com/watch?v=7GBlCinu9yg
// Bun TCP Docs:   https://bun.sh/docs/api/tcp
// HTTP Docs:      https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages
// HTTP Basics:    https://www.jmarshall.com/easy/http/

type Req = {
  method: string,
  path: string,
  httpVersion: string,
  headers: { [key: string]: string }
  body: string;
}

const formatHeader: { [key: string]: (str: string) => any } = {
  cookie: (str) => str.split('; ').reduce((cookies, rawCookie) => {
    const [ name, val ] = rawCookie.split('=')
    cookies[name] = val;
    return cookies
  }, {} as { [key: string]: string })
}

function getReqObj(data: string) {
  return data.split('\r\n')
    .filter(line => line) // An empty line indicates start of body, in both req and res
    .reduce((req, line) => {
      if (line.includes(': ')) {
        const [ key, val ] = line.split(': ')
        // req.headers[key] = val;
        req.headers[key] = formatHeader[key.toLowerCase()] ? formatHeader[key.toLowerCase()](val) : val;
      } else {
        const [ method, path, httpVersion ] = line.split(' ')
        req = { ...req, method, path, httpVersion }
      }

      return req
    }, { headers: {} } as Req)
}

Bun.listen({
  hostname: 'localhost',
  port: 3000,
  socket: {
    async data(socket, data) {
      const req = getReqObj(data.toString())
      console.log(req)

      // Get file from current directory based on path
      const resBody = '<h1>HelloWorld!</h1>'

      socket.end(`HTTP/1.1 200 OK\r\n\r\n${resBody}`)
    },
  }
})
