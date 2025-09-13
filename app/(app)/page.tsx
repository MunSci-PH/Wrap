import { Album, ShieldUser, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import React, { ReactNode } from "react";

export default async function Home() {
  return (
    <>
      <main className="grow">
        <section
          className={`bg-[url(/bg.png)] bg-cover bg-center bg-no-repeat py-32 text-white md:py-48`}
        >
          <div className={`container mx-auto px-4 lg:px-12 xl:px-24`}>
            <div
              className={`flex flex-col items-center md:flex-row md:items-start md:justify-between`}
            >
              <div
                className={`my-auto text-center md:order-1 md:w-3/4 md:text-left`}
              >
                <h1
                  className={`mb-6 text-5xl leading-tight font-extrabold md:text-6xl lg:text-7xl`}
                >
                  WELCOME TO <br />
                  <span
                    className={`text-6xl font-black md:text-7xl lg:text-8xl`}
                  >
                    MUNSCI WRAP
                  </span>
                </h1>
                <p
                  className={`mx-auto mb-8 text-xl font-bold md:mx-0 md:text-2xl`}
                >
                  MunSci&apos;s Web-based Real-time Academic Platform (WRAP) is
                  a student grade information system that ensures secure,
                  efficient, and real-time access to academic records.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="bg-background py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Key Features
            </h2>
            <div className={`grid gap-8 md:grid-cols-3`}>
              <FeatureCard
                icon={<Album className="size-10 text-primary" />}
                title="Easy Information Access"
                description="Quickly upload, update, 
                and organize learners' academic 
                information."
              />
              <FeatureCard
                icon={<ShieldUser className="size-10 text-primary" />}
                title="Secured Data Sets"
                description="Protected access 
                to confidential academic 
                records of learners.
                "
              />
              <FeatureCard
                icon={<Users className="size-10 text-primary" />}
                title="User-Friendly Access"
                description="Ensures an accessible
                navigation and information
                management for users."
              />
            </div>
          </div>
        </section>
        <section id="about" className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold">About Wrap</h2>
            <p className="mx-auto max-w-3xl text-xl">
              The Muntinlupa Science High School Web-based Real-time Academic
              Platform (MunSci WRAP) is a web application designed to simplify
              grade management and store academic records in a more organized
              manner. It allows teachers to efficiently access and manage
              learner&apos;s records, while students can easily view their
              grades in real-time.
            </p>
          </div>
        </section>
        <section className="bg-card py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              How It Works
            </h2>
            <div className={`grid gap-8 text-center md:grid-cols-3`}>
              <div>
                <div
                  className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground`}
                >
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">Input Grades</h3>
                <p>
                  Teachers quickly upload and update student grades through a
                  user-friendly platform.
                </p>
              </div>
              <div>
                <div
                  className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground`}
                >
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">Secure Storage</h3>
                <p>
                  Grades are encrypted and safely stored in a centralized
                  database.
                </p>
              </div>
              <div>
                <div
                  className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground`}
                >
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">Real-time Access</h3>
                <p>
                  Students can instantly view their grades anytime with
                  authorized access.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mb-4 flex justify-center">{icon}</div>
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
