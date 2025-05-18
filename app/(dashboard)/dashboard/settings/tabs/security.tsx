"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound } from "lucide-react";
import useSupabaseBrowser from "@/utils/client";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { SignOutAllButton } from "@/components/utils/signOutAllButton";

const formSchema = z
  .object({
    password: z.string().trim().min(8),
    confirm: z.string().trim().min(8),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

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
    <div className="border rounded-md p-6">
      <h2 className="text-xl font-semibold mb-6">Change Password</h2>

      <Form {...form} control={form.control}>
        <form onSubmit={form.handleSubmit(tryLogin)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Password requirements:
            </h3>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
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

      <div className="mt-8 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Log Out of All Devices</h2>
        <div className="flex items-start gap-4">
          <div className="mt-0.5">
            <KeyRound className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-4">
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
