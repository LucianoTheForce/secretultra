"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { UserProfile } from "@/components/auth/user-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { useCredits } from "@/hooks/use-credits";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const { isAiReady, loading: diagnosticsLoading } = useDiagnostics();
  const {
    data: creditsData,
    loading: creditsLoading,
    error: creditsError,
  } = useCredits();

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Protected Page</h1>
            <p className="text-muted-foreground mb-6">
              You need to sign in to access the dashboard
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">AI Chat</h2>
          <p className="text-muted-foreground mb-4">
            Start a conversation with AI using the Vercel AI SDK
          </p>
          {diagnosticsLoading || !isAiReady ? (
            <Button disabled>
              Go to Chat
            </Button>
          ) : (
            <Button asChild>
              <Link href="/chat">Go to Chat</Link>
            </Button>
          )}
        </div>

        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Profile</h2>
          <p className="text-muted-foreground mb-4">
            Manage your account settings and preferences
          </p>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {session.user.name}
            </p>
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Creditos</h2>
          <p className="text-muted-foreground mb-4">
            Acompanhe seus creditos disponiveis para gerar novas imagens.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            <Badge variant="secondary" className="w-fit text-xs px-2 py-1">
              Creditos: {creditsLoading ? "carregando..." : creditsData?.credits ?? "-"}
            </Badge>
            <Badge variant="outline" className="w-fit text-xs px-2 py-1">
              Geradas: {creditsLoading ? "carregando..." : creditsData?.totalGenerated ?? 0}
            </Badge>
            {creditsError && (
              <span className="text-xs text-destructive">
                Nao foi possivel carregar os creditos ({creditsError})
              </span>
            )}
          </div>
          {creditsData?.isAdmin && (
            <Button asChild>
              <Link href="/admin/credits">Gerenciar creditos</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
