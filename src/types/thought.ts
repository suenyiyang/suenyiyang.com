import type { ComponentType, ElementType } from "react";
import type { ThoughtMetadata } from "../../config/thoughts";

export type Thought = ThoughtMetadata & {
  content: string;
  Body: ComponentType<{
    components?: Record<string, ElementType>;
  }>;
};
export type ThoughtThread = {
  id: string;
  title: string;
  notes: Thought[];
  root: Thought;
  featured: boolean;
};
