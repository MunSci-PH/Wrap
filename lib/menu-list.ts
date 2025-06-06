import { Users, Settings, LayoutGrid, LucideIcon } from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Manage",
      menus: [
        {
          href: "/dashboard/users",
          label: "Users",
          icon: Users,
        },
        {
          href: "/dashboard/settings",
          label: "Settings",
          icon: Settings,
        },
      ],
    },
  ];
}
