import { getClassData } from "@/queries/getClassData";
import createSupabaseServer from "@/utils/server";
import { redirect } from "next/navigation";

export default async function ClassPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createSupabaseServer();
  const classData = await getClassData(supabase, slug);

  if (!classData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Class not found</h1>
          <p className="mt-2 text-muted-foreground">
            The class you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  if (classData.owner == (await supabase.auth.getClaims()).data?.claims?.sub) {
    redirect(`${slug}/home/`);
    return null; // This line is necessary to satisfy the return type
  } else {
    redirect(`${slug}/home/`);
    return null; // This line is necessary to satisfy the return type
  }
}
