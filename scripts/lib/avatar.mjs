import fs from "node:fs/promises";

/**
 * The single source of truth for the avatar illustration: the header mark, the
 * favicon set and the link-preview card are all cut from this one image, so
 * there is no second artwork (svg or otherwise) to keep in sync.
 */
const AVATAR_URL = "https://sf-cdn.suenyiyang.com/avatar/avatar.jpeg";

/**
 * Reads the avatar. Set `AVATAR_SRC=/path/to/avatar.jpeg` to work from a local
 * file instead of the CDN (handy while re-cropping the icons).
 */
export async function loadAvatar() {
  const src = process.env.AVATAR_SRC ?? AVATAR_URL;

  if (!/^https?:/.test(src)) return fs.readFile(src);

  const response = await fetch(src);
  if (!response.ok) throw new Error(`GET ${src} → ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export const toDataUrl = (buffer, mime = "image/jpeg") =>
  `data:${mime};base64,${buffer.toString("base64")}`;
