// gSiggy NFT minting flow.
// Calls mintGsiggy() on the deployed CoinMergeRitual contract.
// One mint per eligible wallet (enforced onchain).

import {
  ensureRitualNetwork,
  sendContractTx,
  readContract,
  RitualError,
  CONTRACT_ADDRESS,
} from "./ritualService";
import { RITUAL_NETWORK_NAME } from "./networkConfig";

export interface MintedGsiggy {
  txHash: string;
  tokenId: number;
  network: string;
  timestamp: string;
}

export type MintOutcome =
  | { ok: true; record: MintedGsiggy }
  | {
      ok: false;
      kind: "no_wallet" | "rejected" | "network" | "failed" | "ineligible" | "already";
      message: string;
    };

const STORAGE_PREFIX = "gsiggy-minted:";

function storageKey(wallet: string): string {
  return `${STORAGE_PREFIX}${wallet.toLowerCase()}`;
}

export function loadMintedGsiggy(
  wallet: string | null | undefined,
): MintedGsiggy | null {
  if (!wallet || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    return raw ? (JSON.parse(raw) as MintedGsiggy) : null;
  } catch {
    return null;
  }
}

function saveMintedGsiggy(wallet: string, record: MintedGsiggy): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(wallet), JSON.stringify(record));
  } catch {
    /* best effort */
  }
}

/** Read onchain whether `wallet` already minted, returning the tokenId (0 = not minted). */
export async function fetchOnchainMintStatus(
  wallet: string,
): Promise<{ minted: boolean; tokenId: number }> {
  try {
    const raw = await readContract<string>("gsiggyTokenId", [wallet as `0x${string}`]);
    const tokenId = raw && raw !== "0x" ? Number(BigInt(raw)) : 0;
    return { minted: tokenId > 0, tokenId };
  } catch {
    return { minted: false, tokenId: 0 };
  }
}

/** Read onchain eligibility flag (hasAchievement). */
export async function fetchOnchainEligibility(wallet: string): Promise<boolean> {
  try {
    const raw = await readContract<string>("hasAchievement", [wallet as `0x${string}`]);
    return raw && raw !== "0x" ? BigInt(raw) === 1n : false;
  } catch {
    return false;
  }
}

export async function mintGsiggy(wallet: string): Promise<MintOutcome> {
  if (!wallet) {
    return { ok: false, kind: "no_wallet", message: "Connect your wallet first." };
  }

  try {
    await ensureRitualNetwork();

    // Best-effort precheck so the user gets a clean error before the wallet popup.
    const status = await fetchOnchainMintStatus(wallet);
    if (status.minted) {
      const record: MintedGsiggy = {
        txHash: loadMintedGsiggy(wallet)?.txHash ?? "",
        tokenId: status.tokenId,
        network: RITUAL_NETWORK_NAME,
        timestamp: loadMintedGsiggy(wallet)?.timestamp ?? new Date().toISOString(),
      };
      saveMintedGsiggy(wallet, record);
      return { ok: false, kind: "already", message: "You've already minted gSiggy." };
    }

    const eligible = await fetchOnchainEligibility(wallet);
    if (!eligible) {
      return {
        ok: false,
        kind: "ineligible",
        message: "Record your Legendary achievement first to become eligible.",
      };
    }

    const txHash = await sendContractTx(wallet, "mintGsiggy", []);

    // We don't have the tokenId until the tx settles; persist what we have now,
    // refine once we poll the chain in the UI.
    const record: MintedGsiggy = {
      txHash,
      tokenId: 0,
      network: RITUAL_NETWORK_NAME,
      timestamp: new Date().toISOString(),
    };
    saveMintedGsiggy(wallet, record);
    return { ok: true, record };
  } catch (e) {
    if (e instanceof RitualError) {
      return { ok: false, kind: e.kind, message: e.message };
    }
    return {
      ok: false,
      kind: "failed",
      message: "Something went wrong while minting your gSiggy.",
    };
  }
}

export { CONTRACT_ADDRESS };
