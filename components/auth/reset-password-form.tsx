"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";

const EXPIRED_LINK_MESSAGE = "El enlace de restablecimiento venció o ya se usó.";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const [password, setPassword] = useState("");
  const isExpiredLink = state?.message?.startsWith(EXPIRED_LINK_MESSAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Nueva contraseña</CardTitle>
        <CardDescription>Elegí una contraseña nueva para tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña nueva</Label>
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
              <p className="text-sm text-destructive">{state.errors.password[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Repetir contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            {state?.errors?.confirmPassword && (
              <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
            )}
          </div>
          {state?.message && (
            <p className="text-sm text-destructive">
              {isExpiredLink ? (
                <>
                  {EXPIRED_LINK_MESSAGE} Pedí uno nuevo desde{" "}
                  <Link href="/olvide-password" className="underline underline-offset-4">
                    /olvide-password
                  </Link>
                  .
                </>
              ) : (
                state.message
              )}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
