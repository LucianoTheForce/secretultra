"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/studio",
      })
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Bem-vindo!
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Faça login para começar a criar imagens incríveis com IA
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-950/20 dark:to-blue-950/20 border-0">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/ultrinho.png"
                alt="Ultrinho"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Conecte-se com sua conta Google para acessar todos os recursos
              </p>
              
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                size="lg"
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Conectando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Entrar com Google</span>
                  </div>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Ao fazer login, você concorda com nossos{" "}
                <a href="#" className="underline hover:text-primary">
                  Termos de Serviço
                </a>{" "}
                e{" "}
                <a href="#" className="underline hover:text-primary">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}