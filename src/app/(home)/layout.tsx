import { Navigation } from "./_components/Navigation";
import { PageTitle } from "./_components/pageTitle";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row gap-20 px-44 py-8 max-md:gap-10 max-md:px-20 max-md:py-4">
      <Navigation />
      <div className="relative flex flex-col gap-4 flex-1">
        <PageTitle />
        <div className="mt-[80px]">{children}</div>
      </div>
    </div>
  );
}
