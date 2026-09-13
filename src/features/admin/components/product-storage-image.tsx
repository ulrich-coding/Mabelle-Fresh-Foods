"use client";

import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ProductStorageImageProps = {
  alt: string;
  bucket: string;
  className?: string;
  path: string;
};

export function ProductStorageImage({
  alt,
  bucket,
  className,
  path,
}: ProductStorageImageProps) {
  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const supabase = createBrowserSupabaseClient();

    async function loadImage() {
      const { data, error } = await supabase.storage.from(bucket).download(path);

      if (!error && data && active) {
        objectUrl = URL.createObjectURL(data);
        setImageUrl(objectUrl);
      }
    }

    void loadImage();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bucket, path]);

  if (!imageUrl) {
    return <div aria-label="Chargement de l’image" className={className} role="status" />;
  }

  // Blob URLs returned by private Storage downloads cannot be optimized by next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} className={className} src={imageUrl} />;
}
