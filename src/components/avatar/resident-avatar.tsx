"use client";
import { useState } from "react";
export function ResidentAvatar({
  url,
  name,
}: {
  url: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const safe = url && /^\/api\/avatar\/assets\/[a-zA-Z0-9_-]+$/.test(url);
  // 已授权媒体不经公共图片优化缓存；读取时逐次校验 ACTIVE membership。
  return safe && !failed ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="resident-pixel-avatar"
      src={url}
      alt=""
      width="76"
      height="76"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="resident-avatar" aria-hidden="true">
      {Array.from(name.trim()).slice(0, 2).join("").toUpperCase() || "OS"}
    </span>
  );
}
