import {
  BookOpen,
  Brush,
  Crown,
  Heart,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  MessageSquare,
  Palette,
  Sparkles,
  Star,
  Type,
} from "lucide-react";
import type { BookLoaderStep } from "./book-generation-loader-types";

export const STORY_LOADER_STEPS: readonly BookLoaderStep[] = [
  {
    id: "world",
    label: "Sketching the world",
    description: "Setting up the universe",
    Icon: Star,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: "characters",
    label: "Casting characters",
    description: "Locking the heroes",
    Icon: Heart,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "palette",
    label: "Choosing colors",
    description: "Building the palette",
    Icon: Palette,
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: "scenes",
    label: "Writing scenes",
    description: "Page-by-page plot",
    Icon: BookOpen,
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "dialogue",
    label: "Drafting dialogue",
    description: "Voice for every character",
    Icon: MessageSquare,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "polish",
    label: "Final polish",
    description: "Ready for review",
    Icon: Crown,
    gradient: "from-yellow-500 to-orange-500",
  },
] as const;

export const COLORING_LOADER_STEPS: readonly BookLoaderStep[] = [
  {
    id: "theme",
    label: "Brainstorming theme",
    description: "Finding the spark",
    Icon: Lightbulb,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: "cover",
    label: "Locking cover scene",
    description: "Hero composition",
    Icon: ImageIcon,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "title",
    label: "Drafting the title",
    description: "Catchy and clear",
    Icon: Type,
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: "pages",
    label: "Outlining pages",
    description: "Subject for each page",
    Icon: Layers,
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "linework",
    label: "Linework prep",
    description: "Clean coloring outlines",
    Icon: Brush,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "polish",
    label: "Final polish",
    description: "Ready for review",
    Icon: Sparkles,
    gradient: "from-yellow-500 to-orange-500",
  },
] as const;
