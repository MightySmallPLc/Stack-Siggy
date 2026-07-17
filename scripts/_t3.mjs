import { createPublicClient, http } from 'viem';
import fs from 'node:fs';
const { address, abi } = JSON.parse(fs.readFileSync('src/lib/ritual/contract.json','utf8'));
const pc = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
const uri = await pc.readContract({address,abi,functionName:'tokenURI',args:[1n]});
console.log('uri.length:', uri.length);
const b64 = uri.replace('data:application/json;base64,','');
const raw = Buffer.from(b64,'base64');
console.log('decoded bytes:', raw.length);
console.log('first 200:', raw.slice(0,200).toString('utf8'));
console.log('last 200 (hex):', raw.slice(-200).toString('hex'));
console.log('last 200 (utf8):', raw.slice(-200).toString('utf8'));
// try to parse only up to last }
const str = raw.toString('utf8');
const end = str.lastIndexOf('}');
console.log('lastBrace at', end, 'of', str.length);
try {
  const parsed = JSON.parse(str.slice(0, end+1));
  console.log('PARSE OK, keys:', Object.keys(parsed));
  const imgB64 = parsed.image.split(',')[1];
  const svg = Buffer.from(imgB64,'base64').toString('utf8');
  console.log('SVG head:', svg.slice(0,80));
  console.log('SVG tail:', svg.slice(-80));
  console.log('SVG len:', svg.length, 'endsWithSvg:', svg.trimEnd().endsWith('</svg>'));
  fs.writeFileSync('/tmp/gsiggy.svg', svg);
} catch (e) { console.log('parse err:', e.message); }
