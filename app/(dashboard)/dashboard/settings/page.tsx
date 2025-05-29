"use client";

import { useState } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileTab } from "./tabs/profile";
import { SecurityTab } from "./tabs/security";
import { Button } from "@/components/ui/button";

type TabType = "profile" | "security";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  return (
    <ContentLayout title="Settings">
      <main className="container mx-auto flex flex-1 px-4">
        <div className="container mx-auto py-5">
          <h1 className="text-3xl font-bold mb-8 text-left">
            Account Settings
          </h1>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Left sidebar with tabs */}
            <div className="md:w-1/4 ">
              <nav className="flex flex-col rounded-md overflow-hidden bg-card text-card-foreground">
                <Button
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "flex rounded-b-none justify-start items-center text-md gap-2 px-10 py-6 text-left transition-colors",
                    activeTab === "profile" && "bg-muted font-medium"
                  )}
                  variant={"outline"}
                >
                  <User className="size-4" />
                  Profile
                </Button>
                <Button
                  onClick={() => setActiveTab("security")}
                  className={cn(
                    "flex rounded-t-none justify-start items-center text-md gap-2 px-10 py-6 text-left transition-colors",
                    activeTab === "security" && "bg-muted font-medium"
                  )}
                  variant={"outline"}
                >
                  <Shield className="size-4" />
                  Security
                </Button>
              </nav>
            </div>

            {/* Main content area */}
            <div className="md:w-3/4">
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "security" && <SecurityTab />}
            </div>
          </div>
        </div>
      </main>
    </ContentLayout>
  );
}
