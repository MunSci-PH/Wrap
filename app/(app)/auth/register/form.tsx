"use client";

import type React from "react";

import { CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useSupabaseBrowser from "@/utils/client";
import { useEffect, useRef, useState } from "react";
import { getSectionsByGrade } from "@/queries/getSectionsByGrade";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_UPLOAD_SIZE = 1024 * 1024 * 50; // 50MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png"];

const formSchema = z
  .object({
    lrn: z.coerce
      .number()
      .refine((v) => `${v}`.length, { message: "Must be 12 digits" }),
    firstname: z.string().trim().min(1).max(50),
    middlename: z.string().trim().max(50).optional(),
    lastname: z.string().min(1).max(50),
    email: z.string().trim().email(),
    password: z
      .string()
      .trim()
      .min(8)
      .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*_-]).{8,}$/),
    confirmp: z
      .string()
      .trim()
      .min(8)
      .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*_-]).{8,}$/),
    grade: z.coerce.number().min(7).max(12),
    section: z.string(),
    pwd: z.boolean(),
    idpic:
      typeof window === "undefined"
        ? z.any()
        : z
            .instanceof(FileList)
            .refine((file) => file?.length == 1, "File is required.")
            .refine(
              (file) => ACCEPTED_FILE_TYPES.includes(file?.item(0)!.type),
              "Invalid file type.",
            )
            .refine(
              (file) => file?.item(0)!.size < MAX_UPLOAD_SIZE,
              "File too large.",
            ),
    birthday: z.date().min(new Date("2000-01-01")).max(new Date("2015-12-31")),
    address: z.string().trim().min(1).max(100),
  })
  .refine((data) => data.confirmp === data.password, {
    message: "Passwords don't match",
    path: ["confirmp"],
  });

const grades = [
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "11", value: 11 },
  { label: "12", value: 12 },
] as const;

const RegisterForm = () => {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lrn: 0,
      firstname: "",
      middlename: "",
      lastname: "",
      email: "",
      password: "",
      confirmp: "",
      grade: 7,
      section: "",
      pwd: false,
      idpic: [],
      birthday: new Date("2015-12-31"),
      address: "",
    },
  });
  const [isLoading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading");
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [idpic, setIdpic] = useState<string>();
  const turnstileRef = useRef<TurnstileInstance>(undefined);
  const fileRef = form.register("idpic");
  const [sectionList, setSectionList] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const sectionList = async () => {
      const sections = await getSectionsByGrade(supabase, 7);
      if (sections) {
        const sectionsList = sections.data?.map((e) => {
          return { label: e.section!, value: e.section! };
        });
        if (sectionsList) {
          setSectionList(sectionsList);
        }
      }
    };
    sectionList();
  }, [supabase]);

  const onGradeChange = async (value: number) => {
    const sectionList = await getSectionsByGrade(supabase, value);

    if (sectionList) {
      const sections = sectionList.data?.map((e) => {
        return { label: e.section!, value: e.section! };
      });
      if (sections) {
        setSectionList(sections);
      }
    }
  };

  fileRef.onChange = async (e) =>
    onPictureChange(e as React.ChangeEvent<HTMLInputElement>);

  const onPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      if (file) {
        const idpic = URL.createObjectURL(file);
        setIdpic(idpic);
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);

    const studentData = {
      lrn: data.lrn.toString(),
      firstname: data.firstname.trim(),
      middlename: data.middlename?.trim() || "",
      lastname: data.lastname.trim(),
      grade: data.grade.toString(),
      section: data.section.trim(),
      pwd: data.pwd.toString(),
      picture: data.idpic.item(0)?.name,
      birthday: data.birthday.toLocaleDateString("en-us"),
      address: data.address.trim(),
    };

    setLoadingText("Registering account");

    const registerAcc = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password.trim(),
      options: { captchaToken: captchaToken, data: studentData },
    });

    if (registerAcc.error) {
      setLoading(false);
      setError(registerAcc.error.message);
      return registerAcc.error;
    }

    setLoadingText("Uploading picture");

    const pictureUpload = await supabase.storage
      .from("idpics")
      .upload(`${data.lrn}/${data.idpic.item(0)!.name}`, data.idpic[0]);

    if (pictureUpload.error) {
      setLoading(false);
      setError(pictureUpload.error.message);
      return pictureUpload.error;
    }

    router.push("/auth/register/success");
  };

  return (
    <>
      <Form {...form} control={form.control}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className={`grid grid-cols-1 gap-4 xl:grid-cols-2`}>
            {error && (
              <Alert variant="destructive" className="xl:col-span-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="lrn">LRN</FieldLabel>
                <FieldDescription>
                  Your LRN is a 12 digit number assigned to you by your school.
                </FieldDescription>
                <Input
                  id="lrn"
                  type="string"
                  inputMode="numeric"
                  placeholder="LRN"
                  required
                  {...form.register("lrn")}
                />
                <FieldError
                  errors={
                    form.formState.errors.lrn
                      ? [form.formState.errors.lrn]
                      : undefined
                  }
                />
              </Field>
              <Separator />
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <FieldDescription>
                  This email will be used for authenticating in the dashboard.
                </FieldDescription>
                <Input
                  id="email"
                  type="string"
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
                <FieldDescription>
                  Your password must be at least 8 characters long and include
                  at least one uppercase letter, one lowercase letter, one
                  number, and one special character.
                </FieldDescription>
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
              <Field>
                <FieldLabel htmlFor="confirmp">Confirm Password</FieldLabel>
                <Input
                  id="confirmp"
                  type="password"
                  placeholder="Confirm Password"
                  required
                  {...form.register("confirmp")}
                />
                <FieldError
                  errors={
                    form.formState.errors.confirmp
                      ? [form.formState.errors.confirmp]
                      : undefined
                  }
                />
              </Field>
              <Separator />
              <div
                className={`
                flex flex-1 flex-col gap-2 align-bottom
                md:flex-row
              `}
              >
                <Field className="w-full">
                  <FieldLabel htmlFor="firstname">Name</FieldLabel>
                  <Input
                    id="firstname"
                    type="string"
                    placeholder="First Name"
                    required
                    {...form.register("firstname")}
                  />
                  <FieldError
                    errors={
                      form.formState.errors.firstname
                        ? [form.formState.errors.firstname]
                        : undefined
                    }
                  />
                </Field>
                <Field className="mt-auto w-full">
                  <Input
                    id="middlename"
                    type="string"
                    placeholder="Middle Name"
                    {...form.register("middlename")}
                  />
                  <FieldError
                    errors={
                      form.formState.errors.middlename
                        ? [form.formState.errors.middlename]
                        : undefined
                    }
                  />
                </Field>
                <Field className="mt-auto w-full">
                  <Input
                    id="lastname"
                    type="string"
                    placeholder="Last Name"
                    required
                    {...form.register("lastname")}
                  />
                  <FieldError
                    errors={
                      form.formState.errors.lastname
                        ? [form.formState.errors.lastname]
                        : undefined
                    }
                  />
                </Field>
              </div>
              <Separator />
              <div
                className={`
                flex flex-1 flex-col gap-2 align-bottom
                md:flex-row
              `}
              >
                <Field className="flex w-full flex-col">
                  <FieldLabel htmlFor="grade">Grade</FieldLabel>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("grade", Number(value));
                      onGradeChange(Number(value));
                    }}
                    defaultValue={form.watch("grade").toString()}
                    required
                  >
                    <SelectTrigger id="grade" className="w-full">
                      <SelectValue placeholder="Select your grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem
                          value={grade.value.toString()}
                          key={grade.value}
                        >
                          {grade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={
                      form.formState.errors.grade
                        ? [form.formState.errors.grade]
                        : undefined
                    }
                  />
                </Field>
                <Field className="flex w-full flex-col">
                  <FieldLabel htmlFor="section">Section</FieldLabel>
                  <Select
                    onValueChange={(value) => form.setValue("section", value)}
                    defaultValue={form.watch("section")}
                    disabled={!sectionList.length}
                    required
                  >
                    <SelectTrigger id="section" className="w-full">
                      <SelectValue placeholder="Select your section." />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionList.map((section) => (
                        <SelectItem value={section.value} key={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={
                      form.formState.errors.section
                        ? [form.formState.errors.section]
                        : undefined
                    }
                  />
                </Field>
              </div>
              <Separator className="xl:hidden" />
            </div>
            <div className="space-y-4">
              <Field className="flex w-full flex-col">
                <FieldLabel htmlFor="idpic">Picture</FieldLabel>
                <FieldDescription>
                  Please upload a recent and valid picture of yourself. The
                  picture must have a plain background.
                </FieldDescription>
                <Image
                  src={idpic ? idpic : "https://avatar.iran.liara.run/public"}
                  alt="ID Picture"
                  width={200}
                  height={200}
                  draggable={false}
                  className={`self-center rounded-full xl:size-60`}
                />
                <Input id="idpic" type="file" required {...fileRef} />
                <FieldError
                  errors={
                    form.formState.errors.idpic
                      ? [form.formState.errors.idpic]
                      : undefined
                  }
                />
              </Field>
              <Separator />
              <div
                className={`
                flex flex-1 flex-col gap-2 align-bottom
                md:flex-row
              `}
              >
                <Field className="w-full">
                  <FieldLabel htmlFor="birthday">Date of Birth</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="birthday"
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !form.watch("birthday") && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("birthday") ? (
                          format(form.watch("birthday"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        startMonth={new Date("2000-01-01")}
                        endMonth={new Date("2015-12-31")}
                        yearFocus={false}
                        selected={form.watch("birthday")}
                        onSelect={(date) =>
                          date && form.setValue("birthday", date)
                        }
                        disabled={(date) =>
                          date > new Date("2015-12-31") ||
                          date < new Date("2000-01-01")
                        }
                        defaultMonth={form.watch("birthday")}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError
                    errors={
                      form.formState.errors.birthday
                        ? [form.formState.errors.birthday]
                        : undefined
                    }
                  />
                </Field>
              </div>
              <Field className="w-full">
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input
                  id="address"
                  type="string"
                  placeholder="Home Address"
                  required
                  {...form.register("address")}
                />
                <FieldError
                  errors={
                    form.formState.errors.address
                      ? [form.formState.errors.address]
                      : undefined
                  }
                />
              </Field>
              <div
                className={`
                flex flex-1 flex-col gap-2 align-bottom
                md:flex-row
              `}
              >
                <Field
                  className={`flex w-full flex-row items-start space-y-0 space-x-3 rounded-md border p-4 hover:bg-secondary`}
                  orientation="horizontal"
                >
                  <Checkbox
                    id="pwd"
                    checked={form.watch("pwd")}
                    onCheckedChange={(checked) =>
                      form.setValue("pwd", checked as boolean)
                    }
                  />
                  <FieldLabel htmlFor="pwd" className="cursor-pointer">
                    Are you a person with disability?
                  </FieldLabel>
                </Field>
              </div>
            </div>

            <Button
              type="submit"
              className="xl:col-span-2"
              disabled={isLoading || captchaLoading}
            >
              {isLoading || captchaLoading ? (
                <span
                  className={`flex flex-1 flex-row items-center justify-center gap-1`}
                >
                  <Loader2 className="animate-spin" />
                  {loadingText}
                </span>
              ) : (
                "Sign Up"
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
              className={`mx-auto xl:col-span-2`}
            />
          </CardContent>
        </form>
      </Form>
    </>
  );
};

export default RegisterForm;
