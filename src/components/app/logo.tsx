import { Link } from "wouter";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "h-6 w-6",
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

type AppLogoProps = {
  size?: keyof typeof SIZES;
  className?: string;
  showWordmark?: boolean;
  href?: string;
  onClick?: () => void;
  /** Без обёртки Link — если логотип уже внутри другой ссылки */
  unlinked?: boolean;
};

export function AppLogo({
  size = "md",
  className,
  showWordmark = false,
  href = "/",
  onClick,
  unlinked = false,
}: AppLogoProps) {
  const mark = (
    <img
      src="/logo.png"
      alt="Influera"
      className={cn(SIZES[size], "shrink-0 object-contain", className)}
      width={size === "xs" ? 24 : size === "sm" ? 28 : size === "lg" ? 48 : 40}
      height={size === "xs" ? 24 : size === "sm" ? 28 : size === "lg" ? 48 : 40}
    />
  );

  const content = showWordmark ? (
    <span className="flex items-center gap-2.5 min-w-0">
      {mark}
      <span className="text-base font-bold leading-none tracking-tight">Influera</span>
    </span>
  ) : (
    mark
  );

  if (!unlinked && href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex shrink-0 rounded-xl transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0">{content}</span>;
}
