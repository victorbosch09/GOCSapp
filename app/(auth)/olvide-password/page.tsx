import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña — G.O.C.S." };

export default function OlvidePasswordPage() {
  return <ForgotPasswordForm />;
}
