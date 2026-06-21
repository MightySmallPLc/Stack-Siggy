// Public surface for the Ritual integration.

export {
  RITUAL_NETWORK_NAME,
  RITUAL_EXPLORER_URL,
  RITUAL_CHAIN,
  explorerTxUrl,
  explorerAddressUrl,
} from "./networkConfig";
export {
  ensureRitualNetwork,
  sendContractTx,
  readContract,
  RitualError,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  type RitualErrorKind,
} from "./ritualService";
export {
  recordLegendaryAchievement,
  loadRecorded,
  type AchievementInput,
  type RecordedAchievement,
  type RecordOutcome,
} from "./achievementRecorder";
export {
  recordBestScore,
  loadRecordedScore,
  type ScoreInput,
  type RecordedScore,
  type ScoreOutcome,
} from "./scoreRecorder";
export {
  mintGsiggy,
  loadMintedGsiggy,
  fetchOnchainMintStatus,
  fetchOnchainEligibility,
  type MintedGsiggy,
  type MintOutcome,
} from "./gsiggyMinter";
export { isNewBestScore } from "./scoreValidation";
