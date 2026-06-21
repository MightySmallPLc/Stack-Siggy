// Low-level Ritual testnet service.
//
// Talks directly to the user's injected EIP-1193 wallet (MetaMask, Rabby…).
// Responsibilities:
//   - Ensure the wallet is on the Ritual chain (switch / add if needed).
//   - Send transactions to the deployed `CoinMergeRitual` contract.
//
// The contract address + ABI live in ./contract.json (written at deploy time).

import { encodeFunctionData, type Abi } from "viem";
import { RITUAL_CHAIN } from "./networkConfig";
import contractData from "./contract.json";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getProvider(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
}

export const CONTRACT_ADDRESS = contractData.address as `0x${string}`;
export const CONTRACT_ABI = contractData.abi as Abi;

export type RitualErrorKind =
  | "no_wallet"
  | "rejected"
  | "network"
  | "failed";

export class RitualError extends Error {
  kind: RitualErrorKind;
  constructor(kind: RitualErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

/** Ensure the wallet is on the Ritual chain. Adds it if missing. */
export async function ensureRitualNetwork(): Promise<void> {
  const provider = getProvider();
  if (!provider) {
    throw new RitualError(
      "no_wallet",
      "No wallet detected. Please connect a wallet first.",
    );
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: RITUAL_CHAIN.chainId }],
    });
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    // 4902 = chain not added to the wallet yet → add it.
    if (err?.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [RITUAL_CHAIN],
        });
      } catch (addErr: unknown) {
        const ae = addErr as { code?: number };
        if (ae?.code === 4001) {
          throw new RitualError("rejected", "You rejected the network request.");
        }
        throw new RitualError(
          "network",
          "Could not add the Ritual network to your wallet.",
        );
      }
    } else if (err?.code === 4001) {
      throw new RitualError("rejected", "You rejected the network switch.");
    } else {
      throw new RitualError(
        "network",
        "Could not switch your wallet to the Ritual network.",
      );
    }
  }
}

/**
 * Call a function on the deployed CoinMergeRitual contract.
 * Returns the resulting tx hash.
 */
export async function sendContractTx(
  wallet: string,
  functionName: string,
  args: readonly unknown[] = [],
): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    throw new RitualError("no_wallet", "No wallet detected.");
  }

  const data = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName,
    args,
  });

  try {
    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: wallet,
          to: CONTRACT_ADDRESS,
          value: "0x0",
          data,
        },
      ],
    })) as string;
    return txHash;
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err?.code === 4001) {
      throw new RitualError("rejected", "You rejected the transaction.");
    }
    throw new RitualError(
      "failed",
      err?.message || "The transaction could not be sent.",
    );
  }
}

/** Read a view function on the contract via the connected wallet's RPC. */
export async function readContract<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
): Promise<T> {
  const provider = getProvider();
  if (!provider) throw new RitualError("no_wallet", "No wallet detected.");
  const data = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName,
    args,
  });
  const result = (await provider.request({
    method: "eth_call",
    params: [{ to: CONTRACT_ADDRESS, data }, "latest"],
  })) as string;
  // Caller decodes — we keep this generic for simple cases.
  return result as unknown as T;
}
