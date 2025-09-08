import { TypedSupabaseClient } from "@/utils/types";
import { getUserData } from "./getUserData";

export async function getEnrolledClasses(client: TypedSupabaseClient) {
  const temporary_data = [];
  const user_data = await getUserData(client);

  if (user_data.error) {
    return Promise.reject(
      new Error(`Error fetching user data: ${user_data.error.message}`),
    );
  }

  if (!user_data.data) {
    return Promise.reject(new Error("No user data found"));
  }

  if (!user_data.data.enrolled) {
    return Promise.reject(new Error("No enrolled classes found for the user"));
  }

  for (let i = 0; i < user_data.data.enrolled.length; i++) {
    const class_response = await client
      .from("classes")
      .select("*")
      .eq("id", user_data.data.enrolled[i]);

    if (class_response.error) {
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
