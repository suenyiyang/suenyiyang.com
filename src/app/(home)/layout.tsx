import { Header } from "@/components/Header";
import { Navigation } from "./_components/Navigation";
import { PageTitle } from "./_components/pageTitle";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Header />
      <div className="flex flex-row gap-4">
        <Navigation />
        <div className="flex flex-col gap-4">
          <PageTitle />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
