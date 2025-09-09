import { TypedSupabaseClient } from "@/utils/types";

export async function getUserData(client: TypedSupabaseClient) {
  const user = await client.auth.getClaims();
  if (user.error) {
    throw new Error(`Error fetching user: ${user.error.message}`);
  }
  if (!user.data?.claims?.sub) {
    throw new Error("No user ID found in claims");
  }

  return client
    .from("users")
    .select("*")
    .eq("id", user.data.claims.sub)
    .single();
}
