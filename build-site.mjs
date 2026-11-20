import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output);

for (const name of ['index.html', 'game.js', 'style.css', 'ron-face.jpg', 'CREDITS.md']) {
  await cp(join(root, name), join(output, name));
}
await cp(join(root, 'media'), join(output, 'media'), { recursive: true });

console.log('Built dist/ from the game files at the project root.');
