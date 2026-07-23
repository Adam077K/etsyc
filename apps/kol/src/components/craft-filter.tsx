"use client";

import { CRAFTS, type CraftId } from "@/lib/fixtures/makers";
import { CRAFT_ICON } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type Filter = CraftId | "all";

export function CraftFilter({
  active,
  onChange,
  counts,
}: {
  active: Filter;
  onChange: (f: Filter) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip
        label="All makers"
        selected={active === "all"}
        onClick={() => onChange("all")}
      />
      {CRAFTS.map((craft) => {
        const Icon = CRAFT_ICON[craft.id];
        return (
          <Chip
            key={craft.id}
            label={craft.label}
            icon={<Icon size={17} weight={active === craft.id ? "fill" : "regular"} />}
            selected={active === craft.id}
            muted={counts[craft.id] === 0}
            onClick={() => onChange(craft.id)}
          />
        );
      })}
    </div>
  );
}

function Chip({
  label,
  icon,
  selected,
  muted,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  selected: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 font-ui text-sm font-medium transition-all duration-300",
        selected
          ? "border-marigold bg-marigold text-ink"
          : "border-bone/25 text-bone/85 hover:border-bone/60 hover:text-bone",
        muted && !selected && "text-bone/45",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
