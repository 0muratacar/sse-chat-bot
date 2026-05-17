import type { Lang } from './slices/langSlice';

const translations = {
  en: {
    'auth.title': 'AI Chat Bot',
    'auth.subtitle': 'Your AI-powered chat assistant',
    'auth.hint': 'Admin or user — sign in with your email',
    'auth.email': 'Email',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.sendOtp': 'Send Verification Code',
    'auth.sending': 'Sending...',
    'auth.footer': 'Secure login with OTP verification',
    'auth.invalidEmail': 'Please enter a valid email address',
    'auth.emailRequired': 'Email address is required',
    'auth.otpFailed': 'Failed to send OTP',
    'otp.title': 'Verification Code',
    'otp.subtitle': 'Enter the 6-digit code sent to',
    'otp.verify': 'Verify',
    'otp.verifying': 'Verifying...',
    'otp.invalid': 'Invalid code',
    'otp.required': 'Please enter the verification code',
    'otp.back': 'Sign in with a different email',
    'chat.placeholder': 'Type your message...',
    'chat.empty': 'Send a message to start the conversation',
    'chat.failed': 'Your message could not be sent due to a temporary issue. Please try again later.',
  },
  tr: {
    'auth.title': 'AI Chat Bot',
    'auth.subtitle': 'Yapay zeka destekli sohbet asistanınız',
    'auth.hint': 'Admin veya kullanıcı — email adresinizle giriş yapın',
    'auth.email': 'Email',
    'auth.emailPlaceholder': 'ornek@email.com',
    'auth.sendOtp': 'Doğrulama Kodu Gönder',
    'auth.sending': 'Gönderiliyor...',
    'auth.footer': 'Güvenli OTP doğrulama ile giriş yapın',
    'auth.invalidEmail': 'Lütfen geçerli bir email adresi girin',
    'auth.emailRequired': 'Email adresi gerekli',
    'auth.otpFailed': 'OTP gönderilemedi',
    'otp.title': 'Doğrulama Kodu',
    'otp.subtitle': 'adresine gönderilen 6 haneli kodu girin',
    'otp.verify': 'Doğrula',
    'otp.verifying': 'Doğrulanıyor...',
    'otp.invalid': 'Geçersiz kod',
    'otp.required': 'Lütfen doğrulama kodunu girin',
    'otp.back': 'Farklı email ile giriş yap',
    'chat.placeholder': 'Mesajınızı yazın...',
    'chat.empty': 'Bir mesaj göndererek sohbete başlayın',
    'chat.failed': 'Geçici bir sorun nedeniyle mesajınız gönderilemedi. Daha sonra tekrar deneyin.',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];

export function t(key: TranslationKey, lang: Lang): string {
  return translations[lang][key] || translations['en'][key] || key;
}
