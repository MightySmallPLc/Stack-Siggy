import { createFileRoute } from "@tanstack/react-router";
import { SiggyStackGame } from "@/components/game/SiggyStackGame";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SiggyStack — Swipe to merge coins from DOGE to LEGENDARY" },
      {
        name: "description",
        content:
          "SiggyStack is a mobile-first 2048-style puzzle. Swipe to merge DOGE, PEPE, SOL, ETH, BTC and reach LEGENDARY.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="game-page">
      <SiggyStackGame />
    </main>
  );
}
