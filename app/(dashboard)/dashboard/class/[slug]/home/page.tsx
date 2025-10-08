"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useSupabaseBrowser from "@/utils/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClassData } from "@/queries/getClassData";
import { getUserData } from "@/queries/getUserData";
import { useParams } from "next/navigation";
import {
  Plus,
  Settings,
  Users,
  ClipboardList,
  BarChart3,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Trash,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Student } from "../types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  maxScore: z.string().min(1, "Max score is required"),
  type: z.enum(["ww", "pt", "periodical"]),
});

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  type: "ww" | "pt" | "periodical";
  submissions: {
    studentId: string;
    score?: number;
    submittedAt?: string;
    status: "pending" | "graded";
  }[];
};

type GradePercentages = {
  ww: number;
  pt: number;
  periodical: number;
};

const defaultGradePercentages: GradePercentages = {
  ww: 25,
  pt: 50,
  periodical: 25,
};

export default function ClassHomePage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = useSupabaseBrowser();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const isTeacher = userData?.data?.role === "teacher";
  const assignments = useMemo(
    () => (classData?.assignment as Assignment[]) || [],
    [classData?.assignment],
  );

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      maxScore: "",
      type: "ww",
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignmentSchema>) => {
      const newAssignment: Assignment = {
        id: Math.random().toString(36).substring(2, 11),
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        maxScore: Number.parseInt(data.maxScore),
        type: data.type,
        submissions:
          classData?.enrolled?.map((studentId: string) => ({
            studentId,
            status: "pending" as const,
          })) || [],
      };

      const updatedAssignments = [...assignments, newAssignment];
      const { error } = await supabase
        .from("classes")
        .update({ assignment: updatedAssignments })
        .eq("id", slug);

      if (error) throw error;
      return newAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_data", slug] });
      toast.success("Assignment created successfully");
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create assignment: ${error.message}`);
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const updatedAssignments = assignments.filter(
        (a) => a.id !== assignmentId,
      );
      const { error } = await supabase
        .from("classes")
        .update({ assignment: updatedAssignments })
        .eq("id", slug);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_data", slug] });
      toast.success("Assignment deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete assignment: ${error.message}`);
    },
  });

  const onSubmit = (data: z.infer<typeof assignmentSchema>) => {
    createAssignmentMutation.mutate(data);
  };

  // Transmutation scale based on DepEd table
  const transmutationTable = useMemo(
    () => [
      { min: 98.4, grade: 100 },
      { min: 96.4, grade: 99 },
      { min: 94.4, grade: 98 },
      { min: 92.4, grade: 97 },
      { min: 90.4, grade: 96 },
      { min: 88.4, grade: 95 },
      { min: 86.4, grade: 94 },
      { min: 84.4, grade: 93 },
      { min: 82.4, grade: 92 },
      { min: 80.4, grade: 91 },
      { min: 78.4, grade: 90 },
      { min: 76.4, grade: 89 },
      { min: 74.4, grade: 88 },
      { min: 72.4, grade: 87 },
      { min: 70.4, grade: 86 },
      { min: 68.4, grade: 85 },
      { min: 66.4, grade: 84 },
      { min: 64.4, grade: 83 },
      { min: 62.4, grade: 82 },
      { min: 60.4, grade: 81 },
      { min: 58.4, grade: 80 },
      { min: 56.4, grade: 79 },
      { min: 54.4, grade: 78 },
      { min: 52.4, grade: 77 },
      { min: 50.4, grade: 76 },
      { min: 48.4, grade: 75 },
      { min: 46.4, grade: 74 },
      { min: 44.4, grade: 73 },
      { min: 42.4, grade: 72 },
      { min: 40.4, grade: 71 },
      { min: 38.4, grade: 70 },
      { min: 36.4, grade: 69 },
      { min: 34.4, grade: 68 },
      { min: 32.4, grade: 67 },
      { min: 30.4, grade: 66 },
      { min: 28.4, grade: 65 },
      { min: 26.4, grade: 64 },
      { min: 24.4, grade: 63 },
      { min: 22.4, grade: 62 },
      { min: 20.4, grade: 61 },
    ],
    [],
  );

  const transmuteGrade = useCallback(
    (percent: number): number => {
      const found = transmutationTable.find((r) => percent >= r.min);
      return found ? found.grade : 60;
    },
    [transmutationTable],
  );

  // Group assignments by type
  const groupedAssignments = useMemo(
    () => ({
      ww: assignments.filter((a) => a.type === "ww"),
      pt: assignments.filter((a) => a.type === "pt"),
      periodical: assignments.filter((a) => a.type === "periodical"),
    }),
    [assignments],
  );

  const [showTransmuted, setShowTransmuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("showTransmuted") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showTransmuted", String(showTransmuted));
    }
  }, [showTransmuted]);

  const percentages: GradePercentages = (() => {
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
    return defaultGradePercentages;
  })();

  // --- Compute current student's data if not a teacher ---
  const studentSummary = useMemo(() => {
    if (isTeacher || !students || !userData?.data?.id) return null;
    const currentStudent = students.find((s) => s?.id === userData.data.id);
    if (!currentStudent) return null;

    const computeScores = (list: Assignment[]) => {
      const scores = list.map((a) => {
        const sub = a.submissions.find(
          (s) => s.studentId === currentStudent.id,
        );
        return sub?.score ?? null;
      });
      const percentages = scores
        .map((score, i) =>
          score != null ? (score / list[i].maxScore) * 100 : null,
        )
        .filter((v): v is number => v !== null);

      return {
        scores,
        average:
          percentages.length > 0
            ? percentages.reduce((a, b) => a + b, 0) / percentages.length
            : 0,
      };
    };

    const wwData = computeScores(groupedAssignments.ww);
    const ptData = computeScores(groupedAssignments.pt);
    const perData = computeScores(groupedAssignments.periodical);

    const overall =
      wwData.average * (percentages.ww / 100) +
      ptData.average * (percentages.pt / 100) +
      perData.average * (percentages.periodical / 100);

    return { wwData, ptData, perData, overall };
  }, [
    isTeacher,
    students,
    userData?.data?.id,
    groupedAssignments,
    percentages,
  ]);

  const gradeTableRows = useMemo(() => {
    if (!students || !assignments) return null;

    const sortedStudents = isTeacher
      ? students
          .filter((s): s is Student => s !== null)
          .sort(
            (a, b) =>
              a.lastname.localeCompare(b.lastname) ||
              a.firstname.localeCompare(b.firstname),
          )
      : students.filter(
          (s): s is Student => s !== null && s.id === userData?.data?.id,
        );

    const computeScores = (student: Student, list: Assignment[]) => {
      const scores = list.map((a) => {
        const sub = a.submissions.find((s) => s.studentId === student.id);
        return sub?.score ?? null;
      });

      const percentages = scores
        .map((score, i) =>
          score != null ? (score / list[i].maxScore) * 100 : null,
        )
        .filter((v): v is number => v !== null);

      return {
        scores,
        average:
          percentages.length > 0
            ? percentages.reduce((a, b) => a + b, 0) / percentages.length
            : 0,
      };
    };

    return sortedStudents.map((student) => {
      const wwData = computeScores(student, groupedAssignments.ww);
      const ptData = computeScores(student, groupedAssignments.pt);
      const perData = computeScores(student, groupedAssignments.periodical);

      const overall =
        wwData.average * (percentages.ww / 100) +
        ptData.average * (percentages.pt / 100) +
        perData.average * (percentages.periodical / 100);

      return (
        <tr key={student.id} className="border-b hover:bg-muted/30">
          <td className="p-2 font-medium">
            {student.lastname}, {student.firstname}
          </td>

          {/* WW scores */}
          {groupedAssignments.ww.map((a) => {
            const sub = a.submissions.find((s) => s.studentId === student.id);
            return (
              <td key={a.id} className="p-2 text-center">
                {sub?.score != null ? `${sub.score} / ${a.maxScore}` : "-"}
              </td>
            );
          })}
          <td className="p-2 text-center font-semibold">
            {showTransmuted
              ? transmuteGrade(wwData.average)
              : `${wwData.average.toFixed(1)}%`}
          </td>

          {/* PT scores */}
          {groupedAssignments.pt.map((a) => {
            const sub = a.submissions.find((s) => s.studentId === student.id);
            return (
              <td key={a.id} className="p-2 text-center">
                {sub?.score != null ? `${sub.score} / ${a.maxScore}` : "-"}
              </td>
            );
          })}
          <td className="p-2 text-center font-semibold">
            {showTransmuted
              ? transmuteGrade(ptData.average)
              : `${ptData.average.toFixed(1)}%`}
          </td>

          {/* Periodical scores */}
          {groupedAssignments.periodical.map((a) => {
            const sub = a.submissions.find((s) => s.studentId === student.id);
            return (
              <td key={a.id} className="p-2 text-center">
                {sub?.score != null ? `${sub.score} / ${a.maxScore}` : "-"}
              </td>
            );
          })}
          <td className="p-2 text-center font-semibold">
            {showTransmuted
              ? transmuteGrade(perData.average)
              : `${perData.average.toFixed(1)}%`}
          </td>

          {/* Overall */}
          <td className="p-2 text-center font-bold">
            {showTransmuted
              ? transmuteGrade(overall)
              : `${overall.toFixed(1)}%`}
          </td>
        </tr>
      );
    });
  }, [
    students,
    assignments,
    isTeacher,
    userData?.data?.id,
    groupedAssignments.ww,
    groupedAssignments.pt,
    groupedAssignments.periodical,
    percentages.ww,
    percentages.pt,
    percentages.periodical,
    showTransmuted,
    transmuteGrade,
  ]);

  if (userLoading || classLoading) {
    return (
      <ContentLayout title="Class">
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (!classData) {
    return (
      <ContentLayout title="Class">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Class not found</p>
        </div>
      </ContentLayout>
    );
  }

  // Calculate stats
  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce(
    (acc, a) => acc + a.submissions.filter((s) => s.submittedAt).length,
    0,
  );
  const pendingGrading = assignments.reduce(
    (acc, a) =>
      acc +
      a.submissions.filter((s) => s.submittedAt && s.status === "pending")
        .length,
    0,
  );

  return (
    <ContentLayout title={classData.name}>
      <div className="space-y-6">
        {/* Class Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance md:text-4xl">
              {classData.name}
            </h1>
            <p className="mt-2 text-muted-foreground">{classData.owner_name}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {classData.enrolled?.length || 0} students
              </span>
              <span className="flex items-center gap-1">
                <ClipboardList className="size-4" />
                {totalAssignments} assignments
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/class/${slug}/settings`}>
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </Button>
            {isTeacher && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    New Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                      Create a new assignment for your students to complete.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <Field>
                        <FieldLabel htmlFor="title">
                          Assignment Title
                        </FieldLabel>
                        <Input
                          id="title"
                          placeholder="e.g. Chapter 5 Quiz"
                          {...form.register("title")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.title
                              ? [form.formState.errors.title]
                              : undefined
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="description">
                          Description
                        </FieldLabel>
                        <Textarea
                          id="description"
                          placeholder="Describe the assignment..."
                          rows={4}
                          {...form.register("description")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.description
                              ? [form.formState.errors.description]
                              : undefined
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="type">Assignment Type</FieldLabel>
                        <select
                          id="type"
                          {...form.register("type")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <option value="ww">Written Work</option>
                          <option value="pt">Performance Task</option>
                          <option value="periodical">Periodical Exam</option>
                        </select>
                        <FieldError
                          errors={
                            form.formState.errors.type
                              ? [form.formState.errors.type]
                              : undefined
                          }
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="dueDate">Due Date</FieldLabel>
                          <Input
                            id="dueDate"
                            type="date"
                            {...form.register("dueDate")}
                          />
                          <FieldError
                            errors={
                              form.formState.errors.dueDate
                                ? [form.formState.errors.dueDate]
                                : undefined
                            }
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="maxScore">Max Score</FieldLabel>
                          <Input
                            id="maxScore"
                            type="number"
                            placeholder="100"
                            {...form.register("maxScore")}
                          />
                          <FieldError
                            errors={
                              form.formState.errors.maxScore
                                ? [form.formState.errors.maxScore]
                                : undefined
                            }
                          />
                        </Field>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createAssignmentMutation.isPending}
                        >
                          {createAssignmentMutation.isPending
                            ? "Creating..."
                            : "Create Assignment"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {isTeacher && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classData.enrolled?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Assignments
                </CardTitle>
                <ClipboardList className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAssignments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Grading
                </CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingGrading}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Submissions
                </CardTitle>
                <BarChart3 className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubmissions}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            {isTeacher && <TabsTrigger value="students">Students</TabsTrigger>}
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-10">
                  <ClipboardList className="mb-4 size-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No assignments yet
                  </h3>
                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    {isTeacher
                      ? "Create your first assignment to get started."
                      : "Your teacher hasn't posted any assignments yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => {
                  const userSubmission = assignment.submissions.find(
                    (s) => s.studentId === userData?.data?.id,
                  );
                  const submittedCount = assignment.submissions.filter(
                    (s) => s.submittedAt,
                  ).length;
                  const gradedCount = assignment.submissions.filter(
                    (s) => s.status === "graded",
                  ).length;
                  const isPastDue = new Date(assignment.dueDate) < new Date();

                  return (
                    <Card
                      key={assignment.id}
                      className="transition-shadow hover:shadow-md"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">
                              {assignment.title}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {assignment.description}
                            </CardDescription>
                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                              <Badge variant="outline">
                                {assignment.type === "ww"
                                  ? "Written Work"
                                  : assignment.type === "pt"
                                    ? "Performance Task"
                                    : "Periodical Exam"}
                              </Badge>
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-4" />
                                Due:{" "}
                                {new Date(
                                  assignment.dueDate,
                                ).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="size-4" />
                                Max Score: {assignment.maxScore}
                              </span>
                              {isTeacher && (
                                <span className="flex items-center gap-1">
                                  <Users className="size-4" />
                                  {submittedCount}/
                                  {assignment.submissions.length} submitted
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {!isTeacher && userSubmission && (
                              <>
                                {userSubmission.status === "graded" ? (
                                  <Badge className="bg-green-500">
                                    <CheckCircle2 className="mr-1 size-3" />
                                    Graded: {userSubmission.score}/
                                    {assignment.maxScore}
                                  </Badge>
                                ) : userSubmission.submittedAt ? (
                                  <Badge className="bg-blue-500">
                                    <Clock className="mr-1 size-3" />
                                    Submitted
                                  </Badge>
                                ) : isPastDue ? (
                                  <Badge variant="destructive">
                                    <XCircle className="mr-1 size-3" />
                                    Missing
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <Clock className="mr-1 size-3" />
                                    Pending
                                  </Badge>
                                )}
                              </>
                            )}
                            {isTeacher && (
                              <div className="flex flex-col items-end gap-2">
                                <Button asChild size="sm" variant="default">
                                  <Link
                                    href={`/dashboard/class/${slug}/grading?assignment=${assignment.id}`}
                                  >
                                    <CheckCircle />
                                    Grade ({gradedCount}/
                                    {assignment.submissions.length})
                                  </Link>
                                </Button>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash className="mr-1 size-4" /> Delete
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Delete Assignment
                                      </DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete{" "}
                                        <b>{assignment.title}</b>? This action
                                        cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex justify-end gap-2">
                                      <DialogClose asChild>
                                        <Button variant="outline">
                                          Cancel
                                        </Button>
                                      </DialogClose>
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          deleteAssignmentMutation.mutate(
                                            assignment.id,
                                          )
                                        }
                                      >
                                        {deleteAssignmentMutation.isPending
                                          ? "Deleting..."
                                          : "Delete"}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grades" className="space-y-4 px-2 sm:px-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Grades Overview
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {isTeacher
                      ? "View all students and their scores by assignment type."
                      : "View your grades by assignment type."}
                  </CardDescription>
                </div>

                <div className="mt-2 flex items-center gap-2 sm:mt-0">
                  <Label htmlFor="transmute" className="text-xs sm:text-sm">
                    Transmuted Grades
                  </Label>
                  <Switch
                    id="transmute"
                    checked={showTransmuted}
                    onCheckedChange={setShowTransmuted}
                  />
                </div>
              </CardHeader>

              {!isTeacher && studentSummary && (
                <div className="mb-4 grid grid-cols-2 gap-2 px-4 text-center text-sm sm:grid-cols-4">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="font-semibold">WW</p>
                    <p>
                      {showTransmuted
                        ? transmuteGrade(studentSummary.wwData.average)
                        : `${studentSummary.wwData.average.toFixed(1)}%`}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-2">
                    <p className="font-semibold">PT</p>
                    <p>
                      {showTransmuted
                        ? transmuteGrade(studentSummary.ptData.average)
                        : `${studentSummary.ptData.average.toFixed(1)}%`}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-2">
                    <p className="font-semibold">PER</p>
                    <p>
                      {showTransmuted
                        ? transmuteGrade(studentSummary.perData.average)
                        : `${studentSummary.perData.average.toFixed(1)}%`}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-2">
                    <p className="font-semibold">Overall</p>
                    <p>
                      {showTransmuted
                        ? transmuteGrade(studentSummary.overall)
                        : `${studentSummary.overall.toFixed(1)}%`}
                    </p>
                  </div>
                </div>
              )}

              <CardContent>
                {!students || students.length === 0 ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center py-10">
                    <Users className="mb-4 size-12 text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">
                      No students enrolled yet.
                    </p>
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center py-10">
                    <ClipboardList className="mb-4 size-12 text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">
                      No assignments available.
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[700px] border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2">Student</th>

                          {/* WW assignments */}
                          {groupedAssignments.ww.map((a) => (
                            <th key={a.id} className="p-2">
                              {a.title}
                            </th>
                          ))}
                          <th className="p-2 text-center">WW Avg</th>

                          {/* PT assignments */}
                          {groupedAssignments.pt.map((a) => (
                            <th key={a.id} className="p-2">
                              {a.title}
                            </th>
                          ))}
                          <th className="p-2 text-center">PT Avg</th>

                          {/* Periodical */}
                          {groupedAssignments.periodical.map((a) => (
                            <th key={a.id} className="p-2">
                              {a.title}
                            </th>
                          ))}
                          <th className="p-2 text-center">Periodical Avg</th>

                          <th className="p-2 text-center">Overall</th>
                        </tr>
                      </thead>
                      <tbody>{gradeTableRows}</tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isTeacher && (
            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Students ({students?.length || 0})</CardTitle>
                  <CardDescription>
                    View all students enrolled in this class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!students || students.length === 0 ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center py-10">
                      <Users className="mb-4 size-12 text-muted-foreground" />
                      <p className="text-center text-sm text-muted-foreground">
                        No students enrolled yet. Share your class code to get
                        started.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {students.map(async (student: Student | null) => (
                        <Card
                          key={student?.id}
                          className="transition-shadow hover:shadow-sm"
                        >
                          <CardContent className="flex items-center gap-3 p-4">
                            <Avatar className="size-12">
                              <AvatarImage
                                src={
                                  (
                                    await supabase.storage
                                      .from("idpics")
                                      .createSignedUrl(
                                        `${student?.lrn}/${student?.picture}`,
                                        3600,
                                      )
                                  )?.data?.signedUrl || "#"
                                }
                              />
                              <AvatarFallback>
                                {student?.firstname[0]}
                                {student?.lastname[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate font-medium">
                                {student?.firstname}{" "}
                                {student?.middlename?.[0]
                                  ? `${student?.middlename[0]}.`
                                  : ""}{" "}
                                {student?.lastname}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {student?.lrn}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ContentLayout>
  );
}
