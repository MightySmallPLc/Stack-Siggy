import fs from 'node:fs';
import solc from 'solc';
const source = fs.readFileSync('contracts/src/CoinMergeRitual.sol', 'utf8');
const out = JSON.parse(solc.compile(JSON.stringify({
  language: 'Solidity',
  sources: { 'CoinMergeRitual.sol': { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris',
    outputSelection: { '*': { '*': ['abi'] } } },
})));
const abi = out.contracts['CoinMergeRitual.sol']['CoinMergeRitual'].abi;
const data = {
  address: '0xa47920f59d5e7595dc94da8138a331ec5ea283cd',
  chainId: 1979,
  chainHex: '0x7bb',
  txHash: '0x0b48a7ecafbf2f55417b80800a86759ab7e1d1a51c85c797d5a36b37b318cf24',
  deployer: '0x02300A35904C3b985186E5c3b025c54739789aE4',
  abi,
};
fs.writeFileSync('src/lib/ritual/contract.json', JSON.stringify(data, null, 2));
console.log('Saved abi, fns:', abi.filter(a=>a.type==='function').map(a=>a.name).join(', '));
