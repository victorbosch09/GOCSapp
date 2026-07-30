import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Ingresar — G.O.C.S." };

export default function LoginPage() {
  return <LoginForm />;
}
