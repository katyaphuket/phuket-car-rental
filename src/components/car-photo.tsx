"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PhotoPlaceholder } from "./photo-placeholder";

type CarPhotoProps = {
  carId: string;
  alt: string;
  icon?: string;
  className?: string;
};

export function CarPhoto({ carId, alt, icon = "ti-car", className = "" }: CarPhotoProps) {
  const [status, setStatus] = useState<"loading" | "found" | "missing">("loading");
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to a loading state whenever carId changes
    setStatus("loading");
    setUrl(null);

    fetch(`/api/car-image?id=${encodeURIComponent(carId)}`)
      .then((res) => res.json())
      .then((data: { url: string | null }) => {
        if (cancelled) return;
        setUrl(data.url);
        setStatus(data.url ? "found" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [carId]);

  if (status === "loading") {
    return <div className={`animate-pulse bg-surface-muted ${className}`} />;
  }

  if (status === "missing" || !url) {
    return <PhotoPlaceholder icon={icon} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={url} alt={alt} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
    </div>
  );
}
