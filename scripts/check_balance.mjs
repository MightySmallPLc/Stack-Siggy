import { createPublicClient, http, privateKeyToAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
const acct = privateKeyToAccount(process.env.RITUAL_DEPLOYER_PRIVATE_KEY);
const c = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
const bal = await c.getBalance({ address: acct.address });
console.log('Deployer:', acct.address);
console.log('Balance:', bal.toString(), 'wei =', Number(bal)/1e18, 'RITUAL');
