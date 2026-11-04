import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  priority?: boolean;
  className?: string;
}

export default function BrandLogo({
  href = "/",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const logo = (
    <div
      className={`flex items-center gap-3 ${className}`}
    >
      <Image
        src="/purelyjid-logo.png"
        alt="PurelyJid"
        width={150}
        height={60}
        priority={priority}
        className="h-12 w-auto object-contain"
      />

      <div className="sr-only">
        PurelyJid
      </div>
    </div>
  );

  if (!href) {
    return logo;
  }

  return (
    <Link
      href={href}
      aria-label="PurelyJid home"
      className="inline-flex"
    >
      {logo}
    </Link>
  );
}
