"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import useSupabaseBrowser from "@/utils/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClassData } from "@/queries/getClassData";
import { getUserData } from "@/queries/getUserData";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

export default function ClassSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = useSupabaseBrowser();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user_data", supabase],
    queryFn: () => getUserData(supabase),
  });

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ["class_data", slug, supabase],
    queryFn: () => getClassData(supabase, slug),
  });

  const isTeacher = userData?.data?.role === "teacher";
  const isOwner = classData?.owner === userData?.data?.id;

  const queryClient = useQueryClient();

  type GradePercentages = {
    ww: number;
    pt: number;
    periodical: number;
  };

  const defaultPercentages: GradePercentages = {
    ww: 25,
    pt: 50,
    periodical: 25,
  };

  const [gradePercentages, setGradePercentages] = useState<GradePercentages>(
    () => {
      const data = classData?.gradePercentages as
        | Partial<GradePercentages>
        | null
        | undefined;
      if (
        data &&
        typeof data.ww === "number" &&
        typeof data.pt === "number" &&
        typeof data.periodical === "number"
      ) {
        return data as GradePercentages;
      }
      return defaultPercentages;
    },
  );

  const updateGradePercentagesMutation = useMutation({
    mutationFn: async (newPercentages: GradePercentages) => {
      const { error } = await supabase
        .from("classes")
        .update({ gradePercentages: newPercentages })
        .eq("id", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_data", slug] });
      toast.success("Grading percentages updated");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const copyClassCode = () => {
    navigator.clipboard.writeText(slug);
    toast.success("Class code copied to clipboard");
  };

  if (userLoading || classLoading) {
    return (
      <ContentLayout title="Settings">
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ContentLayout>
    );
  }

  if (!classData) {
    return (
      <ContentLayout title="Settings">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Class not found</p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Class Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href={`/dashboard/class/${slug}/home`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Class
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-balance md:text-4xl">
            Class Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your class settings and preferences
          </p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Basic class information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="className">Class Name</FieldLabel>
              <Input id="className" value={classData.name} disabled />
            </Field>

            <Field>
              <FieldLabel htmlFor="classCode">Class Code</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="classCode"
                  value={slug}
                  disabled
                  className="font-mono"
                />
                <Button variant="outline" size="icon" onClick={copyClassCode}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this code with students to join the class
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="instructor">Instructor</FieldLabel>
              <Input id="instructor" value={classData.owner_name} disabled />
            </Field>

            <Field>
              <FieldLabel htmlFor="students">Enrolled Students</FieldLabel>
              <Input
                id="students"
                value={classData.enrolled?.length || 0}
                disabled
              />
            </Field>
          </CardContent>
        </Card>

        {/* Assignment Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Settings</CardTitle>
            <CardDescription>
              Configure how assignments work in this class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FieldLabel>Email Notifications</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for new assignments
                </p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* Grading Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Grading Settings</CardTitle>
            <CardDescription>
              Configure grading preferences for this class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {["ww", "pt", "periodical"].map((key) => (
                <Field key={key} className="w-full">
                  <FieldLabel className="text-sm sm:text-base">
                    {key === "ww"
                      ? "Written Works (WW)"
                      : key === "pt"
                        ? "Performance Tasks (PT)"
                        : "Periodical Exam"}
                  </FieldLabel>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-full text-sm sm:text-base"
                      value={
                        gradePercentages[key as keyof typeof gradePercentages]
                      }
                      onChange={(e) =>
                        setGradePercentages({
                          ...gradePercentages,
                          [key]: Number(e.target.value),
                        })
                      }
                      disabled={!isTeacher}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </Field>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={`text-sm ${
                  gradePercentages.ww +
                    gradePercentages.pt +
                    gradePercentages.periodical ===
                  100
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                Total:{" "}
                {gradePercentages.ww +
                  gradePercentages.pt +
                  gradePercentages.periodical}
                %
              </p>

              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  const total =
                    gradePercentages.ww +
                    gradePercentages.pt +
                    gradePercentages.periodical;

                  if (total !== 100) {
                    toast.error(
                      `The total must equal 100%. It currently totals ${total}%.`,
                    );
                    return;
                  }

                  updateGradePercentagesMutation.mutate(gradePercentages);
                }}
                disabled={
                  !isTeacher || updateGradePercentagesMutation.isPending
                }
              >
                {updateGradePercentagesMutation.isPending
                  ? "Saving..."
                  : "Save Percentages"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this class
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FieldLabel>Delete Class</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this class and all associated data
                  </p>
                </div>
                <Button variant="destructive" disabled>
                  <Trash2 className="mr-2 size-4" />
                  Delete Class
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isTeacher && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Leave Class</CardTitle>
              <CardDescription>Remove yourself from this class</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                Leave Class
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ContentLayout>
  );
}
