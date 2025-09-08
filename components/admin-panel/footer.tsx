import Link from "next/link";
import { FaFacebook } from "react-icons/fa6";

export function Footer() {
  return (
    <div
      className={`z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60`}
    >
      <div
        className={`
        mx-4 flex h-14 items-center
        md:mx-8
      `}
      >
        <p
          className={`text-left text-xs leading-loose text-muted-foreground md:text-sm`}
        >
          All Rights Reserved. Muntinlupa Science High School.
        </p>
        <div className="flex flex-1 justify-end gap-4">
          <Link
            className={`
              underline-offset-4
              hover:underline
              md:text-xl
            `}
            href="https://www.facebook.com/profile.php?id=61556414725090"
          >
            <FaFacebook color="default" />
          </Link>
        </div>
      </div>
    </div>
  );
}
