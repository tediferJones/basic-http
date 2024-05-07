// Refrences:
// Python Example: https://bhch.github.io/posts/2017/11/writing-an-http-server-from-scratch/
// Rust Example:   https://www.youtube.com/watch?v=7GBlCinu9yg
// Bun TCP Docs:   https://bun.sh/docs/api/tcp
// HTTP Docs:      https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages
// HTTP Basics:    https://www.jmarshall.com/easy/http/
//
// Curl Example:
// curl -i http://localhost:3000 -X POST -H 'content-type: text/plain' -d 'Request body goes here' -w '\n'
//
// HTTP 1.1 Requirements:
// Requests MUST include either a 'host' header or an absolute URL in the request line
//  - [ DONE ] Read over sections Requiring Host Header and Accepting Absolute URLs
//    - [ DONE ] If request is HTTP/1.1, it MUST include a 'host' header, otherwise return a '400 Bad Request' response
//    - [ DONE ] If request use HTTP version greater than 1.1, it must have either an absolute URL in request line or a host header
//  - [ DONE ] Needs to be able to recieve chunked requests
//  - Do we want to use persistent connections?
//      If Yes:
//        - Requests need to be processed in the same order they are recieved
//        - Use socket.write for each request until we reach a request with the header 'connection: close'
//          - Use socket.end to respond to this final request
//        - Close idle sockets, i.e. after 10 seconds of inactivity
//      Else: 
//        - [ DONE ] Every response should include the header 'connection: close' on every response
//  - [ DONE ] Implement '100 Continue' response
//    - [ DONE ] According to this (https://www.w3.org/Protocols/rfc2616/rfc2616-sec8.html#sec8.2.3)
//      [ DONE ] we should only send '100 Continue' res if the req has the header 'Expect: 100-continue'
//    - [ DONE ] Don't send '100 Continue' responses to any client using HTTP/1.0
//  - [ DONE ] Add date header to all responses, should look like this:
//      [ DONE ] Date: Fri, 31 Dec 1999 23:59:59 GMT
//      - [ DONE ] Reminder to be tolerant of non-GMT timezones (i.e. convert them to GMT)
//  - [ DONE ] Respect If-Modified-Since and If-Unmodified-Since headers
//    - [ DONE ] If-Modified-Since means 'Only send the resource if the file has been modified after given date'
//      - [ DONE ] If the resource has not been modified since the given date, return '304 Not Modified' with a 'date' header
//      - [ DONE ] This header is only used with GET requests
//    - [ DONE ] If-Unmodified-Since means 'If the resource has NOT been modified since the given date, return the resource'
//      - [ DONE ] If it has been modified since the given date, return '412 Precondition Failed'
//      - [ DONE ] This header can be used with any method, including GET
//    - [ DONE ] Dates for these headers can be sent in any of these formats
//        [ DONE ] If-Modified-Since:  Fri, 31 Dec 1999 23:59:59 GMT
//        [ DONE ] If-Modified-Since:  Friday, 31-Dec-99 23:59:59 GMT
//        [ DONE ] If-Modified-Since:  Fri Dec 31 23:59:59 1999
//    - [ DONE ] Reminder to be tolerant of non-GMT timezones (i.e. convert them to GMT)
//      - [ DONE ] new Date().getTime() is UNIX time which is in UTC which is the same as GMT
//    - [ DONE ] If date has a 2 digit year that seems to be more than 50 years in the future, treat it as tho it is from the past
//      - [ DONE ] This rule should apply to all uses of date with HTTP/1.1
//      - [ DONE ] THIS IS AUTOMAGICALLY TAKEN CARE OF BY CALLING new Date(dateStr)
//    - [ DONE ] If date is invalid or in the future, just ignore the header
//  - [ DONE ] Needs to support GET and HEAD methods
//    - [ DONE ] If request uses an unsupported method, return '501 Not Implemented' response
//  - [ DONE ] Be backwards compatible with HTTP/1.0
//    - [ DONE ] Dont require Host header
//    - [ DONE ] Dont send '100 Continue' Responses
//
// [ DONE ] Rename getFileBody func to getResBody
// [ DONE ] Should be able to assign custom headers to res using res.headers
// [ DONE ] Add method to req class to get cookies as a StrObj

import Req from '@/lib/Req';
import Res from '@/lib/Res';
import router from '@/lib/router';

console.log(router)
Bun.listen({
  hostname: 'localhost',
  port: 3000,
  socket: {
    async data(socket, data) {
      const req = new Req(data.toString());
      const method = req.method === 'HEAD' ? 'GET' : req.method;
      const res = new Res(req);
      console.log(req)
      console.log(req.getCookies())

      const matchV2 = router.match(req.path);
      const route = matchV2 ? (await import(matchV2.filePath))[method] : undefined;
      if (route) await route(req, res);

      socket.end(await res.getBytes())
    },
  }
})
