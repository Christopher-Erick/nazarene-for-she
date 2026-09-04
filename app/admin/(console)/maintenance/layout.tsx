import { SuperAdminGate } from "@/components/admin/SuperAdminGate";

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminGate>{children}</SuperAdminGate>;
}
