import { useEffect, useState } from "react";
import { Lock, Sparkles, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import {
  mintGsiggy,
  loadMintedGsiggy,
  fetchOnchainMintStatus,
  RITUAL_NETWORK_NAME,
  type MintedGsiggy,
} from "@/lib/ritual";
import { ExplorerLink } from "./ExplorerLink";
import { track } from "@/lib/analytics";

interface Props {
  eligible: boolean;
  wallet: string | null;
  unlockedAt?: string | null;
}

/**
 * gSiggy NFT card. Three states:
 *  - Locked: prompt the player to reach LEGENDARY.
 *  - Eligible (not minted): show real Mint button calling the deployed contract.
 *  - Holder (minted): show token id + explorer link.
 */
export function GsiggyCard({ eligible, wallet, unlockedAt }: Props) {
  const [minted, setMinted] = useState<MintedGsiggy | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore from local storage and reconcile with chain whenever wallet changes.
  useEffect(() => {
    setMinted(loadMintedGsiggy(wallet));
    setError(null);
    if (!wallet) return;
    fetchOnchainMintStatus(wallet)
      .then((s) => {
        if (s.minted) {
          setMinted((prev) => {
            const next: MintedGsiggy = {
              txHash: prev?.txHash ?? "",
              tokenId: s.tokenId,
              network: RITUAL_NETWORK_NAME,
              timestamp: prev?.timestamp ?? new Date().toISOString(),
            };
            try {
              window.localStorage.setItem(
                `gsiggy-minted:${wallet.toLowerCase()}`,
                JSON.stringify(next),
              );
            } catch {
              /* best effort */
            }
            return next;
          });
        }
      })
      .catch(() => {
        /* read failure is non-fatal */
      });
  }, [wallet]);

  const date = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  async function handleMint() {
    if (!wallet || pending) return;
    setError(null);
    setPending(true);
    const outcome = await mintGsiggy(wallet);
    setPending(false);
    if (outcome.ok) {
      setMinted(outcome.record);
      track("gsiggy_minted", { wallet, tx: outcome.record.txHash });
      // Poll for tokenId once the tx confirms onchain.
      window.setTimeout(async () => {
        const s = await fetchOnchainMintStatus(wallet);
        if (s.minted) {
          setMinted((prev) =>
            prev ? { ...prev, tokenId: s.tokenId } : prev,
          );
        }
      }, 6000);
    } else {
      setError(outcome.message);
    }
  }

  const isMinted = !!minted && (minted.tokenId > 0 || !!minted.txHash);

  return (
    <section
      className={`gsiggy ${eligible ? "gsiggy--eligible gsiggy--prestige" : "gsiggy--locked"}`}
    >
      {eligible && <div className="gsiggy__glow" aria-hidden />}

      <div className="gsiggy__head">
        <div className="gsiggy__title">
          {eligible ? <Sparkles size={16} /> : <Lock size={16} />}
          <span>{eligible ? (isMinted ? "gSiggy · Holder" : "gSiggy · Eligible") : "gSiggy Badge"}</span>
        </div>
        <span className={`gsiggy__status ${eligible ? "is-eligible" : "is-locked"}`}>
          {isMinted ? "Minted" : eligible ? "Eligible" : "Locked"}
        </span>
      </div>

      <p className="gsiggy__text">
        {isMinted
          ? "You hold a gSiggy NFT on Ritual testnet."
          : eligible
            ? "Eligibility unlocked. Claim your gSiggy NFT below."
            : "Reach Ritual LEGENDARY to unlock eligibility"}
      </p>

      {eligible && (
        <>
          <ul className="gsiggy__showcase">
            <li>
              <span>Status</span>
              <strong>Ritual Legend</strong>
            </li>
            <li>
              <span>Unlocked</span>
              <strong>
                {date ? (
                  <>
                    <Calendar size={10} /> {date}
                  </>
                ) : (
                  "—"
                )}
              </strong>
            </li>
            <li>
              <span>Token</span>
              <strong>
                {isMinted ? `#${minted!.tokenId || "…"}` : "Unminted"}
              </strong>
            </li>
          </ul>

          {isMinted ? (
            <>
              <button
                className="gsiggy__btn gsiggy__btn--done"
                disabled
                aria-disabled="true"
              >
                <CheckCircle2 size={14} /> Minted on {RITUAL_NETWORK_NAME}
              </button>
              {minted?.txHash && <ExplorerLink txHash={minted.txHash} />}
            </>
          ) : (
            <button
              className="gsiggy__btn"
              onClick={handleMint}
              disabled={!wallet || pending}
              aria-disabled={!wallet || pending}
            >
              {pending ? (
                <>
                  <Loader2 size={14} className="ritual__spin" /> Minting…
                </>
              ) : !wallet ? (
                "Connect wallet to mint"
              ) : (
                "Mint gSiggy"
              )}
            </button>
          )}

          {error && <p className="ritual__hint ritual__hint--error">{error}</p>}
        </>
      )}
    </section>
  );
}
