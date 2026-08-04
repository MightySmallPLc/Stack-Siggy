import { createFileRoute } from "@tanstack/react-router";
import { SiggyStackGame } from "@/components/game/SiggyStackGame";

const SITE_URL = "https://siggystack.vercel.app";
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const DESCRIPTION =
  "A Ritual-native adventure where every achievement lives onchain. Ascend to Legendary, record your progress, and mint your gSiggy NFT.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SiggyStack" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "SiggyStack" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: "SiggyStack" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "SiggyStack" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SiggyStack" },
      { name: "twitter:description", content: DESCRIPTION },
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
