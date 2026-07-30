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
    console.error("[login] Supabase auth error:", error.code, error.status, error.message);

    if (error.code === "email_not_confirmed") {
      return { message: "Tu correo todavía no está confirmado. Revisá tu bandeja de entrada." };
    }
    if (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
      return { message: "Demasiados intentos. Esperá un minuto y volvé a intentar." };
    }
    if (error.code === "invalid_credentials") {
      return { message: "Correo o contraseña incorrectos." };
    }
    return { message: `No se pudo iniciar sesión (${error.code ?? "error desconocido"}). Intentá de nuevo.` };
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
    console.error("[signup] Supabase auth error:", error.code, error.status, error.message);

    if (error.code === "user_already_exists" || error.message.toLowerCase().includes("already registered")) {
      return { message: "Ese correo ya tiene una cuenta registrada." };
    }
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return {
        message:
          "Se alcanzó el límite de registros por hora del servidor de correo. Esperá unos minutos y volvé a intentar, o avisale a un mando.",
      };
    }
    if (error.code === "weak_password") {
      return { message: "La contraseña es muy débil. Probá con una más larga o menos común." };
    }
    if (error.code === "validation_failed" || error.code === "email_address_invalid") {
      return { message: "Ese correo no es válido." };
    }
    return {
      message: `No se pudo crear la cuenta (${error.code ?? "error desconocido"}). Intentá de nuevo o avisale a un mando.`,
    };
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
