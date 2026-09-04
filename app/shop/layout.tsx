import { CartTray } from "@/components/shop/CartTray";
import { ShopCatalogProvider } from "@/components/shop/ShopCatalog";
import { publishedCategories, publishedOrganization, publishedProducts } from "@/lib/cms/public-content";
import { isWhatsAppOrderingEnabled } from "@/lib/shop/whatsapp";
import "./shop.css";

export const revalidate = 60;

export default async function ShopLayout({ children }: LayoutProps<"/shop">) {
  const [categories, products, organization] = await Promise.all([
    publishedCategories(),
    publishedProducts(),
    publishedOrganization(),
  ]);
  return (
    <ShopCatalogProvider categories={categories} products={products}>
      {children}
      <CartTray whatsappEnabled={isWhatsAppOrderingEnabled(organization.whatsapp)} />
    </ShopCatalogProvider>
  );
}
