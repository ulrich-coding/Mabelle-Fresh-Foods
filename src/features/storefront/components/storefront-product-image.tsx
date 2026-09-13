"use client";

import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import type { StorefrontProductPhoto } from "../types/catalog";

type StorefrontProductImageProps = {
  alt: string;
  className?: string;
  photo?: StorefrontProductPhoto;
};

export function StorefrontProductImage({ alt, className, photo }: StorefrontProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string>();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    if (!photo) return;
    const imagePhoto = photo;

    const supabase = createBrowserSupabaseClient();

    async function loadImage() {
      const { data, error } = await supabase.storage
        .from(imagePhoto.storageBucket)
        .download(imagePhoto.storagePath);

      if (error || !data) {
        if (active) setLoadFailed(true);
        return;
      }

      objectUrl = URL.createObjectURL(data);
      if (active) {
        setLoadFailed(false);
        setImageUrl(objectUrl);
      }
    }

    void loadImage();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo]);

  if (!photo || loadFailed || !imageUrl) {
    return (
      <div aria-label="Photo du produit bientôt disponible" className={`${className ?? ""} flex items-center justify-center bg-amber-50 text-center text-sm text-stone-500`} role="img">
        Photo bientôt disponible
      </div>
    );
  }

  // Blob URLs from private Storage downloads cannot be optimized by next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} className={className} src={imageUrl} />;
}
