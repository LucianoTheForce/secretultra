import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc, eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { hasAdminAccess, isMasterAdminEmail } from "@/lib/master-admin";
import { db } from "@/lib/db";
import { generatedImages, user } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/welcome");
  }

  const email = session.user.email ?? null;
  if (!hasAdminAccess(email)) {
    redirect("/studio");
  }

  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const compactFormatter = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const aggregateRow =
    (
      await db
        .select({
          totalUsers: sql<number>`count(${user.id})`,
          totalCredits: sql<number>`coalesce(sum(${user.credits}), 0)`,
        })
        .from(user)
    )[0] ?? { totalUsers: 0, totalCredits: 0 };

  const totalGenerationsRow =
    (
      await db
        .select({ totalGenerations: sql<number>`count(${generatedImages.id})` })
        .from(generatedImages)
    )[0] ?? { totalGenerations: 0 };

  const totalAdminsRow =
    (
      await db
        .select({ totalAdmins: sql<number>`count(${user.id})` })
        .from(user)
        .where(eq(user.isAdmin, true))
    )[0] ?? { totalAdmins: 0 };

  const latestUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(5);

  const topCreatorsRaw = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      totalGenerated: sql<number>`count(${generatedImages.id})`,
    })
    .from(user)
    .leftJoin(generatedImages, eq(user.id, generatedImages.userId))
    .groupBy(user.id, user.name, user.email)
    .orderBy(desc(sql`count(${generatedImages.id})`))
    .limit(5);

  const totalUsers = Number(aggregateRow.totalUsers ?? 0);
  const totalCredits = Number(aggregateRow.totalCredits ?? 0);
  const totalGenerations = Number(totalGenerationsRow.totalGenerations ?? 0);
  const totalAdmins = Number(totalAdminsRow.totalAdmins ?? 0);

  const topCreators = topCreatorsRaw.map((item) => ({
    ...item,
    totalGenerated: Number(item.totalGenerated ?? 0),
  }));

  const stats = [
    {
      key: "users",
      label: "Usu\u00e1rios",
      value: numberFormatter.format(totalUsers),
      help: "Contas registradas",
    },
    {
      key: "admins",
      label: "Admins ativos",
      value: numberFormatter.format(totalAdmins),
      help: "Contas com acesso administrativo",
    },
    {
      key: "credits",
      label: "Total de cr\u00e9ditos",
      value: compactFormatter.format(totalCredits),
      help: "Soma dos cr\u00e9ditos dispon\u00edveis",
    },
    {
      key: "generations",
      label: "Assets gerados",
      value: compactFormatter.format(totalGenerations),
      help: "Quantidade total de gera\u00e7\u00f5es",
    },
  ] as const;

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Controle cr\u00e9ditos e acompanhe o que est\u00e1 acontecendo no app.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isMasterAdminEmail(email) && (
            <Badge variant="secondary" className="uppercase tracking-[0.24em]">
              Master
            </Badge>
          )}
          <Button asChild variant="outline">
            <Link href="/studio">Voltar para o studio</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.help}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">\u00daltimos usu\u00e1rios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum usu\u00e1rio encontrado.</p>
            )}
            {latestUsers.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {item.isAdmin && <Badge variant="outline">Admin</Badge>}
                    {isMasterAdminEmail(item.email ?? null) && (
                      <Badge variant="secondary">Master</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Saldo: {numberFormatter.format(item.credits)} cr\u00e9ditos</span>
                  <span>{dateFormatter.format(item.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">A\u00e7\u00f5es r\u00e1pidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/admin/credits">Gerenciar cr\u00e9ditos</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Ajuste cr\u00e9ditos de usu\u00e1rios e acompanhe o impacto na experi\u00eancia.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top criadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCreators.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma gera\u00e7\u00e3o registrada.</p>
              )}
              {topCreators.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{creator.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{creator.email}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {numberFormatter.format(creator.totalGenerated)} gerados
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
