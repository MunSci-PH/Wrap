import { getClassData } from "@/queries/getClassData";
import createSupabaseServer from "@/utils/server";
import { permanentRedirect } from "next/navigation";

export default async function Grade(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createSupabaseServer();
  const classData = await getClassData(supabase, slug);

  if (!classData) {
    return <div>Class not found</div>;
  }

  if (classData.owner == (await supabase.auth.getClaims()).data?.claims?.sub) {
    permanentRedirect(`${slug}/home/`);
    return null; // This line is necessary to satisfy the return type
  } else {
    permanentRedirect(`${slug}/home/`);
    return null; // This line is necessary to satisfy the return type
  }
}
