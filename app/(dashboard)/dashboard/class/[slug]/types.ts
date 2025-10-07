import { Database } from "@/database.types";

export type Student = {
  enrolled: string[] | null;
  firstname: string;
  id: string;
  lastname: string;
  lrn: string;
  middlename: string | null;
  picture: string;
  role: Database["public"]["Enums"]["app_role"];
};
