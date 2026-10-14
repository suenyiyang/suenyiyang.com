import type { ComponentType, ElementType } from "react";
import type { ThoughtMetadata } from "../../config/thoughts";

export type Thought = ThoughtMetadata & {
  Body: ComponentType<{ components?: Record<string, ElementType> }>;
};
