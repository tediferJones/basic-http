import Req from '@/lib/Req';
import Res from '@/lib/Res';
import getFileBody from '@/lib/getFileBody';

export async function GET(req: Req, res: Res) {
  res.body = await getFileBody('./src/public/index.html')
}

export async function POST(req: Req, res: Res) {
  const body = Buffer.from('POST response from routes/index.ts')
  res.body = {
    body,
    size: body.byteLength,
    type: 'text/plain'
  }
}
