import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const csvRoot = path.join(workspaceRoot, 'public', 'XBRL_output');
const componentPath = path.join(workspaceRoot, 'src', 'components', 'ComparisonFinancialTable.tsx');

const companies = ['TEPCO', 'CHUBU', 'JERA'];
const sheets = ['PL', 'BS', 'CF'];

const csvKeys = new Set();

for (const company of companies) {
  for (const sheet of sheets) {
    const filePath = path.join(csvRoot, company, `${sheet}.csv`);
    if (!fs.existsSync(filePath)) {
      console.warn('missing file', filePath);
      continue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const [headerLine] = raw.split(/\r?\n/, 1);
    if (!headerLine) continue;
    const headers = headerLine.split(',').map((h) => h.replace(/"/g, '').trim());
    headers.forEach((key) => {
      if (key && key !== 'fiscal_year' && key !== 'date' && key !== 'company_code') {
        csvKeys.add(key);
      }
    });
  }
}

function getFieldMapKeys() {
  const file = fs.readFileSync(componentPath, 'utf8');
  const startIdx = file.indexOf('const fieldLabelMap');
  if (startIdx === -1) {
    throw new Error('fieldLabelMap not found');
  }
  const openIdx = file.indexOf('{', startIdx);
  const closeIdx = file.indexOf('\n};', openIdx);
  const block = file.slice(openIdx + 1, closeIdx);
  const matches = block.match(/\s+([A-Za-z0-9_]+):/g) || [];
  return new Set(matches.map((m) => m.replace(/[:\s]/g, '')));
}

const fieldKeys = getFieldMapKeys();
const missing = Array.from(csvKeys).filter((key) => !fieldKeys.has(key)).sort();
const duplicates = [];
const seen = new Set();
for (const key of fieldKeys) {
  if (seen.has(key)) {
    duplicates.push(key);
  }
  seen.add(key);
}

console.log('CSV項目数', csvKeys.size);
console.log('fieldLabelMap項目数', fieldKeys.size);
console.log('不足項目数', missing.length);
if (missing.length) {
  console.log('---不足リスト---');
  missing.forEach((key) => console.log(key));
}
if (duplicates.length) {
  console.log('---重複キー---');
  duplicates.forEach((key) => console.log(key));
}

if (missing.length) {
  const tokenSet = new Set();
  const tokenizer = (key) => key.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[0-9]+|[A-Z]+/g) ?? [];
  missing.forEach((key) => {
    tokenizer(key).forEach((token) => tokenSet.add(token));
  });
  const tokens = Array.from(tokenSet).sort();
  console.log('不足トークン数', tokens.length);
  const outputPath = path.join(workspaceRoot, 'scripts', 'dev', 'missingTokens.json');
  fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2), 'utf8');
  console.log('トークン一覧を書き出しました:', outputPath);
}
