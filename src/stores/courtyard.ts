import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type Vec3 = [number, number, number];

export interface NearbyTrigger {
  propId: string;
  label: string;
  onActivate: () => void;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  error?: boolean;
  postCard?: {
    title: string;
    description: string;
    url: string;
  };
}

export type GeminiState =
  | "checking"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available"
  | "error";

export type ActiveModal = "chat" | "posts" | null;

export const PLAYER_SPAWN: Vec3 = [0, 0.45, 3.5];

export const playerPosAtom = atom<Vec3>(PLAYER_SPAWN);
/**
 * Click-to-move destination. Non-null while the player is walking toward a
 * mouse-clicked target; cleared on arrival or any keyboard input.
 */
export const playerTargetAtom = atom<Vec3 | null>(null);
export const nearbyTriggerAtom = atom<NearbyTrigger | null>(null);
export const activeModalAtom = atom<ActiveModal>(null);
export const chatMessagesAtom = atom<ChatMessage[]>([]);
export const geminiStateAtom = atom<GeminiState>("checking");
export const geminiDownloadProgressAtom = atom<number>(0);

/**
 * Whether the visitor has explicitly opted in to download the on-device
 * Gemini Nano model (~22 GB). Persisted in localStorage so we don't re-ask
 * on every visit. "declined" still surfaces a re-enable affordance.
 */
export type ModelConsent = "pending" | "granted" | "declined";
export const modelConsentAtom = atomWithStorage<ModelConsent>(
  "courtyard:model-consent",
  "pending"
);
