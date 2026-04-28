const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && full.endsWith('.js')) files.push(full);
  }
  return files;
}

function lowerComments(src) {
  // lower block comments
  src = src.replace(/\/\*[\s\S]*?\*\//g, (m) => {
    // keep /* and */ and lowercase inner
    if (m.length <= 4) return m;
    const inner = m.slice(2, -2);
    return '/*' + inner.toLowerCase() + '*/';
  });
  // lower line comments but avoid http(s):// sequences inside strings? We operate on source text; this will lowercase comment lines only.
  src = src.replace(/(^|\n)(\s*)\/\/([^\n]*)/g, (m, pre, ws, text) => {
    return pre + ws + '//' + text.toLowerCase();
  });
  return src;
}

const targetDir = path.join(__dirname, '..', 'resources', 'js');
const files = walk(targetDir);

const results = [];
for (const file of files) {
  try {
    const original = fs.readFileSync(file, 'utf8');
    const updated = lowerComments(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      results.push({ file, changed: true });
    } else {
      results.push({ file, changed: false });
    }
  } catch (e) {
    results.push({ file, error: String(e) });
  }
}

console.log('lowercase-comments: processed', results.length, 'files');
for (const r of results) {
  if (r.error) console.log('error:', r.file, r.error);
  else console.log((r.changed ? 'updated' : 'unchanged') + ':', r.file);
}
