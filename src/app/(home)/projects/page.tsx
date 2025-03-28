import SidebarLayout from "@/components/Layout/SidebarLayout";

export default function ProjectsPage() {
  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-4xl font-bold mb-12"
          style={{ viewTransitionName: "page-title" }}
        >
          Projects
        </h1>
        <div className="space-y-12">
          <p>Projects page content coming soon</p>
        </div>
      </div>
    </SidebarLayout>
  );
}
