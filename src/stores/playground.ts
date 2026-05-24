import { atom } from "jotai";

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
export const nearbyTriggerAtom = atom<NearbyTrigger | null>(null);
export const activeModalAtom = atom<ActiveModal>(null);
export const chatMessagesAtom = atom<ChatMessage[]>([]);
export const geminiStateAtom = atom<GeminiState>("checking");
export const geminiDownloadProgressAtom = atom<number>(0);
