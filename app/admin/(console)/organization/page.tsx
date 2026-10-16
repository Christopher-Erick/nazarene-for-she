import { LeadershipEditor } from "@/components/admin/LeadershipEditor";
import { OrganizationEditor } from "@/components/admin/OrganizationEditor";

export default function OrganizationPage() {
  return (
    <div className="admin-stack">
      <OrganizationEditor />
      <LeadershipEditor />
    </div>
  );
}
