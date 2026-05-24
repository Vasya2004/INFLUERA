import { Share2 } from "lucide-react";
import { SiInstagram, SiTelegram, SiThreads, SiTiktok, SiVk, SiX, SiYoutube } from "react-icons/si";
import { Platform } from "@/lib/types";

type PlatformAvatarSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASS: Record<PlatformAvatarSize, { box: string; icon: string; radius: string }> = {
  xs: { box: "h-5 w-5", icon: "h-3 w-3", radius: "rounded-md" },
  sm: { box: "h-6 w-6", icon: "h-3.5 w-3.5", radius: "rounded-md" },
  md: { box: "h-10 w-10", icon: "h-5 w-5", radius: "rounded-xl" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", radius: "rounded-xl" },
};

export function platformAccent(platform?: Pick<Platform, "accentColor">) {
  return platform?.accentColor ?? "#5B6F92";
}

export function platformTint(color: string, amount = 12) {
  return `color-mix(in srgb, ${color} ${amount}%, transparent)`;
}

export function platformBorder(color: string, amount = 24) {
  return `color-mix(in srgb, ${color} ${amount}%, hsl(var(--border)))`;
}

export function PlatformBuiltinIcon({ name, className }: { name: string; className?: string }) {
  const cls = className ?? "h-4 w-4";
  switch (name) {
    case "Telegram": return <SiTelegram className={cls} />;
    case "Instagram": return <SiInstagram className={cls} />;
    case "YouTube": return <SiYoutube className={cls} />;
    case "TikTok": return <SiTiktok className={cls} />;
    case "X": return <SiX className={cls} />;
    case "VK": return <SiVk className={cls} />;
    case "Threads": return <SiThreads className={cls} />;
    default: return <Share2 className={cls} />;
  }
}

export function PlatformAvatar({
  platform,
  size = "md",
}: {
  platform: Pick<Platform, "name" | "iconUrl" | "accentColor">;
  size?: PlatformAvatarSize;
}) {
  const accent = platformAccent(platform);
  const classes = SIZE_CLASS[size];

  if (platform.iconUrl) {
    return (
      <div
        className={`${classes.box} ${classes.radius} shrink-0 overflow-hidden border`}
        style={{ borderColor: platformBorder(accent) }}
      >
        <img src={platform.iconUrl} alt={platform.name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${classes.box} ${classes.radius} shrink-0 flex items-center justify-center`}
      style={{ background: platformTint(accent, 14), color: accent }}
    >
      <PlatformBuiltinIcon name={platform.name} className={classes.icon} />
    </div>
  );
}
