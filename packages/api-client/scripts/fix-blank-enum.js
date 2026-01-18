const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'models', 'BlankEnum.ts');
const indexTarget = path.join(__dirname, '..', 'src', 'index.ts');

if (!fs.existsSync(target)) {
  process.exit(0);
}

const content = fs.readFileSync(target, 'utf8');
const fixed = content.replace(
  /export enum BlankEnum\s*{[^}]*}/s,
  "export type BlankEnum = '';"
);

if (fixed !== content) {
  fs.writeFileSync(target, fixed, 'utf8');
}

if (fs.existsSync(indexTarget)) {
  const indexContent = fs.readFileSync(indexTarget, 'utf8');
  const fixedIndex = indexContent.replace(
    /export \{ BlankEnum \} from '\.\/models\/BlankEnum';/g,
    "export type { BlankEnum } from './models/BlankEnum';"
  );
  if (fixedIndex !== indexContent) {
    fs.writeFileSync(indexTarget, fixedIndex, 'utf8');
  }
}
