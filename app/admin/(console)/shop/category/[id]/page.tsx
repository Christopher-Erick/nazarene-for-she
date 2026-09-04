import { CategoryEditor } from "@/components/admin/CategoryEditor";

export default async function AdminShopCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryEditor id={id} />;
}
