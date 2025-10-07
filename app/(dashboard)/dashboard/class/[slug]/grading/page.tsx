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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import useSupabaseBrowser from "@/utils/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClassData } from "@/queries/getClassData";
import { getUserData } from "@/queries/getUserData";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Student } from "../types";

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissions: {
    studentId: string;
    score?: number;
    submittedAt?: string;
    status: "pending" | "graded";
  }[];
};

export default function GradingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const assignmentId = searchParams.get("assignment");
  const supabase = useSupabaseBrowser();
  const queryClient = useQueryClient();

  const [grades, setGrades] = useState<Record<string, string>>({});

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user_data", supabase],
    queryFn: () => getUserData(supabase),
  });

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ["class_data", slug, supabase],
    queryFn: () => getClassData(supabase, slug),
  });

  const { data: students } = useQuery({
    queryKey: [
      "students",
      classData?.enrolled,
      classData?.enrolled?.length,
      supabase,
    ],
    queryFn: async () => {
      if (!classData?.enrolled || classData.enrolled.length === 0) return [];
      const studentPromises = classData.enrolled.map((studentId: string) =>
        supabase.from("users").select("*").eq("id", studentId).single(),
      );
      const results = await Promise.all(studentPromises);
      return results.map((r) => r.data).filter(Boolean);
    },
    enabled: !!classData?.enrolled,
  });

  const pictures = useQuery({
    queryKey: ["student_pictures", students],
    queryFn: async () => {
      const picturePromises = students!.map(async (student) => {
        const { data: signedUrl } = await supabase.storage
          .from("idpics")
          .createSignedUrl(`${student?.lrn}/${student?.picture}`, 3600);
        return {
          studentId: student!.id,
          pictureUrl: signedUrl?.signedUrl || "",
        };
      });
      return Promise.all(picturePromises);
    },
    enabled: !!students,
  });

  const isTeacher = userData?.data?.role === "teacher";
  const assignments = (classData?.assignment as Assignment[]) || [];
  const currentAssignment = assignments.find((a) => a.id === assignmentId);

  // Initialize grades from existing submissions
  useEffect(() => {
    if (currentAssignment) {
      const initialGrades: Record<string, string> = {};
      currentAssignment.submissions.forEach((sub) => {
        if (sub.score !== undefined) {
          initialGrades[sub.studentId] = sub.score.toString();
        }
      });
      setGrades(initialGrades);
    }
  }, [currentAssignment]);

  const saveGradesMutation = useMutation({
    mutationFn: async () => {
      if (!currentAssignment) throw new Error("No assignment selected");

      const updatedSubmissions = currentAssignment.submissions.map((sub) => {
        const gradeValue = grades[sub.studentId];
        if (gradeValue !== undefined && gradeValue !== "") {
          return {
            ...sub,
            score: Number.parseInt(gradeValue),
            status: "graded" as const,
          };
        }
        return sub;
      });

      const updatedAssignments = assignments.map((a) =>
        a.id === assignmentId ? { ...a, submissions: updatedSubmissions } : a,
      );

      const { error } = await supabase
        .from("classes")
        .update({ assignment: updatedAssignments })
        .eq("id", slug);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_data", slug] });
      toast.success("Grades saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save grades: ${error.message}`);
    },
  });

  if (userLoading || classLoading) {
    return (
      <ContentLayout title="Grading">
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ContentLayout>
    );
  }

  if (!isTeacher) {
    router.push(`/dashboard/class/${slug}/home`);
    return null;
  }

  if (!classData || !currentAssignment) {
    return (
      <ContentLayout title="Grading">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <p className="text-muted-foreground">Assignment not found</p>
          <Button asChild className="mt-4 bg-transparent" variant="outline">
            <Link href={`/dashboard/class/${slug}/home`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Class
            </Link>
          </Button>
        </div>
      </ContentLayout>
    );
  }

  const gradedCount = currentAssignment.submissions.filter(
    (s) => s.status === "graded",
  ).length;

  return (
    <ContentLayout title="Grading">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href={`/dashboard/class/${slug}/home`}>
                <ArrowLeft className="mr-2 size-4" />
                Back to Class
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-balance md:text-4xl">
              {currentAssignment.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {currentAssignment.description}
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Max Score: {currentAssignment.maxScore}</span>
              <span>
                Due: {new Date(currentAssignment.dueDate).toLocaleDateString()}
              </span>
              <Badge
                variant={
                  gradedCount === currentAssignment.submissions.length
                    ? "default"
                    : "secondary"
                }
              >
                {gradedCount}/{currentAssignment.submissions.length} Graded
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => saveGradesMutation.mutate()}
            disabled={saveGradesMutation.isPending}
          >
            <Save className="mr-2 size-4" />
            {saveGradesMutation.isPending ? "Saving..." : "Save Grades"}
          </Button>
        </div>

        {/* Grading Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>
              Enter scores for each student&apos;s submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!students || students.length === 0 ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-muted-foreground">
                  No students enrolled in this class
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {students &&
                  students.map((student: Student | null) => {
                    const submission = currentAssignment.submissions.find(
                      (s) => s.studentId === student?.id,
                    );
                    const isGraded = submission?.status === "graded";

                    return (
                      <Card
                        key={student?.id}
                        className="transition-shadow hover:shadow-sm"
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <Avatar className="size-12">
                            <AvatarImage
                              src={
                                pictures.data?.find(
                                  (p) => p.studentId === student?.id,
                                )?.pictureUrl
                              }
                            />
                            <AvatarFallback>
                              {student?.firstname[0]}
                              {student?.lastname[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {student?.firstname}{" "}
                              {student?.middlename?.[0]
                                ? `${student?.middlename[0]}.`
                                : ""}{" "}
                              {student?.lastname}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student?.lrn}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {isGraded && (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="mr-1 size-3" />
                                Graded
                              </Badge>
                            )}
                            {!isGraded && submission?.submittedAt && (
                              <Badge className="bg-blue-500">
                                <Clock className="mr-1 size-3" />
                                Submitted
                              </Badge>
                            )}
                            <Field className="w-32">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={currentAssignment.maxScore}
                                  placeholder="Score"
                                  value={grades[student!.id] || ""}
                                  onChange={(e) =>
                                    setGrades((prev) => ({
                                      ...prev,
                                      [student!.id]: e.target.value,
                                    }))
                                  }
                                  className="text-center"
                                />
                                <span className="text-sm text-nowrap">
                                  / {currentAssignment.maxScore}
                                </span>
                              </div>
                            </Field>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
