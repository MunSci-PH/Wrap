"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/queries/getUser";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useSupabaseBrowser from "@/utils/client";
import { useQuery } from "@tanstack/react-query";
import { getUserMetadata } from "@/queries/getUserMetadata";
import { getUserData } from "@/queries/getUserData";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { getEnrolledClasses } from "@/queries/getEnrolledClasses";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

const joinClassSchema = z.object({
  code: z.string().min(1, "Class code is required"),
});

export default function Dashboard() {
  const supabase = useSupabaseBrowser();
  const time = new Date().getHours();

  const user = useQuery({
    queryKey: ["user", supabase],
    queryFn: () => getUser(supabase),
  });
  const user_metadata = useQuery({
    queryKey: ["user_metadata", supabase],
    queryFn: () => getUserMetadata(supabase),
  });
  const user_data = useQuery({
    queryKey: ["user_data", supabase],
    queryFn: () => getUserData(supabase),
  });
  const class_data = useQuery({
    queryKey: ["enrolled_classes", supabase],
    queryFn: () => getEnrolledClasses(supabase),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClassForm = useForm<z.infer<typeof createClassSchema>>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
    },
  });

  const createClass = async (data: z.infer<typeof createClassSchema>) => {
    setIsSubmitting(true);
    const loadingtoast = toast.loading("Creating class...");

    // Generate a unique class ID
    async function generateUniqueId() {
      let id;
      let exists = true;
      while (exists) {
        id = Math.random().toString(36).substring(2, 7).toLowerCase();
        const { data } = await supabase
          .from("classes")
          .select("id")
          .eq("id", id);
        exists = data && data.length > 0 ? true : false;
      }
      return id;
    }
    const id = await generateUniqueId();

    if (id === undefined) {
      toast.dismiss(loadingtoast);
      toast.error("Failed to generate a unique class ID");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("classes").insert({
      id,
      name: data.name,
      owner_name: `${user_metadata.data?.lastname}, ${user_metadata.data?.firstname} ${user_metadata.data?.middlename?.charAt(0)}${user_metadata.data?.middlename ? "." : ""}`,
      metadata: {},
      enrolled: [user.data!.data.user!.id],
    });

    if (error) {
      toast.dismiss(loadingtoast);
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    const enroll = await supabase
      .from("userdata")
      .update({
        enrolled: [...(user_data.data?.data?.enrolled || []), id],
      })
      .eq("id", user.data!.data.user!.id);

    if (enroll.error) {
      toast.dismiss(loadingtoast);
      toast.error("Failed to enroll in the class: " + enroll.error.message);
      setIsSubmitting(false);
      return;
    }

    toast.dismiss(loadingtoast);
    toast.success("Class created successfully. Code: " + id, {
      description:
        "You can share this code with your students to join the class.",
    });
    createClassForm.reset();
    setIsSubmitting(false);
  };

  const joinClassForm = useForm<z.infer<typeof joinClassSchema>>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: {
      code: "",
    },
  });

  const joinClass = async (data: z.infer<typeof joinClassSchema>) => {
    setIsSubmitting(true);
    const loadingtoast = toast.loading("Joining class...");

    // Check if the class exists
    const { data: classCheck, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("id", data.code)
      .single();

    if (classError) {
      toast.dismiss(loadingtoast);
      toast.error(`Failed to join the class: ${classError.message}`);
      setIsSubmitting(false);
      return;
    }

    if (!classCheck) {
      toast.dismiss(loadingtoast);
      toast.error("Class not found. Please check the class code.");
      setIsSubmitting(false);
      return;
    }

    const enroll = await supabase
      .from("userdata")
      .update({
        enrolled: [...(user_data.data?.data?.enrolled || []), data.code],
      })
      .eq("id", user.data!.data.user!.id);

    if (enroll.error) {
      toast.dismiss(loadingtoast);
      toast.error(`Failed to join the class: ${enroll.error.message}`);
      setIsSubmitting(false);
      return;
    }

    toast.dismiss(loadingtoast);
    toast.success("Joined the class successfully.");
    createClassForm.reset();
    setIsSubmitting(false);
  };

  return (
    <ContentLayout title="Dashboard">
      <main className="container mx-auto flex flex-1 flex-col items-center px-4 text-center">
        <div className="mt-12 flex w-full flex-nowrap justify-between">
          {user.isLoading || user_metadata.isLoading ? (
            <Skeleton className="h-12 w-1/2 rounded" />
          ) : (
            <p className="my-auto inline w-fit text-left font-sans text-4xl font-bold">
              Good {time < 12 ? "Morning" : "Afternoon"},{" "}
              {user_metadata.data?.firstname}
            </p>
          )}
        </div>
        <div className="py-10 w-11/12 h-full">
          <Card className="h-full items-start">
            <CardHeader className="w-full">
              <div className="flex flex-row flex-1 justify-between items-center">
                {user_data.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-1/4 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </>
                ) : (
                  <>
                    <CardTitle className="font-extrabold text-2xl">
                      Enrolled Classes
                    </CardTitle>
                    {user_data.data?.data &&
                    user_data.data?.data.role == "teacher" ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>New Class</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Class</DialogTitle>
                            <DialogDescription>
                              Create a new class to start grading and managing
                              assignments.
                            </DialogDescription>
                          </DialogHeader>
                          <Form
                            {...createClassForm}
                            control={createClassForm.control}
                          >
                            <form
                              className="flex flex-col space-y-4"
                              onSubmit={createClassForm.handleSubmit(
                                createClass
                              )}
                            >
                              <FormField
                                control={createClassForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Name"
                                        {...field}
                                        className="bg-muted"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={isSubmitting}>
                                Create Class
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Join Class</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Join Class</DialogTitle>
                            <DialogDescription>
                              Enter the class code provided by your teacher to
                              join the class.
                            </DialogDescription>
                          </DialogHeader>
                          <Form
                            {...joinClassForm}
                            control={joinClassForm.control}
                          >
                            <form
                              className="flex flex-col space-y-4"
                              onSubmit={joinClassForm.handleSubmit(joinClass)}
                            >
                              <FormField
                                control={joinClassForm.control}
                                name="code"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Class Code</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="abcde"
                                        {...field}
                                        className="bg-muted"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={isSubmitting}>
                                Join Class
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="w-full">
              {class_data.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-20 rounded" />
                </div>
              ) : (
                <>
                  {class_data.data!.length > 0 ? (
                    class_data.data!.map((classData) => (
                      <Button
                        asChild
                        variant={"outline"}
                        className="w-full py-10"
                        key={classData.id}
                      >
                        <Link href={`/dashboard/class/${classData.id}`}>
                          <div className="flex flex-row flex-1 justify-between items-center">
                            <p className="font-extrabold text-xl w-1/3 text-start">
                              {classData.name}
                            </p>
                            <p className="text-xl w-1/3">{`${classData.owner_name}`}</p>
                            <p className="text-xl text-muted-foreground w-1/3 text-end">
                              View{" "}
                              <ChevronRight
                                className="inline"
                                size={64}
                              ></ChevronRight>
                            </p>
                          </div>
                        </Link>
                      </Button>
                    ))
                  ) : (
                    <p>
                      No classes enrolled.{" "}
                      {user_data.data?.data?.role == "teacher"
                        ? "Create a class to get started grading work."
                        : "Join a class using the class code provided by your teacher."}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ContentLayout>
  );
}
