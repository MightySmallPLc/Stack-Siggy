import { createPublicClient, http } from 'viem';
import fs from 'node:fs';
const addr = '0xa47920f59d5e7595dc94da8138a331ec5ea283cd';
const c = createPublicClient({ transport: http('https://rpc.ritualfoundation.org') });
const code = await c.getCode({ address: addr });
console.log('Has code:', code && code !== '0x', 'len:', code?.length);
const abi = [
  { name:'name', type:'function', stateMutability:'view', inputs:[], outputs:[{type:'string'}] },
  { name:'symbol', type:'function', stateMutability:'view', inputs:[], outputs:[{type:'string'}] },
  { name:'totalSupply', type:'function', stateMutability:'view', inputs:[], outputs:[{type:'uint256'}] },
];
console.log('name:', await c.readContract({address:addr, abi, functionName:'name'}));
console.log('symbol:', await c.readContract({address:addr, abi, functionName:'symbol'}));
console.log('totalSupply:', await c.readContract({address:addr, abi, functionName:'totalSupply'}));
