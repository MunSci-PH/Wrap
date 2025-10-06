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
        <div className="container mx-auto py-8">
          <h1 className="mb-8 text-3xl font-bold">Account Settings</h1>

          <div className="flex flex-col gap-6 md:flex-row">
            <nav
              className="md:w-1/4"
              role="tablist"
              aria-label="Account settings"
            >
              <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
                <Button
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "justify-start gap-3 rounded-none border-b px-6 py-6 text-left font-medium transition-colors",
                    activeTab === "profile" && "bg-muted font-semibold",
                  )}
                  variant="ghost"
                  role="tab"
                  aria-selected={activeTab === "profile"}
                  aria-controls="profile-panel"
                >
                  <User className="size-5" />
                  Profile
                </Button>
                <Button
                  onClick={() => setActiveTab("security")}
                  className={cn(
                    "justify-start gap-3 rounded-none px-6 py-6 text-left font-medium transition-colors",
                    activeTab === "security" && "bg-muted font-semibold",
                  )}
                  variant="ghost"
                  role="tab"
                  aria-selected={activeTab === "security"}
                  aria-controls="security-panel"
                >
                  <Shield className="size-5" />
                  Security
                </Button>
              </div>
            </nav>

            <div className="md:w-3/4">
              {activeTab === "profile" && (
                <div
                  role="tabpanel"
                  id="profile-panel"
                  aria-labelledby="profile-tab"
                >
                  <ProfileTab />
                </div>
              )}
              {activeTab === "security" && (
                <div
                  role="tabpanel"
                  id="security-panel"
                  aria-labelledby="security-tab"
                >
                  <SecurityTab />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ContentLayout>
  );
}
