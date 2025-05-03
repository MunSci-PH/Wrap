import Link from "next/link";
import { FaFacebook } from "react-icons/fa6";

export function Footer() {
  return (
    <div className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 md:mx-8 flex h-14 items-center">
        <p className="text-xs md:text-sm leading-loose text-muted-foreground text-left">
          All Rights Reserved. Muntinlupa Science High School.
        </p>
        <div className="flex-1 flex justify-end gap-4">
          <Link
            className=" underline-offset-4 hover:underline md:text-xl"
            href="https://www.facebook.com/profile.php?id=61556414725090"
          >
            <FaFacebook color="default" />
          </Link>
        </div>
      </div>
    </div>
  );
}
