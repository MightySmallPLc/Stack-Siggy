import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
const acct = privateKeyToAccount(process.env.RITUAL_DEPLOYER_PRIVATE_KEY);
const c = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
const bal = await c.getBalance({ address: acct.address });
console.log('Deployer:', acct.address);
console.log('Balance:', (Number(bal)/1e18).toFixed(6), 'RITUAL');
