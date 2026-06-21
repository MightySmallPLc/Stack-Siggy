import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
const acct = privateKeyToAccount(process.env.RITUAL_DEPLOYER_PRIVATE_KEY);
const addr = acct.address.toLowerCase();
const c = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
const latest = await c.getBlockNumber();
console.log('Latest block:', latest);
// Scan last 200 blocks for txs from deployer
for (let i = 0n; i < 400n; i++) {
  const bn = latest - i;
  const blk = await c.getBlock({ blockNumber: bn, includeTransactions: true });
  for (const tx of blk.transactions) {
    if (tx.from?.toLowerCase() === addr && !tx.to) {
      const rcpt = await c.getTransactionReceipt({ hash: tx.hash });
      console.log('Block', bn, 'tx', tx.hash, 'nonce', tx.nonce, 'contract', rcpt.contractAddress, 'status', rcpt.status);
    }
  }
}
