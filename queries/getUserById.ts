import { TypedSupabaseClient } from "@/utils/types";

export function getUserById(client: TypedSupabaseClient, id: string) {
  return client.from("userdata").select().eq("id", id);
}
