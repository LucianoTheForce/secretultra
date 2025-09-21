"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useCredits } from "@/hooks/use-credits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AdminUserSummary = {
  id: string;
  name: string | null;
  email: string | null;
  credits: number;
  isAdmin: boolean;
  totalGenerated: number;
};

export default function AdminCreditsPage() {
  const { data: session, isPending } = useSession();
  const { data: creditsData } = useCredits();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/credits", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = (await response.json()) as { users: AdminUserSummary[] };
      setUsers(json.users);
      setEditValues(Object.fromEntries(json.users.map((user) => [user.id, user.credits])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    if (creditsData && !creditsData.isAdmin) return;
    void fetchUsers();
  }, [session, creditsData]);

  const handleUpdateCredits = async (userId: string) => {
    const value = editValues[userId];
    if (value === undefined || Number.isNaN(value) || value < 0) {
      setError("Informe um número válido de créditos");
      return;
    }

    try {
      setError(null);
      const response = await fetch("/api/admin/credits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, credits: value }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar créditos");
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Acesso restrito</h1>
        <p className="text-muted-foreground">Faça login para acessar o painel administrativo.</p>
      </div>
    );
  }

  if (creditsData && !creditsData.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Sem permissão</h1>
        <p className="text-muted-foreground">Sua conta não possui acesso administrativo.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de créditos</h1>
          <p className="text-muted-foreground">Conceda ou ajuste créditos de geração para usuários.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchUsers()} disabled={loading}>
            Atualizar lista
          </Button>
          <Badge variant="outline" className="text-xs px-2 py-1">
            Total de usuários: {users.length}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-md border border-dashed border-muted-foreground/40 py-10 text-center text-muted-foreground">
            Carregando usuários...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-md border border-dashed border-muted-foreground/40 py-10 text-center text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        ) : (
          users.map((userItem) => {
            const value = editValues[userItem.id] ?? userItem.credits;
            return (
              <Card key={userItem.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold">{userItem.name ?? "Usuário sem nome"}</CardTitle>
                    <p className="text-xs text-muted-foreground">{userItem.email ?? "sem email"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={userItem.isAdmin ? "default" : "outline"} className="text-xs">
                      {userItem.isAdmin ? "Admin" : "Usuário"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {userItem.totalGenerated} geradas
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="w-32"
                      value={value}
                      onChange={(event) =>
                        setEditValues((prev) => ({ ...prev, [userItem.id]: Number(event.target.value) }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">créditos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditValues((prev) => ({ ...prev, [userItem.id]: (prev[userItem.id] ?? userItem.credits) + 10 }))
                      }
                    >
                      +10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditValues((prev) => ({ ...prev, [userItem.id]: (prev[userItem.id] ?? userItem.credits) + 30 }))
                      }
                    >
                      +30
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateCredits(userItem.id)}
                      disabled={loading}
                    >
                      Salvar créditos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

