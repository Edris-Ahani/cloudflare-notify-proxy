// Bilingual message templates for Telegram notifications and Bot interactions

export function getWelcomeMessage(lang: string = "en") {
  if (lang === "fa") {
    return {
      text: [
        "<b>👋 به ربات سی‌اف نوتیفای خوش آمدید</b>",
        "━━━━━━━━━━━━━━━━━━━━━",
        "جهت دریافت کد تایید اعتبارسنجی:",
        "",
        "1️⃣ دکمه <b>📱 اشتراک‌گذاری شماره موبایل</b> در پایین را لمس کنید، یا",
        "2️⃣ شماره موبایل ۱۱ رقمی خود را اینجا ارسال کنید (مثال: <code>09307634831</code>).",
      ].join("\n"),
      buttonText: "📱 اشتراک‌گذاری شماره موبایل",
    };
  }

  return {
    text: [
      "<b>👋 Welcome to Cloudflare Notify Bot</b>",
      "━━━━━━━━━━━━━━━━━━━━━",
      "To receive your verification code:",
      "",
      "1️⃣ Tap <b>📱 Share Phone Number</b> below, or",
      "2️⃣ Type your 11-digit mobile number here (e.g., <code>09307634831</code>).",
    ].join("\n"),
    buttonText: "📱 Share Phone Number",
  };
}

export function getOtpMessage(otp: string, firstName: string, lang: string = "en") {
  if (lang === "fa") {
    return [
      "<b>🔐 سی‌اف نوتیفای - کد تایید حساب</b>",
      "━━━━━━━━━━━━━━━━━━━━━",
      `سلام <b>${firstName}</b> عزیز 👋`,
      "",
      "کد تایید ۵ رقمی شما:",
      `👉 <code>${otp}</code> 👈`,
      "<i>(برای کپی کردن روی کد بالا بزنید)</i>",
      "",
      "⏱ مدت اعتبار: ۵ دقیقه",
      "⚠️ این کد امنیتی را هرگز در اختیار دیگران قرار ندهید.",
    ].join("\n");
  }

  return [
    "<b>🔐 Cloudflare Notify Verification</b>",
    "━━━━━━━━━━━━━━━━━━━━━",
    `Hello <b>${firstName}</b> 👋`,
    "",
    "Your 5-digit verification code is:",
    `👉 <code>${otp}</code> 👈`,
    "<i>(Tap the code above to copy it)</i>",
    "",
    "⏱ Valid for 5 minutes.",
    "⚠️ Never share this security code with anyone.",
  ].join("\n");
}

export function getPhoneVerifiedMessage(otp: string, firstName: string, lang: string = "en") {
  if (lang === "fa") {
    return [
      "<b>✅ شماره موبایل شما تایید شد!</b>",
      "━━━━━━━━━━━━━━━━━━━━━",
      `سلام <b>${firstName}</b> عزیز 👋`,
      "",
      "کد تایید ۵ رقمی شما:",
      `👉 <code>${otp}</code> 👈`,
      "<i>(برای کپی کردن روی کد بالا بزنید)</i>",
      "",
      "اکنون می‌توانید برای تکمیل ثبت‌نام به وب‌سایت بازگردید.",
    ].join("\n");
  }

  return [
    "<b>✅ Phone Number Verified!</b>",
    "━━━━━━━━━━━━━━━━━━━━━",
    `Hello <b>${firstName}</b> 👋`,
    "",
    "Your 5-digit verification code is:",
    `👉 <code>${otp}</code> 👈`,
    "<i>(Tap the code above to copy it)</i>",
    "",
    "You can now return to the website to complete your registration.",
  ].join("\n");
}

export function getPasswordResetMessage(otp: string, lang: string = "en") {
  if (lang === "fa") {
    return [
      "<b>🔐 سی‌اف نوتیفای - کد تغییر رمز عبور</b>",
      "━━━━━━━━━━━━━━━━━━━━━",
      "درخواست بازنشانی کلمه عبور برای حساب شما ثبت شده است.",
      "",
      "کد تایید ۵ رقمی شما:",
      `👉 <code>${otp}</code> 👈`,
      "<i>(برای کپی کردن روی کد بالا بزنید)</i>",
      "",
      "⏱ مدت اعتبار: ۵ دقیقه",
      "⚠️ اگر شما این درخواست را نداده‌اید، لطفاً این پیام را نادیده بگیرید.",
    ].join("\n");
  }

  return [
    "<b>🔐 Cloudflare Notify Password Reset</b>",
    "━━━━━━━━━━━━━━━━━━━━━",
    "A password reset was requested for your account.",
    "",
    "Your 5-digit verification code is:",
    `👉 <code>${otp}</code> 👈`,
    "<i>(Tap the code above to copy it)</i>",
    "",
    "⏱ Valid for 5 minutes.",
    "⚠️ If you did not request this, please ignore this message.",
  ].join("\n");
}

export function getPasswordChangedMessage(lang: string = "en") {
  if (lang === "fa") {
    return "<b>🔒 رمز عبور با موفقیت تغییر کرد</b>\n\nرمز عبور حساب کاربری شما به‌روزرسانی شد. اگر شما این تغییر را ایجاد نکرده‌اید، لطفاً بلافاصله با پشتیبانی تماس بگیرید.";
  }
  return "<b>🔒 Password Changed Successfully</b>\n\nYour account password has been updated. If you did not make this change, please contact support immediately.";
}

export function getAccountDeletedMessage(lang: string = "en") {
  if (lang === "fa") {
    return "<b>⚠️ حساب کاربری حذف شد</b>\n\nحساب کاربری سی‌اف نوتیفای شما و تمامی منابع مرتبط برای همیشه از سیستم حذف شدند.";
  }
  return "<b>⚠️ Account Deleted</b>\n\nYour Cloudflare Notify account and all associated resources have been permanently deleted from our system.";
}
