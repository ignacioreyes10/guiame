import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "convex/_generated/api";
import StudentSidebar from "@/components/estudiante/StudentSidebar";

export default async function EstudianteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/login");
  }

  const user = await fetchQuery(api.users.currentUser, {}, { token });
  if (!user?.roles?.includes("estudiante")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfaf7] sm:flex-row">
      <StudentSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
