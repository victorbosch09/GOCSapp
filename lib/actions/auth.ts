"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  LoginSchema,
  SignupSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type AuthFormState,
} from "@/lib/definitions/auth";

async function siteOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  return `${proto}://${host}`;
}

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

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = ForgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("[requestPasswordReset] Supabase auth error:", error.code, error.status, error.message);
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return {
        message: "Se alcanzó el límite de correos por hora. Esperá unos minutos y volvé a intentar.",
      };
    }
    // No revelamos si el correo existe o no — mismo mensaje para todos los casos.
  }

  return {
    message:
      "Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña. Revisá tu bandeja (y spam).",
  };
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "El enlace de restablecimiento venció o ya se usó. Pedí uno nuevo desde /olvide-password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: validated.data.password });

  if (error) {
    console.error("[updatePassword] Supabase auth error:", error.code, error.status, error.message);
    if (error.code === "same_password") {
      return { message: "Elegí una contraseña distinta a la actual." };
    }
    if (error.code === "weak_password") {
      return { message: "La contraseña es muy débil. Probá con una más larga o menos común." };
    }
    return { message: "No se pudo actualizar la contraseña. Intentá de nuevo." };
  }

  redirect("/dashboard");
}
