// Compile + deploy CoinMergeRitual to Ritual chain 1979.
// Usage: bun scripts/deploy.mjs
import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PK = process.env.RITUAL_DEPLOYER_PRIVATE_KEY;
if (!PK) { console.error('RITUAL_DEPLOYER_PRIVATE_KEY missing'); process.exit(1); }

const ritual = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } },
  blockExplorers: { default: { name: 'Ritual', url: 'https://explorer.ritualfoundation.org' } },
});

const srcPath = path.resolve('contracts/src/CoinMergeRitual.sol');
const source = fs.readFileSync(srcPath, 'utf8');

console.log('Compiling…');
const input = {
  language: 'Solidity',
  sources: { 'CoinMergeRitual.sol': { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'paris',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
if (out.errors) {
  const fatal = out.errors.filter(e => e.severity === 'error');
  if (fatal.length) { console.error(JSON.stringify(fatal, null, 2)); process.exit(1); }
  for (const w of out.errors) console.warn(w.formattedMessage);
}
const c = out.contracts['CoinMergeRitual.sol']['CoinMergeRitual'];
const abi = c.abi;
const bytecode = '0x' + c.evm.bytecode.object;
console.log('Bytecode size:', (bytecode.length - 2) / 2, 'bytes');

const account = privateKeyToAccount(PK);
const pub = createPublicClient({ chain: ritual, transport: http() });
const wallet = createWalletClient({ chain: ritual, transport: http(), account });

const bal = await pub.getBalance({ address: account.address });
console.log('Deployer:', account.address, 'balance:', (Number(bal)/1e18).toFixed(4), 'RITUAL');

console.log('Deploying…');
const hash = await wallet.deployContract({ abi, bytecode, args: [] });
console.log('Deploy tx:', hash);
const receipt = await pub.waitForTransactionReceipt({ hash });
if (receipt.status !== 'success') { console.error('Deployment failed', receipt); process.exit(1); }
const address = receipt.contractAddress;
console.log('Deployed:', address);
console.log('Explorer:', `https://explorer.ritualfoundation.org/address/${address}`);

// Persist deployment info
fs.mkdirSync('contracts/out', { recursive: true });
fs.writeFileSync('contracts/out/CoinMergeRitual.json', JSON.stringify({ address, abi, txHash: hash, deployer: account.address, chainId: 1979 }, null, 2));
console.log('Wrote contracts/out/CoinMergeRitual.json');
