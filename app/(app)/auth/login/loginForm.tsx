"use client";
import { Form } from "@/components/ui/form";
import useSupabaseBrowser from "@/utils/client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { redirect } from "next/navigation";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export type loginData = {
  email: string;
  password: string;
  captchaToken: string;
};

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [isLoading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [error, setError] = useState<string>();
  const turnstileRef = useRef<TurnstileInstance>(undefined);
  const supabase = useSupabaseBrowser();

  const tryLogin = async (e: z.infer<typeof formSchema>) => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: e.email,
      password: e.password,
      options: { captchaToken: captchaToken },
    });

    if (error) {
      if (error.message == "Email not confirmed") {
        redirect(`/auth/login/confirm?email=${e.email}`);
      }
      setError(error.message);
      turnstileRef.current?.reset();
      setCaptchaLoading(true);
      setLoading(false);

      return;
    }

    return (window.location.href = "/dashboard");
  };

  return (
    <Form {...form} control={form.control}>
      <form onSubmit={form.handleSubmit(tryLogin)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="inline-flex items-center gap-2">
                <ShieldAlert size={24} />
                {error}
              </AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              required
              {...form.register("email")}
            />
            <FieldError
              errors={
                form.formState.errors.email
                  ? [form.formState.errors.email]
                  : undefined
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              required
              {...form.register("password")}
            />
            <FieldError
              errors={
                form.formState.errors.password
                  ? [form.formState.errors.password]
                  : undefined
              }
            />
          </Field>
          <div>
            <Link
              href="/auth/password/reset"
              className={`
                text-sm
                hover:underline
              `}
            >
              Forgot your password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-1 flex-col gap-4">
          <Button
            type="submit"
            disabled={isLoading || captchaLoading}
            className="w-full"
          >
            {isLoading || captchaLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_CF_SITEKEY!}
            onSuccess={(token) => {
              setCaptchaLoading(false);
              setCaptchaToken(token);
            }}
            onExpire={() => {
              setCaptchaLoading(true);
              setCaptchaToken("");
              turnstileRef.current?.reset();
            }}
            onError={(e) => {
              setError(e);
              console.error(e);
            }}
          />
        </CardFooter>
      </form>
    </Form>
  );
};
export default LoginForm;
