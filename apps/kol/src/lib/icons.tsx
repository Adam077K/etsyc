import {
  Hammer,
  Scissors,
  Leaf,
  Diamond,
  ForkKnife,
  PaintBrush,
  Handbag,
  Flame,
  Wine,
  Coffee,
  Sparkle,
  type Icon,
} from "@phosphor-icons/react";
import type { CraftId } from "./fixtures/makers";

/**
 * Phosphor is the single icon system for KOL (founder-set). Craft → glyph map
 * lives here so fixtures stay pure data.
 */
export const CRAFT_ICON: Record<CraftId, Icon> = {
  ceramics: Coffee,
  wood: Hammer,
  textiles: Scissors,
  apothecary: Leaf,
  jewelry: Diamond,
  food: ForkKnife,
  print: PaintBrush,
  leather: Handbag,
  metal: Flame,
  glass: Wine,
};

export const VALUE_ICON = Sparkle;
