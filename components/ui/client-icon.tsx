"use client";

import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";

interface ClientIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  [key: string]: any;
}

export function ClientIcon({
  icon: Icon,
  className,
  size,
  ...props
}: ClientIconProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a placeholder with the same dimensions during SSR
    return (
      <div
        className={className}
        style={{
          width: size || 24,
          height: size || 24,
          display: "inline-block",
        }}
      />
    );
  }

  return <Icon className={className} size={size} {...props} />;
}
