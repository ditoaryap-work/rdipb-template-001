export const siteConfig = {
  title: "Grand Avenue Residence",
  description: "Hunian Modern di Lokasi Strategis Jakarta Selatan",
  author: "Antigravity",

  // Analytics Config
  clientId: "grand-avenue",

  // Design System (Soft & Fresh)
  theme: {
    colors: {
      primary: "#0284c7", // Sky 600 (Fresh Blue)
      secondary: "#64748b", // Slate 500 (Soft Gray)
      accent: "#10b981", // Emerald 500 (Growth/Success)
      background: "#f8fafc", // Slate 50 (Soft White)
      surface: "#ffffff",
      text: {
        primary: "#1e293b", // Slate 800 (Readable Black)
        secondary: "#64748b", // Slate 500 (Readable Gray)
      },
      border: "#e2e8f0", // Slate 200
    },
    fonts: {
      sans: "'Inter', sans-serif",
      display: "'Plus Jakarta Sans', sans-serif",
    },
  },

  // Contact Info
  contact: {
    whatsapp: "6281234567890",
    whatsappText: "Halo, saya tertarik dengan Grand Avenue Residence",
    email: "info@grandavenue.com",
    phone: "021-12345678",
    address: "Jl. Grand Avenue No. 1, Jakarta Selatan, DKI Jakarta 12920",
    mapsUrl: "https://goo.gl/maps/example",
  },

  // SEO & Social
  seo: {
    ogImage: "/og-image.jpg",
    twitterHandle: "@grandavenue",
    keywords: "rumah dekat ipb, rumah bogor kota, perumahan dekat kampus ipb, jual rumah bogor, investasi kos ipb, grand avenue residence",
  },

  // Stats
  stats: {
    projectsCompleted: "50+",
    happyCustomers: "500+",
    yearsExperience: "10+",
  },
};

export type SiteConfig = typeof siteConfig;
