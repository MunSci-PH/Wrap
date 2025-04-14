"use client";

import { CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useRef, useState } from "react";
import { getSectionsByGrade } from "@/queries/getSectionsByGrade";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { isValidPhoneNumber } from "react-phone-number-input";
import { TablesInsert } from "../../../database.types";
import { storageClient } from "@/utils/storage";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
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
    lrn: z
      .string()
      .length(12, "Must be 12 characters.")
      .refine(
        (v) => {
          const n = Number(v);
          console.log(v.length, v);
          return !isNaN(n) && v?.length > 0;
        },
        { message: "Must be a number" }
      ),
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
    grade: z.number().min(7).max(12),
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
              "Invalid file type."
            )
            .refine(
              (file) => file?.item(0)!.size < MAX_UPLOAD_SIZE,
              "File too large."
            ),
    birthday: z.date().min(new Date("2000-01-01")).max(new Date("2015-12-31")),
    address: z.string().trim().min(1).max(100),
    e1Name: z.string().trim().min(1).max(100),
    e1FB: z.string().trim().min(1).url(),
    e1Res: z.string().trim().min(1, "Must select an option.").max(50),
    e1Num: z
      .string()
      .trim()
      .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
    e2Name: z.string().trim().min(1).max(100),
    e2FB: z.string().trim().min(1).url(),
    e2Res: z.string().trim().min(1, "Must select an option.").max(50),
    e2Num: z
      .string()
      .trim()
      .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
    e3Name: z.string().trim().max(100).optional(),
    e3FB: z.string().trim().url().or(z.literal("")),
    e3Res: z.string().trim().max(50).optional(),
    e3Num: z
      .string()
      .trim()
      .refine(isValidPhoneNumber, { message: "Invalid phone number" })
      .optional()
      .or(z.literal("")),
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

/** const relationships = [
  { label: "Parent", value: "Parent" },
  { label: "Guardian", value: "Guardian" },
  { label: "Sibling", value: "Sibling" },
  { label: "Other", value: "Other" },
] as const;
*/

const RegisterForm = ({
  sections,
}: {
  sections: { label: string; value: string }[];
}) => {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lrn: "",
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
      e1Name: "",
      e1FB: "",
      e1Res: "",
      e1Num: "",
      e2Name: "",
      e2FB: "",
      e2Res: "",
      e2Num: "",
      e3Name: "",
      e3FB: "",
      e3Res: "",
      e3Num: "",
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
  const [sectionList, setSectionList] =
    useState<{ label: string; value: string }[]>(sections);

  const onGradeChange = async (value: number) => {
    const sectionList = await getSectionsByGrade(supabase, value);

    if (sectionList) {
      const sections = sectionList.data?.map((e) => {
        return { label: e.sectionName!, value: e.sectionName! };
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
    console.log(data);

    const studentData: TablesInsert<"studentData"> = {
      lrn: Number(data.lrn.trim()),
      email: data.email.trim(),
      firstname: data.firstname.trim(),
      middlename: data.middlename?.trim(),
      lastname: data.lastname.trim(),
      grade: data.grade,
      section: data.section.trim(),
      pwd: data.pwd,
      idpicfile: data.idpic.item(0)?.name,
      birthday: data.birthday.toLocaleDateString("en-us"),
      address: data.address.trim(),
      ecname1: data.e1Name.trim(),
      ecfb1: data.e1FB.trim(),
      ecres1: data.e1Res.trim(),
      ecnum1: data.e1Num.trim(),
      ecname2: data.e2Name.trim(),
      ecfb2: data.e2FB.trim(),
      ecres2: data.e2Res.trim(),
      ecnum2: data.e2Num.trim(),
      ecname3: data.e3Name?.trim(),
      ecfb3: data.e3FB?.trim(),
      ecres3: data.e3Res?.trim(),
      ecnum3: data.e3Num?.trim(),
    };

    setLoadingText("Uploading data to database");

    const dataUpload = await supabase.from("studentData").insert(studentData);

    if (dataUpload.error) {
      setLoading(false);
      setError(dataUpload.error.message);
      return dataUpload.error;
    }

    setLoadingText("Uploading picture");

    const pictureUpload = await storageClient
      .from("idpics")
      .upload(`${data.lrn}/${data.idpic.item(0)!.name}`, data.idpic[0]);

    if (pictureUpload.error) {
      setLoading(false);
      setError(pictureUpload.error.message);
      return pictureUpload.error;
    }

    setLoadingText("Registering account");

    const registerAcc = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password.trim(),
      options: { captchaToken: captchaToken },
    });

    if (registerAcc.error) {
      setLoading(false);
      setError(registerAcc.error.message);
      return registerAcc.error;
    }

    router.push("/auth/register/success");
  };

  return (
    <>
      <Form {...form} control={form.control}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {error && (
              <Alert variant="destructive" className="xl:col-span-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="lrn"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>LRN</FormLabel>
                    <FormDescription>
                      Your LRN is a 12 digit number assigned to you by your
                      school.
                    </FormDescription>
                    <FormControl className="w-full">
                      <Input
                        type="string"
                        inputMode="numeric"
                        placeholder="LRN"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormDescription>
                      This email will be used for authenticating in the
                      dashboard.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="string"
                        placeholder="Email"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormDescription>
                      Your password must be at least 8 characters long and
                      include at least one uppercase letter, one lowercase
                      letter, one number, and one special character.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm Password"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <div className="flex flex-1 flex-col gap-2 align-bottom md:flex-row">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          type="string"
                          placeholder="First Name"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middlename"
                  render={({ field }) => (
                    <FormItem className="mt-auto w-full">
                      <FormControl>
                        <Input
                          type="string"
                          placeholder="Middle Name"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem className="mt-auto w-full">
                      <FormControl>
                        <Input
                          type="string"
                          placeholder="Last Name"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              <div className="flex flex-1 flex-col gap-2 align-bottom md:flex-row">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel>Grade</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          onGradeChange(Number(value));
                        }}
                        defaultValue={field.value.toString()}
                        required
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your grade level" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel>Section</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        required
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your section." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sectionList.map((section) => (
                            <SelectItem
                              value={section.value}
                              key={section.value}
                            >
                              {section.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator className="xl:hidden" />
            </div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="idpic"
                render={() => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel>Picture</FormLabel>
                    <FormDescription>
                      Please upload a recent and valid picture of yourself. The
                      picture must have a plain background.
                    </FormDescription>
                    <Image
                      src={
                        idpic ? idpic : "https://avatar.iran.liara.run/public"
                      }
                      alt="ID Picture"
                      width={200}
                      height={200}
                      draggable={false}
                      className="self-center rounded-full xl:size-60"
                    />
                    <FormControl>
                      <Input type="file" required {...fileRef} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <div className="flex flex-1 flex-col gap-2 align-bottom md:flex-row">
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            startMonth={new Date("2000-01-01")}
                            endMonth={new Date("2015-12-31")}
                            yearFocus={false}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date("2015-12-31") ||
                              date < new Date("2000-01-01")
                            }
                            defaultMonth={field.value}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        type="string"
                        placeholder="Home Address"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-1 flex-col gap-2 align-bottom md:flex-row">
                <FormField
                  control={form.control}
                  name="pwd"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-secondary">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="cursor-pointer space-y-1 leading-none ">
                        <FormLabel className="cursor-pointer">
                          Are you a person with disability?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="xl:col-span-2"
              disabled={isLoading || captchaLoading}
            >
              {isLoading || captchaLoading ? (
                <span className="flex flex-1 flex-row items-center justify-center gap-1">
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
              className="mx-auto xl:col-span-2"
            />
          </CardContent>
        </form>
      </Form>
    </>
  );
};

export default RegisterForm;
