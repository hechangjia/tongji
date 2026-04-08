import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-request-cache";
import { canAccessLeader } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";

export default async function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

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
