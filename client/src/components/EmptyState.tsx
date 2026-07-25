import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

// Trang thai rong dung chung: gio hang trong, khong co don, khong co ket qua tim kiem...
export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border border-dashed border-[#D8CFC3] bg-[#FBF8F3] px-6 py-16 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-[#B39A37]">{icon}</div>}
      <h3 className="font-serif text-2xl text-[#2D2925]">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-6 text-[#7C746C]">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
