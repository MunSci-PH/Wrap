"use client";

import Link from "next/link";
import { LayoutGrid, LoaderCircle, LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useSupabaseBrowser from "@/utils/client";
import { useQuery } from "@tanstack/react-query";

export function UserNav() {
  const supabase = useSupabaseBrowser();

  const getUser = async () => {
    const user_data = await supabase.auth.getUser();

    if (!user_data.data) return null;
    return user_data.data;
  };

  const user = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const getUserPicture = async () => {
    const user = await getUser();

    if (!user?.user) return "#";

    const user_picture = await supabase.storage
      .from("idpics")
      .createSignedUrl(
        `${user?.user.user_metadata?.lrn}/${user?.user.user_metadata?.picture}`,
        3600
      );

    if (!user_picture.data) return "#";

    return user_picture.data?.signedUrl;
  };

  const userPicture = useQuery({
    queryKey: ["user_picture"],
    queryFn: getUserPicture,
  });

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={userPicture ? userPicture.data : "#"}
                    alt="Avatar"
                  />
                  <AvatarFallback className="bg-transparent">
                    <LoaderCircle className="animate-spin" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{`${user.data?.user?.user_metadata?.firstname} ${user.data?.user?.user_metadata?.middlename.charAt(0)}${user.data?.user?.user_metadata?.middlename ? "." : ""} ${user.data?.user?.user_metadata?.lastname}`}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.data?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/dashboard" className="flex items-center">
              <LayoutGrid className="mr-3 h-4 w-4 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/dashboard/settings" className="flex items-center">
              <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={async () => {
            const { error } = await supabase.auth.signOut({ scope: "local" });
            if (error) throw error;
            return window.location.reload();
          }}
        >
          <LogOut className="mr-3 h-4 w-4 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
