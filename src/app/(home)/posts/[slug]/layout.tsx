import { ReactNode } from "react";

export default function PostLayout({ children }: { children: ReactNode }) {
  return <article className="max-w-3xl mx-auto py-8">{children}</article>;
}
