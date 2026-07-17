import { createPublicClient, createWalletClient, http, encodeFunctionData, decodeEventLog, parseEventLogs } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import fs from 'node:fs';

const { address, abi } = JSON.parse(fs.readFileSync('src/lib/ritual/contract.json','utf8'));
const RPC = 'https://rpc.ritualfoundation.org';
const chain = { id: 1979, name: 'Ritual', nativeCurrency:{name:'RITUAL',symbol:'RITUAL',decimals:18}, rpcUrls:{default:{http:[RPC]}}};
const pk = process.env.RITUAL_DEPLOYER_PRIVATE_KEY.startsWith('0x') ? process.env.RITUAL_DEPLOYER_PRIVATE_KEY : '0x'+process.env.RITUAL_DEPLOYER_PRIVATE_KEY;
const acct = privateKeyToAccount(pk);
const pc = createPublicClient({ chain, transport: http(RPC) });
const wc = createWalletClient({ account: acct, chain, transport: http(RPC) });
console.log('Deployer/Player A:', acct.address);

const EXP = 'https://explorer.ritualfoundation.org/tx/';

async function send(fn, args, opts={}) {
  const hash = await wc.writeContract({ address, abi, functionName: fn, args, ...opts });
  const rcpt = await pc.waitForTransactionReceipt({ hash });
  return { hash, rcpt };
}
async function simRevert(fn, args) {
  try { await pc.simulateContract({ address, abi, functionName: fn, args, account: acct.address }); return null; }
  catch (e) { return e.shortMessage || e.message.split('\n')[0]; }
}
function ev(rcpt, name) {
  const logs = parseEventLogs({ abi, logs: rcpt.logs, eventName: name });
  return logs;
}
const results = [];
function record(name, pass, detail) { results.push({name, pass, detail}); console.log(`\n${pass?'✅':'❌'} ${name}\n  ${detail.replace(/\n/g,'\n  ')}`); }

// ================= TEST 1 =================
console.log('\n=== TEST 1: Achievement Recording ===');
{
  const { hash, rcpt } = await send('recordAchievement', [1234n, 11n]);
  const logs = ev(rcpt, 'AchievementRecorded');
  const has = await pc.readContract({address,abi,functionName:'hasAchievement',args:[acct.address]});
  record('Test 1 — recordAchievement', rcpt.status==='success' && logs.length===1 && has===true,
    `tx=${hash}\nexplorer=${EXP}${hash}\nstatus=${rcpt.status}\nevent=${JSON.stringify(logs[0]?.args, (k,v)=>typeof v==='bigint'?v.toString():v)}\nhasAchievement=${has}`);
}

// ================= TEST 5 (before mint, needs recorded score baseline) =================
console.log('\n=== TEST 5: recordScore edge cases ===');
{
  // baseline bestScore=1234 from test1
  const lower = await simRevert('recordScore', [1233n, 11n]);
  const equal = await simRevert('recordScore', [1234n, 11n]);
  const { hash, rcpt } = await send('recordScore', [1235n, 11n]);
  const logs = ev(rcpt, 'ScoreRecorded');
  const best = await pc.readContract({address,abi,functionName:'bestScore',args:[acct.address]});
  record('Test 5 — recordScore edge cases',
    !!lower && !!equal && rcpt.status==='success' && best===1235n,
    `lower(1233) revert: ${lower}\nequal(1234) revert: ${equal}\nhigher(1235) tx=${hash} status=${rcpt.status} bestScore=${best}\nexplorer=${EXP}${hash}\nevent=${JSON.stringify(logs[0]?.args, (k,v)=>typeof v==='bigint'?v.toString():v)}`);
}

// ================= TEST 2 =================
console.log('\n=== TEST 2: gSiggy Mint ===');
let tokenId;
{
  const { hash, rcpt } = await send('mintGsiggy', []);
  const mintedEv = ev(rcpt, 'GsiggyMinted');
  const transferEv = ev(rcpt, 'Transfer');
  tokenId = mintedEv[0].args.tokenId;
  const total = await pc.readContract({address,abi,functionName:'totalSupply'});
  const gsigId = await pc.readContract({address,abi,functionName:'gsiggyTokenId',args:[acct.address]});
  const owner = await pc.readContract({address,abi,functionName:'ownerOf',args:[tokenId]});
  const second = await simRevert('mintGsiggy', []);
  record('Test 2 — mintGsiggy',
    rcpt.status==='success' && total===1n && gsigId===tokenId && owner.toLowerCase()===acct.address.toLowerCase() && !!second,
    `tx=${hash}\nexplorer=${EXP}${hash}\ntokenId=${tokenId}\ntotalSupply=${total}\ngsiggyTokenId=${gsigId}\nownerOf=${owner}\nTransfer(from=zero)=${transferEv[0]?.args?.from}\nsecond-mint revert: ${second}`);
}

// ================= TEST 3 =================
console.log('\n=== TEST 3: NFT Metadata ===');
{
  const uri = await pc.readContract({address,abi,functionName:'tokenURI',args:[tokenId]});
  const b64 = uri.replace('data:application/json;base64,','');
  const json = JSON.parse(Buffer.from(b64,'base64').toString('utf8'));
  const svgB64 = json.image.replace('data:image/svg+xml;base64,','');
  const svg = Buffer.from(svgB64,'base64').toString('utf8');
  const ok = !!json.name && !!json.description && !!json.image && svg.startsWith('<svg') && svg.endsWith('</svg>');
  record('Test 3 — tokenURI metadata', ok,
    `name=${json.name}\ndesc=${json.description}\nimage.len=${json.image.length}\nsvg.head=${svg.slice(0,80)}...\nsvg.tail=...${svg.slice(-40)}\nattributes=${JSON.stringify(json.attributes)}`);
}

// ================= TEST 4 =================
console.log('\n=== TEST 4: NFT Transfer ===');
{
  const bPk = generatePrivateKey();
  const bAddr = privateKeyToAccount(bPk).address;
  const balA0 = await pc.readContract({address,abi,functionName:'balanceOf',args:[acct.address]});
  const balB0 = await pc.readContract({address,abi,functionName:'balanceOf',args:[bAddr]});
  const { hash, rcpt } = await send('transferFrom', [acct.address, bAddr, tokenId]);
  const logs = ev(rcpt, 'Transfer');
  const newOwner = await pc.readContract({address,abi,functionName:'ownerOf',args:[tokenId]});
  const balA1 = await pc.readContract({address,abi,functionName:'balanceOf',args:[acct.address]});
  const balB1 = await pc.readContract({address,abi,functionName:'balanceOf',args:[bAddr]});
  record('Test 4 — transferFrom',
    rcpt.status==='success' && newOwner.toLowerCase()===bAddr.toLowerCase() && balA1===balA0-1n && balB1===balB0+1n && logs.length===1,
    `walletB=${bAddr} (generated, not funded)\ntx=${hash}\nexplorer=${EXP}${hash}\nTransfer.from=${logs[0]?.args?.from}\nTransfer.to=${logs[0]?.args?.to}\ntokenId=${logs[0]?.args?.tokenId}\nownerOf=${newOwner}\nbalA: ${balA0}→${balA1}\nbalB: ${balB0}→${balB1}`);
}

// ================= TEST 6 (static, reported separately) =================

console.log('\n\n=== SUMMARY ===');
for (const r of results) console.log(`${r.pass?'PASS':'FAIL'} — ${r.name}`);
fs.writeFileSync('/tmp/e2e_results.json', JSON.stringify(results,null,2));
