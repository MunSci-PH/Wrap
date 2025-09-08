"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, LoaderCircle, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  lrn: z.coerce
    .number()
    .refine((v) => `${v}`.length === 12, { message: "Must be 12 digits" }),
  firstname: z.string().trim().min(1).max(50),
  middlename: z.string().trim().max(50).optional(),
  lastname: z.string().min(1).max(50),
  email: z.string().trim().email(),
  grade: z.coerce.number().min(7).max(12),
  section: z.string(),
  birthday: z.date().min(new Date("2000-01-01")).max(new Date("2015-12-31")),
  address: z.string().trim().min(1).max(100),
});

export function ProfileTab() {
  const supabase = useSupabaseBrowser();
  const [isLoading, setIsLoading] = useState(true);
  const [idpic, setIdpic] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);

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
        3600,
      );

    if (!user_picture.data) return "#";

    return user_picture.data?.signedUrl;
  };

  const userPicture = useQuery({
    queryKey: ["user_picture"],
    queryFn: getUserPicture,
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
        `Failed to remove old picture: ${removePicture.error.message}`,
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
        `Failed to upload new picture: ${uploadPicture.error.message}`,
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
      <div className="flex flex-row items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        Loading User Data...
      </div>
    );
  }

  return (
    <div
      className={`
      flex flex-col gap-8
      md:flex-row
    `}
    >
      {/* Personal Information Form */}
      <div className="md:w-2/3">
        <div className="rounded-md border bg-card p-6 text-card-foreground">
          <h2 className="mb-6 text-xl font-semibold">Personal Information</h2>

          <Form {...form} control={form.control}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <div
                className={`
                grid grid-cols-1 gap-4
                md:grid-cols-3
              `}
              >
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
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
                        <Input placeholder="Middle Name" {...field} />
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
                        <Input placeholder="Last Name" {...field} />
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
                        placeholder="Email"
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
              <div
                className={`
                grid grid-cols-1 gap-4
                md:grid-cols-2
              `}
              >
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
                              !field.value && "text-muted-foreground",
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
                        placeholder="Address"
                        className={`
                          field-sizing-content min-h-[80px] resize-none
                        `}
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

      {/* Profile Picture Section */}
      <div className="md:w-1/3">
        <div className="rounded-md border bg-card p-6 text-card-foreground">
          <h2 className="mb-4 text-xl font-semibold">Profile Picture</h2>
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Avatar className="h-40 w-40">
                <AvatarImage
                  src={idpic ? idpic : userPicture ? userPicture.data : "#"}
                  alt="Avatar"
                  draggable={false}
                />
                <AvatarFallback className="bg-transparent text-4xl">
                  <LoaderCircle className="w-max animate-spin" />
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
                onChange={handleImageChange}
              />
              <Label
                htmlFor="picture"
                className={`
                  flex h-10 cursor-pointer items-center justify-center gap-2
                  rounded-md bg-primary px-4 py-2 text-primary-foreground
                  hover:bg-primary/90
                `}
              >
                <Upload className="h-4 w-4" />
                Change Picture
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
