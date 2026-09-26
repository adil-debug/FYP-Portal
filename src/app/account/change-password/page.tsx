import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const backHref = user.role === "COORDINATOR" ? "/coordinator" : "/dashboard";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Change password
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {user.name} ({user.email}).
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
