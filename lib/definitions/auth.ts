import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Ingresá un correo válido." }),
  password: z.string().min(1, { message: "Ingresá tu contraseña." }),
});

export const SignupSchema = z.object({
  callsign: z
    .string()
    .trim()
    .min(2, { message: "El callsign debe tener al menos 2 caracteres." })
    .max(40, { message: "El callsign es demasiado largo." }),
  email: z.string().email({ message: "Ingresá un correo válido." }),
  password: z
    .string()
    .min(8, { message: "Al menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { message: "Debe contener al menos una letra." })
    .regex(/[0-9]/, { message: "Debe contener al menos un número." }),
});

export type AuthFormState =
  | {
      errors?: {
        callsign?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
