import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF.js loads its worker relative to its own module at runtime. Keep the
  // package external so Next does not relocate pdf.mjs into vendor-chunks.
  serverExternalPackages: ["pdfjs-dist", "@svgsketch/pdf", "paper"],
  // PDF.js imports this worker through a computed path at runtime, so Next's
  // normal dependency trace cannot discover it for the deployed function.
  outputFileTracingIncludes: {
    "/api/cricut-svg/outlines": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/customer-invoice": ["./lib/invoice/fonts/*.ttf"],
    "/api/whatsapp/customer": ["./lib/invoice/fonts/*.ttf"],
  },
  async redirects() {
    return [
      {
        source: "/collections",
        destination: "/#collections",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
