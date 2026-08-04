import { createFileRoute } from "@tanstack/react-router";
import { SiggyStackGame } from "@/components/game/SiggyStackGame";

const SITE_URL = "https://siggystack.vercel.app";
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const DESCRIPTION =
  "SiggyStack is a Ritual-native merge puzzle game where players evolve Siggies, reach the Legendary tier, record achievements on Ritual, and mint an onchain gSiggy NFT.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SiggyStack — Stack Siggies. Reach Legendary. Mint on Ritual." },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "SiggyStack — Ritual-Native Onchain Puzzle Game" },
      {
        property: "og:description",
        content:
          "Stack and evolve Siggies, unlock Legendary status, record achievements on Ritual, and mint your gSiggy NFT.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: "SiggyStack" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "SiggyStack — Stack Siggies. Reach Legendary. Mint on Ritual." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SiggyStack" },
      {
        name: "twitter:description",
        content:
          "A Ritual-native puzzle game powered by Ritual with onchain achievements and collectible gSiggy NFTs.",
      },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: "SiggyStack",
          url: SITE_URL,
          image: OG_IMAGE,
          description: DESCRIPTION,
          applicationCategory: "GameApplication",
          genre: "Puzzle",
          gamePlatform: "Web browser",
        }),
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
