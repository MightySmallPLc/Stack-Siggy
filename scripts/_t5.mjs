import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'node:fs';
const { address, abi } = JSON.parse(fs.readFileSync('src/lib/ritual/contract.json','utf8'));
const RPC = 'https://rpc.ritualfoundation.org';
const chain = { id: 1979, name: 'Ritual', nativeCurrency:{name:'RITUAL',symbol:'RITUAL',decimals:18}, rpcUrls:{default:{http:[RPC]}}};
const pk = '0x'+process.env.RITUAL_DEPLOYER_PRIVATE_KEY.replace(/^0x/,'');
const acct = privateKeyToAccount(pk);
const pc = createPublicClient({ chain, transport: http(RPC) });

async function trySim(score) {
  try {
    const r = await pc.simulateContract({ address, abi, functionName:'recordScore', args:[score, 11n], account: acct });
    return { ok:true, r };
  } catch (e) {
    return { ok:false, reason: e.shortMessage || e.message.split('\n').slice(0,3).join(' | ') };
  }
}
console.log('current bestScore:', await pc.readContract({address,abi,functionName:'bestScore',args:[acct.address]}));
console.log('sim(1234):', await trySim(1234n));  // equal to bestScore now 1235? actually bestScore=1235 after t5 higher tx
console.log('sim(1235):', await trySim(1235n));
console.log('sim(0):',    await trySim(0n));
console.log('sim(2000):', await trySim(2000n));
