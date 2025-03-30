import { Navigation } from "./_components/Navigation";
import { PageTitle } from "./_components/pageTitle";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row gap-20 px-11">
      <Navigation />
      <div className="flex flex-col gap-4 flex-1">
        <PageTitle />
        <div>{children}</div>
      </div>
    </div>
  );
}
