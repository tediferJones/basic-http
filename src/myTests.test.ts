import { expect, test } from 'bun:test';
import Req from '@/lib/Req';
import Res from '@/lib/Res';
import router from '@/lib/router';
import { StrObj } from '@/types';

function getRes({ method, path, httpVersion, headers }: {
  method?: string,
  path?: string,
  httpVersion?: string,
  headers?: StrObj,
}) {
  return new Res(
    new Req(`\
${method || 'GET'} ${path || '/'} ${httpVersion || 'HTTP/1.0'}\
\r\n\
${Object.keys(headers || {}).reduce(
(str, key) => str + `${key}: ${headers?.[key]}`
, '')}`),
    router.match(path || '/')
  )
}

test('HTTP/1.0 GET with no headers', async () => {
  const res = getRes({ httpVersion: 'HTTP/1.0' })
  
  expect(res.getStatusCode()).toBe(200)
  expect(await res.body?.exists()).toBe(true)
  expect(res.sendBody()).toBe(true)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
});

test('HTTP/1.1 without Host header', () => {
  const res = getRes({ httpVersion: 'HTTP/1.1' })

  expect(res.getStatusCode()).toBe(400)
  expect(res.sendBody()).toBe(false)
  expect(res.getHeaders().includes('date: ')).toBe(true)

  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})

test('HTTP/1.1 with Host header', () => {
  const res = getRes({
    httpVersion: 'HTTP/1.1',
    headers: { host: 'localhost:3000' }
  });

  expect(res.getStatusCode()).toBe(200)
  expect(res.sendBody()).toBe(true)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})

test('Use absolute URL instead of host header', () => {
  const res = getRes({
    httpVersion: 'HTTP/1.2',
    path: 'https://localhost:3000/'
  })

  expect(res.getStatusCode()).toBe(200)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})

test('Head method', () => {
  const res = getRes({ method: 'HEAD' })

  expect(res.getStatusCode()).toBe(200)
  expect(res.sendBody()).toBe(false)

  expect(res.getHeaders().includes('date: ')).toBe(true)
  expect(res.getHeaders().includes('content-type: ')).toBe(true)
  expect(res.getHeaders().includes('content-length: ')).toBe(true)
})
