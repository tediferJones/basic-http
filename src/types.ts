type StrObj = { [key: string]: string }

type ResBody = {
  content: Buffer,
  size: number,
  type: string,
  lastModified: number,
}

type HeaderObj = {
  [key: string]: string | number | undefined
}

export type {
  StrObj,
  ResBody,
  HeaderObj,
}
