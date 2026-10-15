import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/admin/reset-password">) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
