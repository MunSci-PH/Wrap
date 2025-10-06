import type { Metadata } from "next";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RegisterForm from "./form";

export const metadata: Metadata = {
  title: "Information Registration | STERCOIN",
  description: "Student Emergency Release Contact Information",
};

export default async function InfoReg() {
  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center px-4 py-8">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription className="leading-relaxed text-balance">
            Disclaimer: This form is hosted on a secure server and can only be
            viewed by the school authority. Please feel confident in filling out
            this form, as all of your information will be kept safe with every
            step of the process. This web application respects confidentiality
            agreement.
          </CardDescription>
        </CardHeader>
        <RegisterForm />
      </Card>
    </main>
  );
}
