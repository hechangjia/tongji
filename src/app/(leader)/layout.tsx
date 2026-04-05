import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessLeader } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";

export default async function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fleader%2Fgroup");
  }

  if (!canAccessLeader(session.user)) {
    redirect("/login?callbackUrl=%2Fleader%2Fgroup");
  }

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
    >
      {children}
    </AppShell>
  );
}
