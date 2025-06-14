"use client";

import Link from "next/link";
import { Ellipsis, LogOut, Notebook } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/admin-panel/collapse-menu-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import useSupabaseBrowser from "@/utils/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEnrolledClasses } from "@/queries/getEnrolledClasses";
import { Menu as MenuType } from "@/lib/menu-list";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const supabase = useSupabaseBrowser();
  const pathname = usePathname();
  const [menuList, setMenuList] = useState(getMenuList(pathname, []));

  useQuery({
    queryKey: ["enrolledClasses", pathname, supabase],
    queryFn: async () => {
      const classes = await getEnrolledClasses(supabase);
      const user = await supabase.auth.getUser();

      const list: MenuType[] = classes.map((classData) => ({
        href: `/dashboard/class/${classData.id}`,
        label: classData.name,
        icon: Notebook,
        submenus:
          classData.owner == user.data.user?.id
            ? [
                {
                  href: `/dashboard/class/${classData.id}/home`,
                  label: "Home",
                  active:
                    pathname === `/dashboard/class/${classData.id}/classview`,
                },
                {
                  href: `/dashboard/class/${classData.id}/grading`,
                  label: "Grading",
                  active:
                    pathname === `/dashboard/class/${classData.id}/classview`,
                },
                {
                  href: `/dashboard/class/${classData.id}/settings`,
                  label: "Settings",
                  active:
                    pathname === `/dashboard/class/${classData.id}/classview`,
                },
              ]
            : [],
      }));

      if (list.length === 0) {
        setMenuList(getMenuList(pathname, []));
        return null;
      }
      setMenuList(getMenuList(pathname, list));
      return null;
    },
  });

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) =>
                  !submenus || submenus.length === 0 ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                (active === undefined &&
                                  pathname.startsWith(href)) ||
                                active
                                  ? "secondary"
                                  : "ghost"
                              }
                              className="w-full justify-start h-10 mb-1"
                              asChild
                            >
                              <Link href={href}>
                                <span
                                  className={cn(isOpen === false ? "" : "mr-4")}
                                >
                                  <Icon size={18} />
                                </span>
                                <p
                                  className={cn(
                                    "max-w-[200px] truncate",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100"
                                  )}
                                >
                                  {label}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={
                          active === undefined
                            ? pathname.startsWith(href)
                            : active
                        }
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  )
              )}
            </li>
          ))}
          <li className="w-full grow flex items-end">
            <TooltipProvider disableHoverableContent>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={async () => {
                      const { error } = await supabase.auth.signOut({
                        scope: "local",
                      });
                      if (error) throw error;
                      return window.location.reload();
                    }}
                    variant="outline"
                    className="w-full justify-center h-10 mt-5"
                  >
                    <span className={cn(isOpen === false ? "" : "mr-4")}>
                      <LogOut size={18} />
                    </span>
                    <p
                      className={cn(
                        "whitespace-nowrap",
                        isOpen === false ? "opacity-0 hidden" : "opacity-100"
                      )}
                    >
                      Sign out
                    </p>
                  </Button>
                </TooltipTrigger>
                {isOpen === false && (
                  <TooltipContent side="right">Sign out</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}
