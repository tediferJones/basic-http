type StrObj = { [key: string]: string }

type ResBody = {
  body: Buffer,
  size: number,
  type: string,
  lastModified: number,
}

export type {
  StrObj,
  ResBody,
}
