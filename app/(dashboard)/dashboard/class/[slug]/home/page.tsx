import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getClassData } from "@/queries/getClassData";
import createSupabaseServer from "@/utils/server";
import { LoaderCircle } from "lucide-react";

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
                .from("userdata")
                .select("*")
                .eq("id", studentId)
                .single();
              return data;
            })
          )
        ).filter(Boolean)
      : [];

  return (
    <ContentLayout title="Class View">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <div>
              <h1 className="text-2xl font-bold">{classData.name}</h1>
              <p className="text-muted-foreground">{classData.owner_name}</p>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="px-6">
            <CardTitle>
              <h1 className="text-xl font-bold">Students</h1>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.map(async (student) => (
              <Tooltip key={student?.lrn}>
                <TooltipTrigger asChild>
                  <Button variant={"outline"} className="py-6 px-4">
                    <Avatar>
                      <AvatarImage
                        src={
                          (
                            await supabase.storage
                              .from("idpics")
                              .createSignedUrl(
                                `${student?.lrn}/${student?.picture}`,
                                3600
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
      </div>
    </ContentLayout>
  );
}
