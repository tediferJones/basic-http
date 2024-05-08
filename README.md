# basic-http

This project should reach the bare minimum requirements for a HTTP/1.1 server,
as specified [here](https://www.jmarshall.com/easy/http/)

For more in-depth information on the HTTP/1.1 spec check [RFC2616](https://www.w3.org/Protocols/rfc2616/rfc2616.html)

- Provides simple file based routing, new routes can be created by creating a file
  inside of the src/routes/ folder and exporting functions that are named according
  the desired HTTP method.
- The server does not support persistent connections, so every response will include
  the 'connection: close' header
- Created custom classes to handle parsing requests and building responses
- Uses Bun's file router to prevent requests from accessing files they shouldn't

This project was created simply to learn a little more about how HTTP servers work,
it should not be considered secure, although some very basic security precautions
have been taken.
