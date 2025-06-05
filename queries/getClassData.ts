import { TypedSupabaseClient } from "@/utils/types";

export async function getClassData(
  client: TypedSupabaseClient,
  classId: string
) {
  const classResponse = await client
    .from("classes")
    .select("*")
    .eq("id", classId)
    .single();

  if (classResponse.error) {
    throw new Error(
      `Error fetching class data: ${classResponse.error.message}`
    );
  }

  if (!classResponse.data) {
    throw new Error("Class not found");
  }

  return classResponse.data;
}
