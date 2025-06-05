import { Settings, LayoutGrid, LucideIcon } from "lucide-react";

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

export function getMenuList(pathname: string, classList: Menu[]): Group[] {
  if (classList.length === 0) {
    return [
      {
        groupLabel: "",
        menus: [
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutGrid,
            submenus: [],
            active: pathname === "/dashboard",
          },
        ],
      },
      {
        groupLabel: "Manage",
        menus: [
          {
            href: "/dashboard/settings",
            label: "Settings",
            icon: Settings,
            active: pathname === "/dashboard/settings",
          },
        ],
      },
    ];
  }

  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: [],
          active: pathname === "/dashboard",
        },
      ],
    },
    {
      groupLabel: "Classes",
      menus: classList,
    },
    {
      groupLabel: "Manage",
      menus: [
        {
          href: "/dashboard/settings",
          label: "Settings",
          icon: Settings,
          active: pathname === "/dashboard/settings",
        },
      ],
    },
  ];
}
