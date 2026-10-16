import type { Metadata } from "next";
import "./admin.css";

/** The admin desk is private: keep it out of search results and drop the site canonical. */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  alternates: {},
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
