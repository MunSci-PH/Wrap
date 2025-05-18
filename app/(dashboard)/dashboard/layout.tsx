import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Wrap",
  description:
    "MunSci's Web-based Real-time Academic Platform (WRAP) is a student grade information system that ensures secure, efficient, and real-time access to academic records.",
};

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
