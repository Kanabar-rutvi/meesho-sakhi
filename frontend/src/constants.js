export const AGENT_META = {
  goal: {
    label: "Goal Agent",
    icon: "🎯",
    color: "#9333ea",
    description: "Understanding your needs"
  },
  planner: {
    label: "Planner Agent",
    icon: "🗺️",
    color: "#7c3aed",
    description: "Creating category plan"
  },
  review: {
    label: "Review Trust Agent",
    icon: "🔍",
    color: "#0ea5e9",
    description: "Checking review authenticity"
  },
  recommend: {
    label: "Recommendation Agent",
    icon: "⭐",
    color: "#f59e0b",
    description: "Building optimized cart"
  },
  checkout: {
    label: "Checkout Agent",
    icon: "🛒",
    color: "#22c55e",
    description: "Finalizing order summary"
  }
};

export const CATEGORY_ICONS = {
  bedding: "🛏️",
  study: "📚",
  kitchen: "🍳",
  storage: "📦",
  electronics: "💡",
  hygiene: "🚿"
};

export const EXAMPLE_QUERIES = [
  "Help me set up my hostel room in Mumbai. Budget ₹15,000 for everything.",
  "I'm a girl moving to a PG in Pune. Need essentials for ₹8,000.",
  "Engineering student, Bangalore hostel, ₹12,000 budget. Focus on study and sleep.",
  "New to Delhi hostel, ₹20,000 total budget. Want good quality items."
];

export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  return "https://meesho-sakhi.onrender.com";
};

