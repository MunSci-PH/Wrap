import { Metadata } from "next";
import createSupabaseServer from "@/utils/server";
import { UserInfo } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/queries/getUser";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export const metadata: Metadata = {
  title: "Dashboard | Wrap",
  description:
    "MunSci's Web-based Real-time Academic Platform (WRAP) is a student grade information system that ensures secure, efficient, and real-time access to academic records.",
};

export default async function Dashboard() {
  const supabase = await createSupabaseServer();
  const time = new Date().getHours();

  const user = await getUser(supabase);
  const user_metadata: UserInfo = user.data.user?.user_metadata as UserInfo;
  const user_data = await supabase
    .from("userdata")
    .select("*")
    .eq("id", user.data.user!.id);
  const class_data = [];

  if (user_data.data && user_data.data[0] && user_data.data[0].enrolled) {
    for (let i = 0; i < user_data.data[0].enrolled.length; i++) {
      const class_response = await supabase
        .from("classes")
        .select("*")
        .eq("id", user_data.data[0].enrolled[i]);

      if (!class_response.data) {
        break;
      }

      const owner_data = await supabase
        .from("userprofiles")
        .select("*")
        .eq("id", class_response.data[0].owner);

      if (!owner_data.data) {
        break;
      }

      const class_fulldata = {
        ...class_response.data[0],
        owner_data: owner_data.data[0],
      };

      class_data.push(class_fulldata);
    }
  }
  return (
    <ContentLayout title="Dashboard">
      <main className="container mx-auto flex flex-1 flex-col items-center px-4 text-center">
        <div className="mt-12 flex w-full flex-nowrap justify-between">
          <p className="my-auto inline w-fit text-left font-sans text-4xl font-bold">
            Good {time < 12 ? "Morning" : "Afternoon"},{" "}
            {user_metadata.firstname}
          </p>
        </div>
        <div className="py-10 w-11/12 h-full">
          <Card className="h-full items-start">
            <CardHeader className="w-full">
              <div className="flex flex-row flex-1 justify-between items-center">
                <CardTitle className="font-extrabold text-2xl">
                  Enrolled Classes
                </CardTitle>
                {user_data.data && user_data.data[0].role == "teacher" ? (
                  <Button>New Class</Button>
                ) : (
                  <Button>Join Class</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="w-full">
              {class_data.length > 0 ? (
                class_data.map((classData) => (
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
                        <p className="text-xl w-1/3">{`${classData.owner_data.lastname}, ${classData.owner_data.firstname} ${classData.owner_data.middlename.split("")[0]}.`}</p>
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
                <p>No classes enrolled</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ContentLayout>
  );
}
