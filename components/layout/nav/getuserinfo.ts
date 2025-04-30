"use server";

import { getUser } from "@/queries/getUser";
import createSupabaseServer from "@/utils/server";

export default async function getUserInfo() {
  const supabase = await createSupabaseServer();

  const user = (await getUser(supabase)).data.user;

  return { data: { user } };
}
