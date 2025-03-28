import SidebarLayout from "@/components/Layout/SidebarLayout";

export default function WorkPage() {
  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-4xl font-bold mb-12"
          style={{ viewTransitionName: "page-title" }}
        >
          Work
        </h1>
        <div className="space-y-12">
          <p>Work page content coming soon</p>
        </div>
      </div>
    </SidebarLayout>
  );
}
