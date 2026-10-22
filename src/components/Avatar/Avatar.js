"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./Avatar.module.css";

/* Muted tones that sit on the cool paper without competing with the accent.
   Ink text reads on all of them. */
export const AVATAR_TONES = ["#DCE6E6", "#E2E0DA", "#DDE1E8", "#E6DFDF", "#DFE5DC"];

/* The same email always gets the same tone: a small string hash (djb2) of the
   lowercased address, taken modulo the palette. */
export function avatarTone(email) {
  const key = String(email || "").trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function userInitial(user) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  return name.trim()[0]?.toUpperCase() || "?";
}

/* The signed-in user's picture when their provider gives one (Google does),
   otherwise their initial on a tone picked from their email. A picture that
   fails to load falls back to the initial. */
export default function Avatar({ user, size = 32 }) {
  const url = user?.user_metadata?.avatar_url;
  const [failedUrl, setFailedUrl] = useState(null);

  if (url && failedUrl !== url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        unoptimized
        referrerPolicy="no-referrer"
        className={styles.avatar}
        onError={() => setFailedUrl(url)}
      />
    );
  }

  return (
    <span
      className={`${styles.avatar} ${styles.initial}`}
      style={{ width: size, height: size, background: avatarTone(user?.email) }}
      aria-hidden="true"
    >
      {userInitial(user)}
    </span>
  );
}
