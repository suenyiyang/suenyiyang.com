export {};

declare global {
  type LanguageModelAvailability =
    | "unavailable"
    | "downloadable"
    | "downloading"
    | "available";

  interface LanguageModelMessage {
    role: "system" | "user" | "assistant";
    content: string;
  }

  interface LanguageModelTool {
    name: string;
    description: string;
    inputSchema: object;
    execute: (input: unknown) => Promise<unknown>;
  }

  interface LanguageModelExpectedIO {
    type: "text";
    languages?: string[];
  }

  interface LanguageModelCreateOptions {
    initialPrompts?: LanguageModelMessage[];
    tools?: LanguageModelTool[];
    expectedInputs?: LanguageModelExpectedIO[];
    expectedOutputs?: LanguageModelExpectedIO[];
    monitor?: (target: EventTarget) => void;
    signal?: AbortSignal;
  }

  interface LanguageModelSession {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    promptStreaming(
      input: string,
      options?: { signal?: AbortSignal }
    ): AsyncIterable<string>;
    destroy(): void;
  }

  interface Window {
    LanguageModel?: {
      availability(): Promise<LanguageModelAvailability>;
      create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
    };
  }
}
