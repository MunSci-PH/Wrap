"use client";

import { useState } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileTab } from "./tabs/profile";
import { SecurityTab } from "./tabs/security";

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

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left sidebar with tabs */}
            <div className="md:w-1/4">
              <nav className="flex flex-col space-y-1 border rounded-md overflow-hidden">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                    activeTab === "profile" && "bg-muted font-medium"
                  )}
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                    activeTab === "security" && "bg-muted font-medium"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Security
                </button>
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
