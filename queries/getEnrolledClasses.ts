import { TypedSupabaseClient } from "@/utils/types";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Database } from "@/database.types";

export async function getEnrolledClasses(
  client: TypedSupabaseClient,
  user_data: PostgrestSingleResponse<{
    enrolled: string[] | null;
    firstname: string;
    id: string;
    lastname: string;
    lrn: string;
    middlename: string | null;
    picture: string;
    role: Database["public"]["Enums"]["app_role"];
  }>,
) {
  const temporary_data = [];

  if (user_data.error) {
    console.error("Error fetching user data:", user_data.error.message);
    return Promise.reject(
      new Error(`Error fetching user data: ${user_data.error.message}`),
    );
  }

  if (!user_data.data) {
    console.error("No user data found");
    return Promise.reject(new Error("No user data found"));
  }

  if (!user_data.data.enrolled) {
    console.error("No enrolled classes found");
    return Promise.reject(new Error("No enrolled classes found for the user"));
  }

  for (let i = 0; i < user_data.data.enrolled.length; i++) {
    const class_response = await client
      .from("classes")
      .select("*")
      .eq("id", user_data.data.enrolled[i]);

    if (class_response.error) {
      console.error("Error fetching class data:", class_response.error.message);
      return Promise.reject(
        new Error(`Error fetching class data: ${class_response.error.message}`),
      );
    }

    const class_fulldata = {
      ...class_response.data,
    };

    temporary_data.push(class_fulldata[0]);
  }

  return temporary_data;
}
