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
import { getUserById } from "@/queries/getUserById";
import { getUser } from "@/queries/getUser";

export function UserNav() {
  const supabase = useSupabaseBrowser();

  const user = useQuery({
    queryKey: ["user", supabase],
    queryFn: () => getUser(supabase),
  });

  const getUserPicture = async () => {
    if (!user?.data?.data) return "#";
    const user_data = await getUserById(supabase, user.data.data.user!.id);

    if (user_data.error) return "#";

    const user_picture = await supabase.storage
      .from("idpics")
      .createSignedUrl(
        `${user_data.data.lrn}/${user_data.data.picture}`,
        3600,
      );

    if (!user_picture.data) return "#";

    return user_picture.data?.signedUrl;
  };

  const userPicture = useQuery({
    queryKey: ["user_picture"],
    queryFn: getUserPicture,
    enabled: !!user.data
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
            <p className="text-sm leading-none font-medium">{`${user.data?.data.user!.user_metadata?.firstname} ${user.data?.data.user!.user_metadata?.middlename.charAt(0)}${user.data?.data.user!.user_metadata?.middlename ? "." : ""} ${user.data?.data.user!.user_metadata?.lastname}`}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.data?.data.user!.email}
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
