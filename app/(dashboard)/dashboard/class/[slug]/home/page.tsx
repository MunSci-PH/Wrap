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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getClassData } from "@/queries/getClassData";
import createSupabaseServer from "@/utils/server";
import {
  BarChart3,
  ClipboardList,
  LoaderCircle,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";

export default async function Grade(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createSupabaseServer();
  const classData = await getClassData(supabase, slug);

  if (!classData) {
    return <div>Class not found</div>;
  }

  const students =
    classData.enrolled && classData.enrolled.length > 0
      ? (
          await Promise.all(
            classData.enrolled.map(async (studentId: string) => {
              const { data } = await supabase
                .from("users")
                .select("*")
                .eq("id", studentId)
                .single();
              return data;
            }),
          )
        ).filter(Boolean)
      : [];

  return (
    <ContentLayout title="Class View">
      <div className="space-y-6">
        {/* Class Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{classData.enrolled?.length} students</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/class/${classData.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classData.enrolled?.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Assignments
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <></>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Submissions
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <></>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Class Average
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">...</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Assignment Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Progress</CardTitle>
                  <CardDescription>
                    Submission status for active assignments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <></>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assignments</h3>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </div>
            <div className="grid gap-4">
              {/* 
            {classData.assignments.map((assignment) => (
              <Card key={assignment.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{assignment.title}</h4>
                  <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(assignment.status)} text-white`}>{assignment.status}</Badge>
                  <div className="text-sm text-muted-foreground">
                  {assignment.submissions}/{assignment.total} submitted
                  </div>
                  <Button variant="outline" size="sm">
                  View
                  </Button>
                </div>
                </div>
              </CardContent>
              </Card>
            ))}
            */}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Students ({classData.enrolled?.length})
              </h3>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                {students.map(async (student) => (
                  <Tooltip key={student?.lrn}>
                    <TooltipTrigger asChild>
                      <Button variant={"outline"} className="px-4 py-6">
                        <Avatar>
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
                            <LoaderCircle className="animate-spin" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="ml-2">
                          {`${student?.firstname} ${student?.middlename?.charAt(0)}${student?.middlename ? "." : ""} ${student?.lastname}`}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{student?.lrn}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ContentLayout>
  );
}
