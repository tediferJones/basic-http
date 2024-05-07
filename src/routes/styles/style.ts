import Req from '@/lib/Req';
import Res from '@/lib/Res';
import getResBody from '@/lib/getResBody';

export async function GET(req: Req, res: Res) {
  res.body = await getResBody(Bun.file('./src/public/styles/style.css'));
}
