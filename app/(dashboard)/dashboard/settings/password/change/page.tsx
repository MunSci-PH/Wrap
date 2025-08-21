import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChangePassword from "./changePassword";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default async function Dashboard() {
  return (
    <>
      <ContentLayout title="Password Change">
        <main className="container mx-auto flex flex-1 px-4">
          <div className="m-auto">
            <Card className={`
              w-[325px]
              md:w-[350px]
            `}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Enter your new password to change your password.
                </CardDescription>
              </CardHeader>
              <ChangePassword />
            </Card>
          </div>
        </main>
      </ContentLayout>
    </>
  );
}
