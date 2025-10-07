import { TypedSupabaseClient } from "@/utils/types";

export async function getClassData(
  client: TypedSupabaseClient,
  classId: string,
) {
  const classResponse = await client
    .from("classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();

  if (classResponse.error) {
    throw new Error(
      `Error fetching class data: ${classResponse.error.message}`,
    );
  }

  if (!classResponse.data) {
    console.log("Class not found");
  }

  return classResponse.data;
}
