"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, LoaderCircle, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const formSchema = z.object({
  lrn: z.coerce
    .number()
    .refine((v) => `${v}`.length, { message: "Must be 12 digits" }),
  firstname: z.string().trim().min(1).max(50),
  middlename: z.string().trim().max(50).optional(),
  lastname: z.string().min(1).max(50),
  email: z.string().trim().email(),
  grade: z.coerce.number().min(7).max(12),
  section: z.string(),
  birthday: z.date().min(new Date("2000-01-01")).max(new Date("2015-12-31")),
  address: z.string().trim().min(1).max(100),
});

const MAX_UPLOAD_SIZE = 1024 * 1024 * 50; // 50MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png"];

const idpicSchema = z.object({
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
});

export default function Settings() {
  const supabase = useSupabaseBrowser();
  const [isLoading, setIsLoading] = useState(true);
  const [idpic, setIdpic] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const idpicForm = useForm<z.infer<typeof idpicSchema>>({
    resolver: zodResolver(idpicSchema),
    defaultValues: {
      idpic: [],
    },
  });
  const fileRef = idpicForm.register("idpic");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lrn: 0,
      firstname: "",
      middlename: "",
      lastname: "",
      email: "",
      grade: 7,
      section: "",
      birthday: new Date("2015-12-31"),
      address: "",
    },
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true);

        // Get the current user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          throw new Error(error?.message || "User not found");
        }

        // Get user metadata
        const metadata = user.user_metadata || {};

        // Set form default values from metadata
        form.reset({
          lrn: metadata.lrn || "",
          firstname: metadata.firstname || "",
          middlename: metadata.middlename || "",
          lastname: metadata.lastname || "",
          email: user.email || "",
          grade: metadata.grade || "",
          section: metadata.section || "",
          birthday: metadata.birthday ? new Date(metadata.birthday) : undefined,
          address: metadata.address || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data. Please try again later.", {});
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [form, supabase.auth]);

  const getUser = async () => {
    const user_data = await supabase.auth.getUser();

    if (!user_data.data) return;
    return user_data.data;
  };

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

  fileRef.onChange = async (e) =>
    handleImageChange(e as React.ChangeEvent<HTMLInputElement>);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];

    if (file) {
      const idpic = URL.createObjectURL(file);
      setIdpic(idpic);
    }

    setIsUploading(true);

    const loadingToast = toast.loading("Uploading profile picture...", {
      dismissible: false,
    });

    const user = await getUser();

    if (!user?.user) {
      toast.error(`Failed to get user.`);
      toast.dismiss(loadingToast);
      setIsUploading(false);
      return;
    }

    const removePicture = await supabase.storage
      .from("idpics")
      .remove([
        `${user?.user.user_metadata?.lrn}/${user?.user.user_metadata?.picture}`,
      ]);

    if (removePicture.error) {
      toast.error(
        `Failed to remove old picture: ${removePicture.error.message}`
      );
      toast.dismiss(loadingToast);
      setIsUploading(false);
      return;
    }

    const uploadPicture = await supabase.storage
      .from("idpics")
      .upload(`${user.user?.user_metadata?.lrn}/${file.name}`, file);

    if (uploadPicture.error) {
      toast.error(
        `Failed to upload new picture: ${uploadPicture.error.message}`
      );
      toast.dismiss(loadingToast);
      setIsUploading(false);
      return;
    }

    const updateData = await supabase.auth.updateUser({
      data: { picture: file.name },
    });

    if (updateData.error) {
      toast.error(`Failed to change data: ${updateData.error.message}`);
      toast.dismiss(loadingToast);
      setIsUploading(false);
      return;
    }

    toast.dismiss(loadingToast);
    toast.success("Your profile picture has been uploaded successfully.");
    setIsUploading(false);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const loadingToast = toast.loading("Updating profile...", {
      dismissible: false,
    });

    const uploadData = {
      firstname: data.firstname.trim(),
      middlename: data.middlename?.trim() || "",
      lastname: data.lastname.trim(),
      birthday: data.birthday.toLocaleDateString("en-us"),
      address: data.address.trim(),
    };

    const result = await supabase.auth.updateUser({
      data: uploadData,
    });

    if (result.error) {
      toast.error(result.error.message);
      toast.dismiss(loadingToast);
      return;
    }

    toast.dismiss(loadingToast);
    toast.success("Your profile has been updated successfully.");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <ContentLayout title="Settings">
      <main className="container mx-auto flex flex-1 px-4 text-center">
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-left">
            Account Settings
          </h1>

          <div className="flex flex-col md:flex-row">
            {/* Profile Picture Section (1/3) */}
            <div className="md:w-1/3 pr-0 md:pr-6">
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
                <div className="mb-6">
                  <Avatar className="w-40 h-40">
                    <AvatarImage
                      src={idpic ? idpic : userPicture ? userPicture.data : "#"}
                      alt="Avatar"
                    />
                    <AvatarFallback className="bg-transparent text-4xl">
                      <LoaderCircle className="animate-spin w-max" />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="relative">
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    {...fileRef}
                  />
                  <Label
                    htmlFor="picture"
                    className="flex items-center justify-center gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
                  >
                    <Upload className="h-4 w-4" />
                    Change Picture
                  </Label>
                </div>
              </div>
            </div>

            {/* Mobile Divider */}
            <div className="md:hidden h-px w-full bg-border my-8"></div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-border mx-6 my-4"></div>

            {/* User Data Form (2/3) */}
            <div className="md:w-2/3 mt-8 md:mt-0">
              <h2 className="text-xl font-semibold mb-6">
                Personal Information
              </h2>

              <Form {...form} control={form.control}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* LRN */}
                  <FormField
                    control={form.control}
                    name="lrn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LRN</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="LRN"
                            {...field}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* First Name, Middle Name, Last Name (inline) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middlename"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name</FormLabel>
                          <FormControl>
                            <Input placeholder="David" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grade and Section (inline) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <FormControl>
                            <Input placeholder="7" disabled {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <FormControl>
                            <Input placeholder="Ampere" disabled {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Birthday */}
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Birthday</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(field.value, "PPP")
                                  : "Select your birthday"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="123 Main St, City, Country"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4">
                    <Button
                      type="submit"
                      disabled={
                        !form.formState.isDirty || form.formState.isSubmitting
                      }
                      className="cursor-pointer"
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </main>
    </ContentLayout>
  );
}
