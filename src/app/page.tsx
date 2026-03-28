import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDefaultRedirectPath } from "@/lib/permissions";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.role) {
    return redirect("/login");
  }

  return redirect(getDefaultRedirectPath(session.user.role));
}
