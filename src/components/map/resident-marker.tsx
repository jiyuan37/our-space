"use client";
import { ResidentAvatar } from "@/components/avatar/resident-avatar";

// MAP-01A 只有非地理人物快捷入口；无经授权坐标时不画地图 pin。
export function ResidentMarker({
  id,
  name,
  avatarUrl,
  selected,
  onSelect,
}: {
  id: string;
  name: string;
  avatarUrl: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className="resident-marker"
      type="button"
      onClick={onSelect}
      aria-expanded={selected}
      aria-controls={`resident-details-${id}`}
    >
      <ResidentAvatar key={avatarUrl} url={avatarUrl} name={name} />
      <span>{name}</span>
    </button>
  );
}
