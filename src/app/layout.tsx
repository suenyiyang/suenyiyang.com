import type { Metadata } from "next/types";
import "./globals.css";
import { BlogLayout } from "@/components/Layout";

export const metadata: Metadata = {
  title: "Yiyang's Blog",
  keywords: ["Frontend", "前端", "Yiyang Suen", "孙轶扬"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BlogLayout>{children}</BlogLayout>
      </body>
    </html>
  );
}
