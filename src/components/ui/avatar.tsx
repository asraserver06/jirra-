import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({ src, alt = "Avatar", fallback = "U", className, ...props }: AvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(!src);

  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/40 select-none bg-muted",
        className
      )}
      {...props}
    >
      {src && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setImageFailed(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-xs uppercase bg-[#0052CC] text-white">
          {fallback.substring(0, 2)}
        </span>
      )}
    </div>
  );
}
