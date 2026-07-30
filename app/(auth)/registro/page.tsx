import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Postulate — G.O.C.S." };

export default function RegistroPage() {
  return <SignupForm />;
}
