import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "G.O.C.S. — Grupo Operacional Comando Sur",
    short_name: "G.O.C.S.",
    description: "Portal de operaciones del Grupo Operacional Comando Sur.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
