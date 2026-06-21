// Records a player's best score onchain via the deployed CoinMergeRitual contract.

import {
  ensureRitualNetwork,
  sendContractTx,
  RitualError,
} from "./ritualService";
import { RITUAL_NETWORK_NAME } from "./networkConfig";

export interface ScoreInput {
  wallet: string;
  score: number;
  bestTier: number;
  legendaryUnlocked: boolean;
}

export interface RecordedScore {
  txHash: string;
  network: string;
  timestamp: string;
  bestScore: number;
  bestTier: number;
  legendaryUnlocked: boolean;
}

export type ScoreOutcome =
  | { ok: true; record: RecordedScore }
  | {
      ok: false;
      kind: "no_wallet" | "rejected" | "network" | "failed" | "not_improved";
      message: string;
    };

const STORAGE_PREFIX = "ritual-score:";

function storageKey(wallet: string): string {
  return `${STORAGE_PREFIX}${wallet.toLowerCase()}`;
}

export function loadRecordedScore(
  wallet: string | null | undefined,
): RecordedScore | null {
  if (!wallet || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    return raw ? (JSON.parse(raw) as RecordedScore) : null;
  } catch {
    return null;
  }
}

function saveRecordedScore(wallet: string, record: RecordedScore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(wallet), JSON.stringify(record));
  } catch {
    /* best effort */
  }
}

export async function recordBestScore(input: ScoreInput): Promise<ScoreOutcome> {
  if (!input.wallet) {
    return { ok: false, kind: "no_wallet", message: "Connect your wallet first." };
  }

  const previous = loadRecordedScore(input.wallet);
  if (previous && input.score <= previous.bestScore) {
    return {
      ok: false,
      kind: "not_improved",
      message: "This score doesn't beat your recorded best.",
    };
  }

  try {
    await ensureRitualNetwork();

    const txHash = await sendContractTx(input.wallet, "recordScore", [
      BigInt(input.score),
      BigInt(input.bestTier),
    ]);

    const record: RecordedScore = {
      txHash,
      network: RITUAL_NETWORK_NAME,
      timestamp: new Date().toISOString(),
      bestScore: input.score,
      bestTier: input.bestTier,
      legendaryUnlocked: input.legendaryUnlocked,
    };
    saveRecordedScore(input.wallet, record);
    return { ok: true, record };
  } catch (e) {
    if (e instanceof RitualError) {
      return { ok: false, kind: e.kind, message: e.message };
    }
    return {
      ok: false,
      kind: "failed",
      message: "Something went wrong while recording your score.",
    };
  }
}
