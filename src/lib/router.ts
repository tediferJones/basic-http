const router = new Bun.FileSystemRouter({
  dir: './src/public',
  style: 'nextjs',
  fileExtensions: ['.js', '.css', '.ico', '.html'],
});

export default router;
