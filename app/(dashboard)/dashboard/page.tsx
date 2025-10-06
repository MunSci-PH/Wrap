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
import { getUserData } from "@/queries/getUserData";
import { getEnrolledClasses } from "@/queries/getEnrolledClasses";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

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
  const user_metadata = !user.isLoading
    ? user.data?.data.user?.user_metadata
    : null;
  const user_data = useQuery({
    queryKey: ["user_data", supabase],
    queryFn: () => getUserData(supabase),
  });
  const class_data = useQuery({
    queryKey: ["enrolled_classes", supabase, user_data.data],
    queryFn: () => getEnrolledClasses(supabase, user_data.data!),
    enabled: user_data.isFetched,
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
      owner_name: `${user_metadata?.lastname}, ${user_metadata?.firstname} ${user_metadata?.middlename?.charAt(0)}${
        user_metadata?.middlename ? "." : ""
      }`,
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
      .from("users")
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
      .from("users")
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

    const addtolist = await supabase
      .from("classes")
      .update({
        enrolled: [...(classCheck.enrolled || []), user.data!.data.user!.id],
      })
      .eq("id", data.code);

    if (addtolist.error) {
      toast.dismiss(loadingtoast);
      toast.error(`Failed to join the class: ${addtolist.error.message}`);
      setIsSubmitting(false);
      return;
    }

    toast.dismiss(loadingtoast);
    toast.success("Joined the class successfully.");
    joinClassForm.reset();
    setIsSubmitting(false);
  };

  return (
    <ContentLayout title="Dashboard">
      <main className="container mx-auto flex flex-1 flex-col px-4">
        <div className="mt-8 flex w-full items-center justify-between md:mt-12">
          {user.isLoading || !user_metadata ? (
            <Skeleton className="h-10 w-64 rounded bg-muted" />
          ) : (
            <h1 className="text-3xl font-bold md:text-4xl">
              Good {time < 12 ? "Morning" : "Afternoon"},{" "}
              {user_metadata.firstname}
            </h1>
          )}
        </div>

        <div className="mt-8 w-full pb-10">
          <Card className="h-full">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {user_data.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-48 rounded bg-muted" />
                    <Skeleton className="h-10 w-32 rounded bg-muted" />
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl font-bold">
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
                                createClass,
                              )}
                            >
                              <Field>
                                <FieldLabel htmlFor="name">
                                  Class Name
                                </FieldLabel>
                                <Input
                                  id="name"
                                  placeholder="e.g. Mathematics 101"
                                  {...createClassForm.register("name")}
                                  className="bg-muted"
                                />
                                <FieldError
                                  errors={
                                    createClassForm.formState.errors.name
                                      ? [createClassForm.formState.errors.name]
                                      : undefined
                                  }
                                />
                              </Field>
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
                              <Field>
                                <FieldLabel htmlFor="code">
                                  Class Code
                                </FieldLabel>
                                <Input
                                  id="code"
                                  placeholder="abcde"
                                  {...joinClassForm.register("code")}
                                  className="bg-muted"
                                />
                                <FieldError
                                  errors={
                                    joinClassForm.formState.errors.code
                                      ? [joinClassForm.formState.errors.code]
                                      : undefined
                                  }
                                />
                              </Field>
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
              {class_data.isLoading || !class_data.isEnabled ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded bg-muted" />
                  <Skeleton className="h-24 w-full rounded bg-muted" />
                </div>
              ) : (
                <>
                  {class_data.data !== undefined &&
                  class_data.data.length > 0 ? (
                    <div className="space-y-3">
                      {class_data.data!.map((classData) => (
                        <Button
                          asChild
                          variant="outline"
                          className="h-auto w-full justify-start bg-card py-6 transition-colors hover:bg-accent"
                          key={classData.id}
                        >
                          <Link href={`/dashboard/class/${classData.id}`}>
                            <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-lg font-bold">
                                {classData.name}
                              </p>
                              <p className="text-sm text-muted-foreground sm:text-base">
                                {classData.owner_name}
                              </p>
                              <span className="flex items-center text-sm text-muted-foreground">
                                View <ChevronRight className="ml-1 size-5" />
                              </span>
                            </div>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
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
