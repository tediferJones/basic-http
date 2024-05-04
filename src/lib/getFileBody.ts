export default async function getFileBody(path: string) {
  const File = Bun.file(path)
  return {
    body: Buffer.from(await File.arrayBuffer()),
    size: File.size,
    type: File.type,
  }
}
