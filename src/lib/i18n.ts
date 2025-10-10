export type Language = "pt" | "en";

export const fallbackLanguage: Language = "pt";

export const availableLanguages: Array<{ value: Language; label: string }> = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
];

const dictionaries: Record<Language, Record<string, string>> = {
  pt: {
    "profile.back": "Voltar",
    "profile.title": "Seu Perfil",
    "profile.accountInformationTitle": "Informações da conta",
    "profile.accountInformationDescription": "Detalhes da sua conta e ajustes.",
    "profile.fullName": "Nome completo",
    "profile.emailAddress": "Endereço de e-mail",
    "profile.notProvided": "Não informado",
    "profile.emailVerification": "Verificação de e-mail",
    "profile.emailVerificationDescription": "Status de verificação do endereço de e-mail",
    "profile.accountType": "Tipo de conta",
    "profile.accountTypeDescription": "Nível de acesso da sua conta",
    "profile.standard": "Padrão",
    "profile.accountStatusHeading": "Status da conta",
    "profile.emailVerified": "Verificado",
    "profile.emailUnverified": "Não verificado",
    "profile.memberSince": "Membro desde {{date}}",
    "profile.recentActivityTitle": "Atividade recente",
    "profile.recentActivityDescription": "Últimas atividades e sessões da conta",
    "profile.currentSession": "Sessão atual",
    "profile.activeNow": "Ativa no momento",
    "profile.activeBadge": "Ativa",
    "profile.quickActionsTitle": "Ações rápidas",
    "profile.quickActionsDescription": "Gerencie suas configurações e preferências",
    "profile.editProfile": "Editar perfil",
    "profile.editProfileDescription": "Atualize suas informações",
    "profile.securitySettings": "Segurança",
    "profile.securitySettingsDescription": "Gerencie senha e autenticação",
    "profile.viewActivity": "Ver atividade",
    "profile.viewActivityDescription": "Consulte os acessos recentes",
    "profile.interfacePreferencesTitle": "Preferências de interface",
    "profile.interfacePreferencesDescription": "Personalize tema e idioma do site",
    "profile.themeLabel": "Tema",
    "profile.themeDescription": "Escolha como a interface deve aparecer",
    "profile.themeLight": "Claro",
    "profile.themeDark": "Escuro",
    "profile.themeSystem": "Sistema",
    "profile.selectThemePlaceholder": "Selecione um tema",
    "profile.languageLabel": "Idioma",
    "profile.languageDescription": "Selecione o idioma exibido na interface",
    "profile.languageEnglish": "Inglês",
    "profile.languagePortuguese": "Português",
    "profile.selectLanguagePlaceholder": "Selecione um idioma",
  },
  en: {
    "profile.back": "Back",
    "profile.title": "Your Profile",
    "profile.accountInformationTitle": "Account information",
    "profile.accountInformationDescription": "Your account details and settings.",
    "profile.fullName": "Full name",
    "profile.emailAddress": "Email address",
    "profile.notProvided": "Not provided",
    "profile.emailVerification": "Email verification",
    "profile.emailVerificationDescription": "Email address verification status",
    "profile.accountType": "Account type",
    "profile.accountTypeDescription": "Your account access level",
    "profile.standard": "Standard",
    "profile.accountStatusHeading": "Account status",
    "profile.emailVerified": "Verified",
    "profile.emailUnverified": "Unverified",
    "profile.memberSince": "Member since {{date}}",
    "profile.recentActivityTitle": "Recent activity",
    "profile.recentActivityDescription": "Your recent account activity and sessions",
    "profile.currentSession": "Current session",
    "profile.activeNow": "Active now",
    "profile.activeBadge": "Active",
    "profile.quickActionsTitle": "Quick actions",
    "profile.quickActionsDescription": "Manage your account settings and preferences",
    "profile.editProfile": "Edit profile",
    "profile.editProfileDescription": "Update your information",
    "profile.securitySettings": "Security settings",
    "profile.securitySettingsDescription": "Manage password and authentication",
    "profile.viewActivity": "View activity",
    "profile.viewActivityDescription": "Check recent logins",
    "profile.interfacePreferencesTitle": "Interface preferences",
    "profile.interfacePreferencesDescription": "Customize the site theme and language",
    "profile.themeLabel": "Theme",
    "profile.themeDescription": "Choose how the interface should look",
    "profile.themeLight": "Light",
    "profile.themeDark": "Dark",
    "profile.themeSystem": "System",
    "profile.selectThemePlaceholder": "Select a theme",
    "profile.languageLabel": "Language",
    "profile.languageDescription": "Select the language used in the interface",
    "profile.languageEnglish": "English",
    "profile.languagePortuguese": "Portuguese",
    "profile.selectLanguagePlaceholder": "Select a language",
  },
};

export function getTranslation(
  language: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dictionary = dictionaries[language] ?? dictionaries[fallbackLanguage];
  const fallbackDictionary = dictionaries[fallbackLanguage];
  const template = dictionary[key] ?? fallbackDictionary[key] ?? key;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((acc, [paramKey, value]) => {
    const pattern = new RegExp(`{{\s*${paramKey}\s*}}`, "g");
    return acc.replace(pattern, String(value));
  }, template);
}

export function getLanguageLabel(language: Language): string {
  const entry = availableLanguages.find((item) => item.value === language);
  return entry?.label ?? language;
}
