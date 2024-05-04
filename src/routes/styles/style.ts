import Req from '@/lib/Req';
import Res from '@/lib/Res';
import getFileBody from '@/lib/getFileBody';

export async function GET(req: Req, res: Res) {
  res.body = await getFileBody('./src/public/styles/style.css')
}
