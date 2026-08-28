import { RequestTray } from "@/components/shop/RequestTray";

export default function ShopLayout({ children }: LayoutProps<"/shop">) {
  return (
    <>
      {children}
      <RequestTray />
    </>
  );
}
