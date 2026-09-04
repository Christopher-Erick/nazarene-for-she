import { SuperAdminGate } from "@/components/admin/SuperAdminGate";

export default function RolesLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminGate>{children}</SuperAdminGate>;
}
