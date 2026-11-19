// Bilingual message dictionary for English to Persian translation

export const FA_TRANSLATIONS: Record<string, string> = {
  // Authentication & Session Errors
  "A user with this phone number already exists": "کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است.",
  "An account with this phone number already exists. Please log in.": "حسابی با این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.",
  "Invalid phone number or password": "شماره موبایل یا کلمه عبور نادرست است.",
  "User not found": "کاربر مورد نظر یافت نشد.",
  "Verification session not found": "نشست تایید اعتبار یافت نشد.",
  "Invalid or non-existent verification session": "نشست تایید اعتبار نامعتبر است یا وجود ندارد.",
  "Verification session has expired. Please request a new code.": "نشست تایید اعتبار منقضی شده است. لطفاً مجدداً درخواست کد دهید.",
  "Invalid verification code. Please check your Telegram message.": "کد تایید نادرست است. لطفاً پیام دریافتی از تلگرام را بررسی کنید.",
  "Password is required to create a new account": "برای ساخت حساب کاربری وارد کردن کلمه عبور الزامی است.",
  "No account registered with this phone number": "حساب کاربری با این شماره موبایل ثبت نشده است.",
  "Invalid or non-existent password reset session": "نشست بازنشانی رمز عبور نامعتبر است یا یافت نشد.",
  "Password reset code has expired. Please request a new one.": "کد بازنشانی رمز عبور منقضی شده است. لطفاً مجدداً درخواست دهید.",
  "No account found for this phone number": "هیچ حسابی برای این شماره موبایل یافت نشد.",
  "User account not found": "حساب کاربری پیدا نشد.",
  "Invalid token payload": "توکن ارسالی نامعتبر است.",
  "Unauthorized": "دسترسی غیرمجاز. لطفاً ابتدا وارد حساب خود شوید.",

  // Success Responses
  "Registration successful": "ثبت‌نام با موفقیت انجام شد.",
  "Login successful": "ورود با موفقیت انجام شد.",
  "Registration and verification successful": "ثبت‌نام و تایید شماره با موفقیت انجام شد.",
  "Password reset successful": "رمز عبور با موفقیت تغییر کرد.",
  "Account and all associated data permanently deleted": "حساب کاربری و تمامی داده‌های مربوطه برای همیشه حذف شدند.",
  "Worker deployed successfully to your Cloudflare account": "ورکر با موفقیت روی حساب کلودفلر شما مستقر شد.",
  "Message sent successfully": "پیام با موفقیت ارسال شد.",

  // Cloudflare & Telegram Operations
  "Invalid Cloudflare API Token or insufficient permissions": "توکن API کلودفلر نامعتبر است یا دسترسی‌های کافی ندارد.",
  "Cloudflare configuration not found for this account": "پیکربندی کلودفلر برای این حساب یافت نشد.",
  "Please configure your Cloudflare account ID and API Token first": "لطفاً ابتدا شناسه حساب و توکن API کلودفلر خود را ثبت کنید.",
  "Telegram bot not found": "ربات تلگرام مورد نظر یافت نشد.",
  "Worker deployment not found": "دپلوی ورکر یافت نشد.",
  "Template not found": "قالب پیام یافت نشد.",
  "No Telegram bot configured. Please register a bot first.": "هیچ ربات تلگرامی ثبت نشده است. لطفاً ابتدا ربات خود را ثبت کنید.",
  "No Telegram chat/channel configured.": "هیچ چت یا کانال تلگرامی پیکربندی نشده است.",

  // Common DTO / Validation Errors
  "phoneNumber must be a valid phone number": "فرمت شماره موبایل نامعتبر است.",
  "phoneNumber should not be empty": "شماره موبایل نباید خالی باشد.",
  "password must be longer than or equal to 8 characters": "کلمه عبور باید حداقل ۸ کاراکتر باشد.",
  "password should not be empty": "کلمه عبور نباید خالی باشد.",
  "newPassword must be longer than or equal to 8 characters": "کلمه عبور جدید باید حداقل ۸ کاراکتر باشد.",
  "newPassword should not be empty": "کلمه عبور جدید نباید خالی باشد.",
  "otpCode should not be empty": "کد تایید نباید خالی باشد.",
  "accountId should not be empty": "شناسه اکانت کلودفلر نباید خالی باشد.",
  "apiToken should not be empty": "توکن API کلودفلر نباید خالی باشد.",
  "token should not be empty": "توکن نباید خالی باشد.",
  "title should not be empty": "عنوان نباید خالی باشد.",
  "chatId should not be empty": "شناسه چت/کانال نباید خالی باشد.",
  "name should not be empty": "نام نباید خالی باشد.",
  "content should not be empty": "محتوا نباید خالی باشد.",
};

// Dynamic prefix patterns for translating structured error prefixes
export function translateMessage(msg: string, lang: string): string {
  if (lang !== "fa" || !msg) {
    return msg;
  }

  // Exact match
  if (FA_TRANSLATIONS[msg]) {
    return FA_TRANSLATIONS[msg];
  }

  // Regex and pattern matches
  if (msg.startsWith("Invalid Telegram Bot Token:")) {
    const details = msg.replace("Invalid Telegram Bot Token:", "").trim();
    return `توکن ربات تلگرام نامعتبر است: ${details}`;
  }

  if (msg.startsWith("Bot cannot access chat")) {
    return "ربات به این کانال یا چت دسترسی ندارد. لطفاً اطمینان حاصل کنید که ربات را به عنوان ادمین در کانال اضافه کرده‌اید.";
  }

  if (msg.startsWith("Trial limit reached")) {
    return "سقف درخواست‌های آزمایشی پر شده است. برای ارسال پیام نامحدود، حساب کلودفلر خود را متصل کرده و ورکر اختصاصی خود را مستقر کنید.";
  }

  if (msg.startsWith("Telegram Error:")) {
    const details = msg.replace("Telegram Error:", "").trim();
    return `خطای تلگرام: ${details}`;
  }

  if (msg.startsWith("Cloudflare API Error:")) {
    const details = msg.replace("Cloudflare API Error:", "").trim();
    return `خطای سرویس کلودفلر: ${details}`;
  }

  if (msg.includes("Worker deployment '") && msg.includes("deleted successfully")) {
    return "دپلوی ورکر با موفقیت حذف شد.";
  }

  return msg;
}
