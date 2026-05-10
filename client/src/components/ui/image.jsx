"use client";
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react";

function getImageSrc({
  base64,
  mediaType
}) {
  if (base64 && mediaType) {
    return `data:${mediaType};base64,${base64}`
  }
  return undefined
}

export const Image = ({
  base64,
  uint8Array,
  mediaType = "image/png",
  className,
  alt,
  ...props
}) => {
  const [objectUrl, setObjectUrl] = useState(undefined)

  useEffect(() => {
    if (uint8Array && mediaType) {
      const blob = new Blob([uint8Array], { type: mediaType })
      const url = URL.createObjectURL(blob)
      setObjectUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      };
    }
    setObjectUrl(undefined)
    return
  }, [uint8Array, mediaType])

  const base64Src = getImageSrc({ base64, mediaType })
  const src = base64Src ?? objectUrl

  if (!src) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn(
          "h-auto max-w-full animate-pulse overflow-hidden rounded-md bg-gray-100 dark:bg-neutral-800",
          className
        )}
        {...props} />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-auto max-w-full overflow-hidden rounded-md", className)}
      role="img"
      {...props} />
  );
}
