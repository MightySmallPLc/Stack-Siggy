// Orchestrates the "Record on Ritual" user flow.
// Calls recordAchievement(bestScore, bestTier) on the deployed CoinMergeRitual contract.

import {
  ensureRitualNetwork,
  sendContractTx,
  RitualError,
} from "./ritualService";
import { RITUAL_NETWORK_NAME } from "./networkConfig";

export interface AchievementInput {
  wallet: string;
  bestScore: number;
  bestTier: number;
  legendaryUnlocked: boolean;
}

export interface RecordedAchievement {
  txHash: string;
  network: string;
  timestamp: string;
  bestScore: number;
  bestTier: number;
}

const STORAGE_PREFIX = "ritual-recorded:";

function storageKey(wallet: string): string {
  return `${STORAGE_PREFIX}${wallet.toLowerCase()}`;
}

export function loadRecorded(wallet: string | null | undefined): RecordedAchievement | null {
  if (!wallet || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    return raw ? (JSON.parse(raw) as RecordedAchievement) : null;
  } catch {
    return null;
  }
}

function saveRecorded(wallet: string, record: RecordedAchievement): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(wallet), JSON.stringify(record));
  } catch {
    /* best effort */
  }
}

export type RecordOutcome =
  | { ok: true; record: RecordedAchievement }
  | { ok: false; kind: "no_wallet" | "rejected" | "network" | "failed" | "ineligible" | "already"; message: string };

export async function recordLegendaryAchievement(
  input: AchievementInput,
): Promise<RecordOutcome> {
  if (!input.wallet) {
    return { ok: false, kind: "no_wallet", message: "Connect your wallet first." };
  }
  if (!input.legendaryUnlocked) {
    return {
      ok: false,
      kind: "ineligible",
      message: "Reach the Legendary tile first to unlock this.",
    };
  }
  if (loadRecorded(input.wallet)) {
    return {
      ok: false,
      kind: "already",
      message: "You've already recorded this achievement.",
    };
  }

  try {
    await ensureRitualNetwork();

    const txHash = await sendContractTx(input.wallet, "recordAchievement", [
      BigInt(input.bestScore),
      BigInt(input.bestTier),
    ]);

    const record: RecordedAchievement = {
      txHash,
      network: RITUAL_NETWORK_NAME,
      timestamp: new Date().toISOString(),
      bestScore: input.bestScore,
      bestTier: input.bestTier,
    };
    saveRecorded(input.wallet, record);
    return { ok: true, record };
  } catch (e) {
    if (e instanceof RitualError) {
      return { ok: false, kind: e.kind, message: e.message };
    }
    return {
      ok: false,
      kind: "failed",
      message: "Something went wrong while recording your achievement.",
    };
  }
}
