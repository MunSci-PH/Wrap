"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useSupabaseBrowser from "@/utils/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    password: z.string().trim().min(8),
    confirm: z.string().trim().min(8),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

const ChangePassword = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });
  const [error, setError] = useState<string>();
  const supabase = useSupabaseBrowser();

  const tryLogin = async (e: z.infer<typeof formSchema>) => {
    const { data, error } = await supabase.auth.updateUser({
      password: e.password,
    });

    if (error) setError(error.message);
    if (data.user) {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) setError(error.message);
      return window.location.reload();
    }
  };

  return (
    <Form {...form} control={form.control}>
      <form onSubmit={form.handleSubmit(tryLogin)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel htmlFor="password">New Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="New Password"
              required
              {...form.register("password")}
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
          <Field data-invalid={!!form.formState.errors.confirm}>
            <FieldLabel htmlFor="confirm">Re-enter Password</FieldLabel>
            <Input
              id="confirm"
              type="password"
              placeholder="Re-enter Password"
              required
              {...form.register("confirm")}
            />
            <FieldError>{form.formState.errors.confirm?.message}</FieldError>
          </Field>
        </CardContent>
        <CardFooter className="mt-5">
          <Button type="submit" className="w-full" variant={"destructive"}>
            Save
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
};
export default ChangePassword;
