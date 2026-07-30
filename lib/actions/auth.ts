"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginSchema, SignupSchema, type AuthFormState } from "@/lib/definitions/auth";

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { message: "Correo o contraseña incorrectos." };
  }

  redirect("/dashboard");
}

export async function signup(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = SignupSchema.safeParse({
    callsign: formData.get("callsign"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { callsign, email, password } = validated.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { callsign } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { message: "Ese correo ya tiene una cuenta registrada." };
    }
    return { message: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  if (!data.session) {
    return {
      message:
        "Cuenta creada. Revisá tu correo para confirmar la dirección antes de iniciar sesión.",
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
