import { Playfair_Display } from "next/font/google";

// Elegant italic serif used for back-cover taglines — matches the
// "Garamond / Caslon / Playfair Display italic" look the AI rendered.
export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
});

export const PLAYFAIR_FAMILY = playfairDisplay.style.fontFamily;
