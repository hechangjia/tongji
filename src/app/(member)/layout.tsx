import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMemberArea } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

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
