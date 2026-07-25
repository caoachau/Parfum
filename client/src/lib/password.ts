export type PasswordLanguage = "vi" | "en";

type PasswordCriterion = {
  key: "length" | "lowercase" | "uppercase" | "number" | "special";
  valid: boolean;
  label: string;
};

const labels = {
  vi: {
    length: "Ít nhất 8 ký tự",
    lowercase: "Ít nhất 1 chữ thường",
    uppercase: "Ít nhất 1 chữ hoa",
    number: "Ít nhất 1 chữ số",
    special: "Ít nhất 1 ký tự đặc biệt",
  },
  en: {
    length: "At least 8 characters",
    lowercase: "At least 1 lowercase letter",
    uppercase: "At least 1 uppercase letter",
    number: "At least 1 number",
    special: "At least 1 special character",
  },
} as const;

export function getPasswordCriteria(
  password: string,
  language: PasswordLanguage = "vi",
): PasswordCriterion[] {
  const text = labels[language];

  return [
    { key: "length", valid: password.length >= 8, label: text.length },
    { key: "lowercase", valid: /[a-z]/.test(password), label: text.lowercase },
    { key: "uppercase", valid: /[A-Z]/.test(password), label: text.uppercase },
    { key: "number", valid: /\d/.test(password), label: text.number },
    {
      key: "special",
      valid: /[^A-Za-z0-9\s\u00C0-\u024F]/.test(password),
      label: text.special,
    },
  ];
}

export function getPasswordError(
  password: string,
  language: PasswordLanguage = "vi",
) {
  const missing = getPasswordCriteria(password, language)
    .filter((criterion) => !criterion.valid)
    .map((criterion) => criterion.label.toLocaleLowerCase(language));

  if (missing.length === 0) return "";
  return language === "vi"
    ? `Mật khẩu còn thiếu: ${missing.join(", ")}.`
    : `Password is missing: ${missing.join(", ")}.`;
}
