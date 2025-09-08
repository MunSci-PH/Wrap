import Link from "next/link";
import Image from "next/image";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu } from "@/components/admin-panel/menu";
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Logo from "@/public/logo.png";

export function SheetMenu() {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button className="h-8" variant="outline" size="icon">
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent
        className={`
        flex h-full flex-col px-3
        sm:w-72
      `}
        side="left"
      >
        <SheetHeader>
          <Button
            className="flex items-center justify-center pt-1 pb-2"
            variant="link"
            asChild
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src={Logo} alt="Logo" className="size-6" />
              <SheetTitle
                className={`
                  animate-change-color bg-linear-to-r from-emerald-600
                  to-green-600 bg-clip-text text-lg font-black text-transparent
                `}
              >
                WRAP
              </SheetTitle>
            </Link>
          </Button>
        </SheetHeader>
        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
}
