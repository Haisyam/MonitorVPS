"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        throw new Error("Invalid password");
      }
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError("Password salah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="glass-strong w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-glow">
            <Lock size={20} />
          </div>
          <CardTitle className="text-2xl">Secure Login</CardTitle>
          <p className="text-sm text-muted">
            Masukkan password untuk mengakses dashboard VPS.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              type="password"
              placeholder="Dashboard password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Checking..." : "Unlock Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
