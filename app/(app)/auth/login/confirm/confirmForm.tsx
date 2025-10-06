"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useSupabaseBrowser from "@/utils/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email(),
});

const ConfirmForm = ({ email }: { email: string }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: email },
  });
  const [isLoading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [error, setError] = useState<string>();
  const turnstileRef = useRef<TurnstileInstance>(undefined);
  const supabase = useSupabaseBrowser();

  const tryLogin = async (e: z.infer<typeof formSchema>) => {
    setLoading(true);
    if (!e.email) e.email = email;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: e.email,
      options: {
        captchaToken: captchaToken,
      },
    });

    if (error) {
      setError(error.message);
      console.error(error);
      setCaptchaLoading(true);
      turnstileRef.current?.reset();
      setLoading(false);

      return;
    }

    window.location.href = "/auth/login";
  };

  return (
    <Form {...form} control={form.control}>
      <form onSubmit={form.handleSubmit(tryLogin)} className="space-y-4">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...form.register("email")}
              disabled={email ? true : false}
              required
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
        </CardContent>
        <CardFooter className="flex flex-1 flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || captchaLoading}
          >
            {isLoading || captchaLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Confirm Email"
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
export default ConfirmForm;
