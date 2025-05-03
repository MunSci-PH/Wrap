import Nav from "@/components/app-layout/nav/nav";
import Footer from "@/components/app-layout/footer";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
