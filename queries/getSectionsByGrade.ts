import { TypedSupabaseClient } from "@/utils/types";

export function getSectionsByGrade(client: TypedSupabaseClient, grade: number) {
  return client.from("sectionList").select("section").eq("grade", grade);
}
