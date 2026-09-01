import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showWordmark = true,
  size = 32,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <Link
      href={href}
      aria-label="AI CareerOS home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span
        className="relative shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo-mark.png"
          alt=""
          width={size}
          height={size}
          priority
          className="block dark:hidden"
          style={{ width: size, height: size }}
        />
        <Image
          src="/logo-mark-dark.png"
          alt=""
          width={size}
          height={size}
          priority
          className="hidden dark:block"
          style={{ width: size, height: size }}
        />
      </span>
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight">AI CareerOS</span>
      ) : null}
    </Link>
  );
}

export function LogoLockup({ className, width = 260 }: { className?: string; width?: number }) {
  const height = Math.round((width * 422) / 529);
  return (
    <span className={cn("inline-block", className)}>
      <Image
        src="/logo-full.png"
        alt="AI CareerOS — Analyze, Grow, Get Hired"
        width={width}
        height={height}
        priority
        className="block h-auto dark:hidden"
      />
      <Image
        src="/logo-full-dark.png"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        priority
        className="hidden h-auto dark:block"
      />
    </span>
  );
}
