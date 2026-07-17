import { createPublicClient, http } from 'viem';
import fs from 'node:fs';
const { address, abi } = JSON.parse(fs.readFileSync('src/lib/ritual/contract.json','utf8'));
const c = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
const w = '0x02300A35904C3b985186E5c3b025c54739789aE4';
for (const fn of ['name','symbol','totalSupply']) {
  console.log(fn, await c.readContract({address,abi,functionName:fn}));
}
for (const fn of ['hasAchievement','hasMinted','bestScore','bestTier','gsiggyTokenId']) {
  console.log(fn+'(deployer):', await c.readContract({address,abi,functionName:fn,args:[w]}));
}
console.log('nativeBal:', await c.getBalance({address:w}));
