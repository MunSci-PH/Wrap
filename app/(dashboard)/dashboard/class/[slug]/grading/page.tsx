import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getClassData } from "@/queries/getClassData";
import createSupabaseServer from "@/utils/server";

export default async function Grade(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createSupabaseServer();
  const classData = await getClassData(supabase, slug);

  if (!classData) {
    return <div>Class not found</div>;
  }

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
              <h1 className="text-xl font-bold">Assignments</h1>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </ContentLayout>
  );
}
