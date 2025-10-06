"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound } from "lucide-react";
import useSupabaseBrowser from "@/utils/client";
import { z } from "zod";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { SignOutAllButton } from "@/components/utils/signOutAllButton";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z
  .object({
    password: z.string().trim().min(8),
    confirm: z.string().trim().min(8),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export function SecuritySkeleton() {
  return (
    <div className="rounded-md border bg-card p-6">
      <Skeleton className="mb-6 h-7 w-40" />

      <div className="space-y-6">
        {/* Password fields */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Requirements */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-1 pl-5">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>

        {/* Button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Sign out section */}
      <div className="mt-8 border-t pt-6">
        <Skeleton className="mb-4 h-7 w-48" />
        <div className="flex items-start gap-4">
          <Skeleton className="mt-0.5 h-4 w-4" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SecurityTab() {
  const supabase = useSupabaseBrowser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const tryLogin = async (e: z.infer<typeof formSchema>) => {
    const loadingToast = toast.loading("Updating password...", {
      dismissible: false,
    });
    setIsLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password: e.password,
    });

    if (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message);
      setIsLoading(false);
      return;
    }
    if (data.user) {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        toast.dismiss(loadingToast);
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      return window.location.reload();
    }
  };

  return (
    <div className="rounded-md border bg-card p-6 text-card-foreground">
      <h2 className="mb-6 text-xl font-semibold">Change Password</h2>

      <Form {...form} control={form.control}>
        <form onSubmit={form.handleSubmit(tryLogin)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="password">New Password</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.password?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="confirm">Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.confirm?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <div className="pt-2">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Password requirements:
            </h3>
            <ul
              className={`list-disc space-y-1 pl-5 text-xs text-muted-foreground`}
            >
              <li>At least 6 characters long</li>
              <li>Include at least one uppercase letter</li>
              <li>Include at least one number</li>
              <li>Include at least one special character</li>
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-8 border-t pt-6">
        <h2 className="mb-4 text-xl font-semibold">Log Out of All Devices</h2>
        <div className="flex items-start gap-4">
          <div className="mt-0.5">
            <KeyRound className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              This will sign you out of all your devices, including your
              browser, and you will need to sign in again.
            </p>
            <SignOutAllButton />
          </div>
        </div>
      </div>
    </div>
  );
}
