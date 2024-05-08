import { expect, test } from 'bun:test';
import Req from '@/lib/Req';
import Res from '@/lib/Res';
import router from '@/lib/router';
import { StrObj } from '@/types';

async function getRes({ method, path, httpVersion, headers, body }: {
  method?: string,
  path?: string,
  httpVersion?: string,
  headers?: StrObj,
  body?: string,
}) {
  const match = router.match(path || '/')
  const reqHeaders = Object.keys(headers || {}).reduce((str, key) => {
    return str + `${key}: ${headers?.[key]}\r\n`
  }, '')
  const req = new Req(
    `${method || 'GET'} ${path || '/'} ${httpVersion || 'HTTP/1.0'}\r\n` +
      `${reqHeaders}\r\n${body}`
  )
  const methodV2 = req.method === 'HEAD' ? 'GET' : req.method;
  const route = match ? (await import(match.filePath))[methodV2] : undefined;
  const res = new Res(req, !!route);
  if (route) await route(req, res);
  return res;
}

test('HTTP/1.0 GET with no headers', async () => {
  const res = await getRes({ httpVersion: 'HTTP/1.0' })
  
  expect(res.getStatusCode()).toBe(200)
  expect(!!res.body?.content).toBeTrue()
  expect(res.sendBody()).toBe(true)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
});

test('HTTP/1.1 without Host header', async () => {
  const res = await getRes({ httpVersion: 'HTTP/1.1' })

  expect(res.getStatusCode()).toBe(400)
  expect(res.sendBody()).toBe(false)
  expect(res.getHeaders().includes('date: ')).toBe(true)

  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})

test('HTTP/1.1 with Host header', async () => {
  const res = await getRes({
    httpVersion: 'HTTP/1.1',
    headers: { host: 'localhost:3000' }
  });

  expect(res.getStatusCode()).toBe(200)
  expect(res.sendBody()).toBe(true)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})

test('Use absolute URL instead of host header', async () => {
  const res = await getRes({
    httpVersion: 'HTTP/1.2',
    path: 'https://localhost:3000/'
  })

  expect(res.getStatusCode()).toBe(200)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})

test('Head method', async () => {
  const res = await getRes({ method: 'HEAD' })

  expect(res.getStatusCode()).toBe(200)
  expect(res.sendBody()).toBe(false)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})

test('Non existent route', async () => {
  const res = await getRes({ path: '/this/fake/route' })

  expect(res.getStatusCode()).toBe(404);
  expect(res.getHeaders().includes('content-type: ')).toBe(false)
  expect(res.getHeaders().includes('content-length: ')).toBe(false)
  expect(res.sendBody()).toBe(false)
})

test('Respects all formats of if-modified-since header', async () => {
  // Test dates in the past
  await Promise.all(
    [
      'Fri, 31 Dec 1999 23:59:59 GMT',
      'Friday, 31-Dec-99 23:59:59 GMT',
      'Fri Dec 31 23:59:59 1999'
    ].map(async dateStr => {
        const res = await getRes({ headers: { 'If-Modified-Since': dateStr } })
        expect(res.getStatusCode()).toBe(200)
        expect(res.sendBody()).toBe(true)
      })
  )

  // Test current date
  const res = await getRes({ headers: { 'If-Modified-Since': new Date().toString() } })
  expect(res.getStatusCode()).toBe(304)
  expect(res.sendBody()).toBe(false)
})

test('Respects all formats of if-unmodified-since header', async () => {
  // Test dates in the past
  await Promise.all(
    [
      'Fri, 31 Dec 1999 23:59:59 GMT',
      'Friday, 31-Dec-99 23:59:59 GMT',
      'Fri Dec 31 23:59:59 1999'
    ].map(async dateStr => {
        const res = await getRes({ headers: { 'If-Unmodified-Since': dateStr } })
        expect(res.getStatusCode()).toBe(412)
        expect(res.sendBody()).toBe(false)
      })
  )

  // Test current date
  const res = await getRes({ headers: { 'If-Unmodified-Since': new Date().toString() } })
  expect(res.getStatusCode()).toBe(200);
  expect(res.sendBody()).toBe(true);
})

test('Accepts chunked requests', async () => {
  const res = await getRes({
    headers: { 'Transfer-Encoding': 'chunked' },
    body: (
      '1a; ignore-stuff-here\r\n' +
        'abcdefghijklmnopqrstuvwxyz\r\n' +
        '10\r\n' +
        '1234567890abcdef\r\n' +
        '0\r\n' +
        'some-footer: some-value\r\n' + 
        'another-footer: another-value\r\n' + 
        '\r\n'
    )
  })

  expect(res.req.headers['some-footer']).toBe('some-value')
  expect(res.req.headers['another-footer']).toBe('another-value')
  expect(res.req.headers['content-length']).toBe('42')
  expect(res.req.body).toBe('abcdefghijklmnopqrstuvwxyz1234567890abcdef')
})

test('Respects 100-continue header', async () => {
  const res = await getRes({
    headers: { 'Expect': '100-continue' }
  })
  expect(res.getStatusCode()).toBe(200)

  const resV2 = await getRes({
    headers: { 'Expect': '100-continue' },
    httpVersion: 'HTTP/1.1',
  })
  expect(resV2.getStatusCode()).toBe(100)
})

test('Add headers to response', async () => {
  const res = await getRes({});
  res.headers = { 'test-header': 'test-value' }
  expect(res.getHeaders().includes('test-header: test-value')).toBe(true)
})
