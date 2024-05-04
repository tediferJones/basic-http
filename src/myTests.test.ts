import { expect, test } from 'bun:test';
import Req from '@/lib/Req';
import Res from '@/lib/Res';
import router from '@/lib/router';
import { StrObj } from '@/types';

async function getRes({ method, path, httpVersion, headers }: {
  method?: string,
  path?: string,
  httpVersion?: string,
  headers?: StrObj,
}) {
  const matchV2 = router.match(path || '/')
  const req = new Req(`\
${method || 'GET'} ${path || '/'} ${httpVersion || 'HTTP/1.0'}\
\r\n\
${Object.keys(headers || {}).reduce(
(str, key) => str + `${key}: ${headers?.[key]}`
, '')}`);
  const res = new Res(req);
  const methodV2 = req.method === 'HEAD' ? 'GET' : req.method;
  const route = matchV2 ? (await import(matchV2.filePath))[methodV2] : undefined;
  if (route) await route(req, res);
  return res;
}

test('HTTP/1.0 GET with no headers', async () => {
  const res = await getRes({ httpVersion: 'HTTP/1.0' })
  
  expect(res.getStatusCode()).toBe(200)
  expect(!!res.body?.body).toBeTrue()
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
