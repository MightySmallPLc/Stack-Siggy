import { createPublicClient, http, encodeFunctionData } from 'viem';
import fs from 'node:fs';
const { address, abi } = JSON.parse(fs.readFileSync('src/lib/ritual/contract.json','utf8'));
const c = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
const user = '0x02300A35904C3b985186E5c3b025c54739789aE4';
async function sim(fn, args) {
  const data = encodeFunctionData({ abi, functionName: fn, args });
  try {
    const r = await c.call({ account: user, to: address, data });
    return `OK (${(r.data || '0x').slice(0,18)}…)`;
  } catch (e) {
    return `REVERT: ${e.shortMessage || e.message?.split('\n')[0]}`;
  }
}
console.log('recordAchievement(123, 11):', await sim('recordAchievement', [123n, 11n]));
console.log('mintGsiggy() [should revert: not eligible]:', await sim('mintGsiggy', []));
console.log('recordScore(0, 0)  [should revert: not improved]:', await sim('recordScore', [0n, 0n]));
console.log('hasAchievement(user):', await c.readContract({ address, abi, functionName:'hasAchievement', args:[user] }));
console.log('Contract live + functions callable.');
