import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nueva contraseña — G.O.C.S." };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
