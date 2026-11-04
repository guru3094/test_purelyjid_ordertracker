import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PurelyJid",

    short_name: "PurelyJid",

    description:
      "Premium Handmade Resin Art & Personalized Gifts",

    start_url: "/",

    display: "standalone",

    background_color: "#ffffff",

    theme_color: "#000000",

    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },

      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
