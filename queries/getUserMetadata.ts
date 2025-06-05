import { UserInfo } from "@/app/(dashboard)/dashboard/types";
import { TypedSupabaseClient } from "@/utils/types";

export async function getUserMetadata(client: TypedSupabaseClient) {
  const user = await client.auth.getUser();
  if (user.error) {
    throw new Error(`Error fetching user: ${user.error.message}`);
  }

  return user.data.user.user_metadata as UserInfo;
}
