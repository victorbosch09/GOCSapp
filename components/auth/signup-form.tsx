"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [password, setPassword] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Postulación G.O.C.S.</CardTitle>
        <CardDescription>
          Tu ingreso queda en revisión hasta que la plana de mando lo apruebe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="callsign">Callsign</Label>
            <Input id="callsign" name="callsign" placeholder="Tu alias en el clan" required />
            {state?.errors?.callsign && (
              <p className="text-sm text-destructive">{state.errors.callsign[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.errors?.email && (
              <p className="text-sm text-destructive">{state.errors.email[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrengthMeter password={password} />
            {state?.errors?.password && (
              <ul className="text-sm text-destructive">
                {state.errors.password.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
          {state?.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Enviando..." : "Postularme"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-gocs-red underline underline-offset-4">
            Iniciá sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
