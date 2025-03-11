"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { useState } from "react";
import Logo from "@/public/logo.png";
import Image from "next/image";
import Link from "next/link";
import useSupabaseBrowser from "@/utils/client";
import { useQuery } from "@tanstack/react-query";
import getUserInfo from "./getuserinfo";

const Nav = () => {
  const supabase = useSupabaseBrowser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const userInfo = useQuery({
    queryKey: ["userInfo"],
    queryFn: getUserInfo,
  });

  if (userInfo.isLoading)
    return (
      <>
        <header className="flex h-16 items-center border-b px-4 lg:px-6">
          <Button variant={"ghost"} asChild>
            <Link className="flex items-center justify-center" href="/">
              <Image src={Logo} alt="Logo" className="size-6" />
              <span className="text-lg font-semibold">WRAP</span>
            </Link>
          </Button>
          <nav className="ml-auto hidden gap-4 sm:gap-6 md:flex">
            <Button variant={"outline"} disabled>
              <Loader2 className="animate-spin" />
            </Button>
          </nav>
          <Button
            className="ml-auto md:hidden"
            variant="outline"
            size="icon"
            aria-label="Toggle Menu"
            disabled
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Loader2 className="size-6 animate-spin" />
            </motion.div>
          </Button>
        </header>
      </>
    );

  if (!userInfo.isLoading && userInfo.data?.data.user) {
    return (
      <>
        <header className="flex h-16 items-center border-b px-4 lg:px-6">
          <Button variant={"ghost"} asChild>
            <Link className="flex items-center justify-center" href="/">
              <Image src={Logo} alt="Logo" className="size-6" />
              <span className="text-lg font-semibold">WRAP</span>
            </Link>
          </Button>
          <nav className="ml-auto hidden gap-4 sm:gap-6 md:flex">
            <Button variant={"outline"} asChild>
              <Link href="/dashboard">Home</Link>
            </Button>
            {userInfo.data?.data.role?.isAdmin && (
              <Button variant={"outline"} asChild>
                <Link href="/dashboard/admin/search">Search</Link>
              </Button>
            )}
            <Button variant={"outline"} asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </Button>
            <Button
              variant={"default"}
              /**onClick={async () => {
                const { error } = await supabase.auth.signOut({
                  scope: "local",
                });
                if (error) throw error;
                return window.location.reload();
              }}*/
              type="button"
            >
              Sign Out
            </Button>
          </nav>
          <Button
            className="ml-auto md:hidden"
            variant="outline"
            size="icon"
            aria-label="Toggle Menu"
            onClick={toggleMenu}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </motion.div>
          </Button>
        </header>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              className="border-b px-4 py-2 md:hidden"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                className="block py-2 text-sm font-medium underline-offset-4 hover:underline"
                href="/dashboard"
              >
                Home
              </Link>
              {userInfo.data?.data.role?.isAdmin && (
                <Link
                  className="block py-2 text-sm font-medium underline-offset-4 hover:underline"
                  href="/dashboard/admin/search"
                >
                  Search
                </Link>
              )}
              <Link
                className="block py-2 text-sm font-medium underline-offset-4 hover:underline"
                href="/dashboard/settings"
              >
                Settings
              </Link>
              <Button
                variant={"default"}
                onClick={async () => {
                  const { error } = await supabase.auth.signOut({
                    scope: "local",
                  });
                  if (error) throw error;
                  return window.location.reload();
                }}
                type="button"
                className="my-2 w-full"
              >
                Sign Out
              </Button>
            </motion.nav>
          )}
        </AnimatePresence>
      </>
    );
  }
  if (!userInfo.isLoading) {
    return (
      <>
        <header className="flex h-16 items-center border-b px-4 lg:px-6">
          <Button variant={"ghost"} asChild>
            <Link className="flex items-center justify-center" href="/">
              <Image src={Logo} alt="Logo" className="size-6" />
              <span className="text-lg font-semibold">WRAP</span>
            </Link>
          </Button>
          <nav className="ml-auto hidden gap-4 sm:gap-6 md:flex">
            <Button variant={"outline"} asChild>
              <Link href="/auth/register">Sign Up</Link>
            </Button>
            <Button variant={"default"} asChild>
              <Link href="/dashboard">Sign In</Link>
            </Button>
          </nav>
          <Button
            className="ml-auto md:hidden"
            variant="outline"
            size="icon"
            aria-label="Toggle Menu"
            onClick={toggleMenu}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </motion.div>
          </Button>
        </header>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              className="border-b px-4 py-2 md:hidden"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Button variant={"outline"} className="my-2 w-full" asChild>
                <Link href="/auth/register">Sign Up</Link>
              </Button>
              <Button variant={"default"} className="my-2 w-full" asChild>
                <Link href="/dashboard">Sign In</Link>
              </Button>
            </motion.nav>
          )}
        </AnimatePresence>
      </>
    );
  }
};

export default Nav;
