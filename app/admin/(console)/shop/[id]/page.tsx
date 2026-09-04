import { ShopRecordGate } from "@/components/admin/ShopRecordGate";

export default async function AdminShopLegacyPiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShopRecordGate id={id} />;
}
