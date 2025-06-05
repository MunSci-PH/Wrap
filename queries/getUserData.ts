import { TypedSupabaseClient } from "@/utils/types";

export async function getUserData(client: TypedSupabaseClient) {
  const user = await client.auth.getUser();
  if (user.error) {
    throw new Error(`Error fetching user: ${user.error.message}`);
  }

  return client
    .from("userdata")
    .select("*")
    .eq("id", user.data.user.id)
    .single();
}
