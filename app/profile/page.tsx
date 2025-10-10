"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";
import type { Language } from "@/lib/i18n";
import { Mail, Calendar, User, Shield, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<string>("system");

  useEffect(() => {
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [theme]);

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    setTheme(value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

  const user = session.user;
  const dateLocale = language === "pt" ? "pt-BR" : "en-US";
  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const createdDateLabel = createdDate
    ? t("profile.memberSince", { date: createdDate })
    : null;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("profile.back")}
        </Button>
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
      </div>

      <div className="grid gap-6">
        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user.image || ""}
                  alt={user.name || "User"}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="text-lg">
                  {(
                    user.name?.[0] ||
                    user.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">{user.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      {t("profile.emailVerified")}
                    </Badge>
                  )}
                </div>
                {createdDate && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{createdDateLabel}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.accountInformationTitle")}</CardTitle>
            <CardDescription>{t("profile.accountInformationDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("profile.fullName")}
                </label>
                <div className="p-3 border rounded-md bg-muted/10">
                  {user.name || t("profile.notProvided")}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("profile.emailAddress")}
                </label>
                <div className="p-3 border rounded-md bg-muted/10 flex items-center justify-between">
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {t("profile.emailVerified")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("profile.accountStatusHeading")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{t("profile.emailVerification")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("profile.emailVerificationDescription")}
                    </p>
                  </div>
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{t("profile.accountType")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("profile.accountTypeDescription")}
                    </p>
                  </div>
                  <Badge variant="outline">{t("profile.standard")}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.recentActivityTitle")}</CardTitle>
            <CardDescription>{t("profile.recentActivityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{t("profile.currentSession")}</p>
                    <p className="text-sm text-muted-foreground">{t("profile.activeNow")}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {t("profile.activeBadge")}
                </Badge>
              </div>
            </div>
          </CardContent>
</Card>

        {/* Interface Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.interfacePreferencesTitle")}</CardTitle>
            <CardDescription>{t("profile.interfacePreferencesDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div>
                <p className="font-medium">{t("profile.themeLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("profile.themeDescription")}
                </p>
              </div>
              <Select value={selectedTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="mt-3 w-full md:w-72">
                  <SelectValue placeholder={t("profile.selectThemePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("profile.themeLight")}</SelectItem>
                  <SelectItem value="dark">{t("profile.themeDark")}</SelectItem>
                  <SelectItem value="system">{t("profile.themeSystem")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="font-medium">{t("profile.languageLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("profile.languageDescription")}
                </p>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="mt-3 w-full md:w-72">
                  <SelectValue placeholder={t("profile.selectLanguagePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">{t("profile.languagePortuguese")}</SelectItem>
                  <SelectItem value="en">{t("profile.languageEnglish")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.quickActionsTitle")}</CardTitle>
            <CardDescription>{t("profile.quickActionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4" disabled>
                <User className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{t("profile.editProfile")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("profile.editProfileDescription")}
                  </div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4" disabled>
                <Shield className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{t("profile.securitySettings")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("profile.securitySettingsDescription")}
                  </div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4" disabled>
                <Mail className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{t("profile.viewActivity")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("profile.viewActivityDescription")}
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}