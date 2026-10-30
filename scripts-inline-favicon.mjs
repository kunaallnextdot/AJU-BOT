// Inlines the favicon left behind by vite-plugin-singlefile so dist-single/index.html is fully self-contained.
import fs from 'fs';
const dir = 'dist-single';
let html = fs.readFileSync(`${dir}/index.html`, 'utf8');
for (const f of fs.readdirSync(dir).filter((f) => f.startsWith('favicon'))) {
  const b64 = fs.readFileSync(`${dir}/${f}`).toString('base64');
  html = html.replace(`./${f}`, `data:image/jpeg;base64,${b64}`);
  fs.rmSync(`${dir}/${f}`);
}
fs.writeFileSync(`${dir}/index.html`, html);
