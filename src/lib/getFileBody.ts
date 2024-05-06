import { ResBody } from '@/types';
import { BunFile } from 'bun';

export default async function getFileBody(content: string | BunFile, type?: string): Promise<ResBody> {
  const isStr = typeof(content) === 'string';
  const buf = isStr ? Buffer.from(content) : Buffer.from(await content.arrayBuffer());
  return {
    body: buf,
    size: buf.byteLength,
    type: type || (isStr ? 'text/plain' : content.type),
    lastModified: isStr ? Date.now() : content.lastModified,
  }
}
