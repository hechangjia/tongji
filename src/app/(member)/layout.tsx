import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-request-cache";
import { canAccessMemberArea } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  if (!canAccessMemberArea(session.user)) {
    redirect("/login?callbackUrl=%2Fentry");
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
