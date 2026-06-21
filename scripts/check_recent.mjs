import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
const acct = privateKeyToAccount(process.env.RITUAL_DEPLOYER_PRIVATE_KEY);
const c = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
console.log('Address:', acct.address);
console.log('Nonce (latest):', await c.getTransactionCount({ address: acct.address }));
console.log('Nonce (pending):', await c.getTransactionCount({ address: acct.address, blockTag: 'pending' }));
console.log('Balance:', (Number(await c.getBalance({address: acct.address}))/1e18).toFixed(4));
