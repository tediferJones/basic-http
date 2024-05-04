type StrObj = { [key: string]: string }

type ResBody = {
  body: string | Buffer
  size: number,
  type: string,
}

export type {
  StrObj,
  ResBody,
}
