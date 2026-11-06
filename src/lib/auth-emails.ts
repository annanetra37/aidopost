import { emailLayout, sendEmail } from "./email";
import { env } from "./env";
import { createToken } from "./tokens";

// Short localised email copy (kept server-side so emails match the user's UI language).
const COPY: Record<
  string,
  { vSubject: string; vBody: string; vCta: string; rSubject: string; rBody: string; rCta: string }
> = {
  en: {
    vSubject: "Confirm your email",
    vBody: "Welcome to AidoPost! Confirm your email to get 5 free images.",
    vCta: "Confirm email",
    rSubject: "Reset your password",
    rBody: "Click below to choose a new password. The link expires in 1 hour.",
    rCta: "Reset password",
  },
  hy: {
    vSubject: "Հաստատեք ձեր էլ. հասցեն",
    vBody: "Բարի գալուստ AidoPost։ Հաստատեք էլ. հասցեն և ստացեք 5 անվճար նկար։",
    vCta: "Հաստատել",
    rSubject: "Գաղտնաբառի վերականգնում",
    rBody: "Սեղմեք ներքևում՝ նոր գաղտնաբառ ընտրելու համար։ Հղումը գործում է 1 ժամ։",
    rCta: "Վերականգնել",
  },
  ar: {
    vSubject: "أكّد بريدك الإلكتروني",
    vBody: "مرحبًا بك في AidoPost! أكّد بريدك الإلكتروني لتحصل على 5 صور مجانية.",
    vCta: "تأكيد البريد",
    rSubject: "إعادة تعيين كلمة المرور",
    rBody: "اضغط أدناه لاختيار كلمة مرور جديدة. تنتهي صلاحية الرابط خلال ساعة.",
    rCta: "إعادة التعيين",
  },
  de: {
    vSubject: "Bestätige deine E-Mail",
    vBody: "Willkommen bei AidoPost! Bestätige deine E-Mail und erhalte 5 kostenlose Bilder.",
    vCta: "E-Mail bestätigen",
    rSubject: "Passwort zurücksetzen",
    rBody: "Klicke unten, um ein neues Passwort zu wählen. Der Link ist 1 Stunde gültig.",
    rCta: "Passwort zurücksetzen",
  },
  tr: {
    vSubject: "E-postanı doğrula",
    vBody: "AidoPost'a hoş geldin! 5 ücretsiz görsel için e-postanı doğrula.",
    vCta: "E-postayı doğrula",
    rSubject: "Şifreni sıfırla",
    rBody: "Yeni bir şifre seçmek için aşağıya tıkla. Bağlantı 1 saat geçerlidir.",
    rCta: "Şifreyi sıfırla",
  },
  sv: {
    vSubject: "Bekräfta din e-post",
    vBody: "Välkommen till AidoPost! Bekräfta din e-post och få 5 gratis bilder.",
    vCta: "Bekräfta e-post",
    rSubject: "Återställ ditt lösenord",
    rBody: "Klicka nedan för att välja ett nytt lösenord. Länken gäller i 1 timme.",
    rCta: "Återställ lösenord",
  },
  es: {
    vSubject: "Confirma tu correo",
    vBody: "¡Bienvenido a AidoPost! Confirma tu correo y obtén 5 imágenes gratis.",
    vCta: "Confirmar correo",
    rSubject: "Restablece tu contraseña",
    rBody: "Haz clic abajo para elegir una nueva contraseña. El enlace caduca en 1 hora.",
    rCta: "Restablecer contraseña",
  },
};

export async function sendVerificationEmail(email: string, locale: string) {
  const c = COPY[locale] ?? COPY.en;
  const token = await createToken(email, "verify", 48);
  const url = `${env.appUrl}/api/auth/verify?token=${token}&locale=${locale}`;
  await sendEmail(email, c.vSubject, emailLayout(c.vSubject, c.vBody, url, c.vCta));
}

export async function sendResetEmail(email: string, locale: string) {
  const c = COPY[locale] ?? COPY.en;
  const token = await createToken(email, "reset", 1);
  const url = `${env.appUrl}/${locale}/reset?token=${token}`;
  await sendEmail(email, c.rSubject, emailLayout(c.rSubject, c.rBody, url, c.rCta));
}
