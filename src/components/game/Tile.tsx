import { COINS, type Tile as TileType } from "@/lib/game";
import ritualLogo from "@/assets/ritual-logo.png";
import dogeLogo from "@/assets/coins/doge.svg";
import pepeLogo from "@/assets/coins/pepe.png";
import solLogo from "@/assets/coins/sol.svg";
import ethLogo from "@/assets/coins/eth.svg";
import btcLogo from "@/assets/coins/btc.svg";

interface Props {
  tile: TileType;
  cellSize: number;
  gap: number;
}

// Visual metadata for each coin tier. Kept here (not in game logic) so the
// game module stays pure and easy to edit.
const COIN_META: Record<
  (typeof COINS)[number],
  { symbol: string; short: string; logo?: string }
> = {
  DOGE: { symbol: "Ð", short: "DOGE", logo: dogeLogo },
  PEPE: { symbol: "ᵱ", short: "PEPE", logo: pepeLogo },
  SOL: { symbol: "◎", short: "SOL", logo: solLogo },
  ETH: { symbol: "Ξ", short: "ETH", logo: ethLogo },
  BTC: { symbol: "₿", short: "BTC", logo: btcLogo },
  LEGENDARY: { symbol: "★", short: "RITUAL" },
};


export function Tile({ tile, cellSize, gap }: Props) {
  const x = tile.col * (cellSize + gap);
  const y = tile.row * (cellSize + gap);
  const coin = COINS[tile.tier];
  const meta = COIN_META[coin];
  const isLegendary = coin === "LEGENDARY";

  const symbolSize = Math.max(18, Math.round(cellSize * 0.42));
  const labelSize = Math.max(9, Math.round(cellSize * 0.14));
  const logoSize = Math.round(cellSize * 0.58);

  const style: React.CSSProperties & Record<"--tx" | "--ty", string> = {
    width: cellSize,
    height: cellSize,
    transform: `translate(${x}px, ${y}px)`,
    "--tx": `${x}px`,
    "--ty": `${y}px`,
  };

  return (
    <div
      className={`coin-tile coin-tile--${coin.toLowerCase()} ${
        tile.mergedFrom ? "coin-tile--merged" : ""
      } ${tile.isNew ? "coin-tile--new" : ""}`}
      style={style}
    >
      {/* Outer animated glow halo — only rendered for LEGENDARY tiles
          to keep regular tiles lightweight on mobile. */}
      {isLegendary && <div className="coin-tile__halo" aria-hidden />}

      {/* Inner coin face — gives the tile depth like a real coin. */}
      <div className="coin-tile__face">
        {isLegendary ? (
          <>
            <img
              src={ritualLogo}
              alt="Ritual"
              className="coin-tile__ritual"
              width={logoSize}
              height={logoSize}
              draggable={false}
            />
            <span className="coin-tile__label" style={{ fontSize: labelSize }}>
              {meta.short}
            </span>
            {/* Lightweight particle sparkles (pure CSS, no JS loop). */}
            <span className="coin-tile__spark coin-tile__spark--1" aria-hidden />
            <span className="coin-tile__spark coin-tile__spark--2" aria-hidden />
            <span className="coin-tile__spark coin-tile__spark--3" aria-hidden />
            <span className="coin-tile__spark coin-tile__spark--4" aria-hidden />
          </>
        ) : (
          <>
            {meta.logo ? (
              <img
                src={meta.logo}
                alt={meta.short}
                className="coin-tile__logo"
                width={logoSize}
                height={logoSize}
                draggable={false}
              />
            ) : (
              <span className="coin-tile__symbol" style={{ fontSize: symbolSize }}>
                {meta.symbol}
              </span>
            )}
            <span className="coin-tile__label" style={{ fontSize: labelSize }}>
              {meta.short}
            </span>
          </>

        )}
      </div>
      {/* Sheen overlay — animates on merge/new for a premium feel. */}
      <div className="coin-tile__sheen" aria-hidden />
    </div>
  );
}
