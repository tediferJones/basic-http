import Req from '@/lib/Req';
import Res from '@/lib/Res';
import router from '@/lib/router';

Bun.listen({
  hostname: 'localhost',
  port: 3000,
  socket: {
    async data(socket, data) {
      const req = new Req(data.toString());
      const method = req.method === 'HEAD' ? 'GET' : req.method;

      const match = router.match(req.path);
      const route = match ? (await import(match.filePath))[method] : undefined;
      const res = new Res(req, !!route);
      if (route) await route(req, res);

      socket.end(res.getBytes())
    },
  }
})
