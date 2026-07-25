import { Check, X } from "lucide-react";
import { getPasswordCriteria, type PasswordLanguage } from "../lib/password";

type PasswordRequirementsProps = {
  password: string;
  language?: PasswordLanguage;
  className?: string;
};

export function PasswordRequirements({
  password,
  language = "vi",
  className = "",
}: PasswordRequirementsProps) {
  const criteria = getPasswordCriteria(password, language);
  const missingCount = criteria.filter((criterion) => !criterion.valid).length;

  return (
    <div className={`border border-[#DED5CA] bg-[#F7F2EC] p-4 ${className}`} aria-live="polite">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#746C64]">
        {missingCount === 0
          ? language === "vi"
            ? "Mật khẩu đã đủ tiêu chí"
            : "Mật khẩu đã đủ tiêu chí"
          : language === "vi"
            ? `Còn thiếu ${missingCount} tiêu chí`
            : `Còn thiếu ${missingCount} tiêu chí`}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {criteria.map((criterion) => (
          <li
            key={criterion.key}
            className={`flex items-center gap-2 text-xs ${
              criterion.valid ? "text-[#4E6B45]" : "text-[#A3433E]"
            }`}
          >
            {criterion.valid ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <X size={14} aria-hidden="true" />
            )}
            <span>{criterion.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
