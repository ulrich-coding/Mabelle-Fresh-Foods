"use client";

import { ChangeEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  createProductPhotoAction,
  deleteProductPhotoAction,
} from "../server/catalog-actions";
import type { AdminProductPhoto } from "../types/catalog";
import { ProductStorageImage } from "./product-storage-image";

const maximumFileSize = 5 * 1024 * 1024;
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getSafeStorageErrorDetails(error: {
  message: string;
  name: string;
  statusCode?: string;
}) {
  return {
    message: error.message,
    name: error.name,
    statusCode: error.statusCode ?? null,
  };
}

type ProductPhotoManagerProps = {
  photos: AdminProductPhoto[];
  productId: string;
};

export function ProductPhotoManager({ photos, productId }: ProductPhotoManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string>();

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const extension = extensionByMimeType[file.type];
    if (!extension) {
      setMessage("Choisissez une image JPEG, PNG ou WebP.");
      return;
    }

    if (file.size > maximumFileSize) {
      setMessage("L’image dépasse la taille maximale de 5 MiB.");
      return;
    }

    setMessage(undefined);
    setIsUploading(true);
    const storagePath = `${productId}/${crypto.randomUUID()}.${extension}`;
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.info("[Product image upload] session check", {
      errorName: sessionError?.name ?? null,
      sessionPresent: Boolean(session),
      userPresent: Boolean(session?.user),
    });

    if (sessionError || !session?.user) {
      setMessage("Votre session administrateur est introuvable. Reconnectez-vous puis réessayez.");
      setIsUploading(false);
      return;
    }

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      const details = getSafeStorageErrorDetails(uploadError);
      console.error("[Product image upload] Storage error", details);
      setMessage(`Impossible d’envoyer l’image : ${details.message}`);
      setIsUploading(false);
      return;
    }

    const result = await createProductPhotoAction({
      productId,
      storagePath,
      altText: file.name.replace(/\.[^.]+$/, ""),
    });

    if (!result.success) {
      const { error: cleanupError } = await supabase.storage
        .from("product-images")
        .remove([storagePath]);
      setMessage(
        cleanupError
          ? "La référence de la photo a échoué et le fichier doit être nettoyé manuellement."
          : result.message,
      );
      setIsUploading(false);
      return;
    }

    setMessage("Photo ajoutée.");
    setIsUploading(false);
    router.refresh();
  }

  function deletePhoto(photoId: string) {
    if (!window.confirm("Supprimer définitivement cette photo ?")) return;

    setMessage(undefined);
    startTransition(async () => {
      const result = await deleteProductPhotoAction(photoId);
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Photos</h2>
          <p className="mt-1 text-sm text-stone-600">JPEG, PNG ou WebP, 5 MiB maximum.</p>
        </div>
        <label className="cursor-pointer rounded-md bg-stone-900 px-4 py-2 text-center text-sm font-medium text-white disabled:opacity-60">
          {isUploading ? "Envoi…" : "Ajouter une photo"}
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={isUploading || isPending}
            onChange={uploadPhoto}
            type="file"
          />
        </label>
      </div>

      {message ? <p className="mt-4 text-sm text-stone-700">{message}</p> : null}

      {photos.length === 0 ? (
        <p className="mt-5 rounded-md border border-dashed border-stone-300 p-4 text-sm text-stone-600">
          Aucune photo pour ce produit.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos
            .slice()
            .sort((first, second) => first.position - second.position)
            .map((photo) => (
              <article className="overflow-hidden rounded-lg border border-stone-200" key={photo.id}>
                <ProductStorageImage
                  alt={photo.alt_text ?? "Photo du produit"}
                  bucket={photo.storage_bucket}
                  className="aspect-square w-full bg-stone-100 object-cover"
                  path={photo.storage_path}
                />
                <div className="flex items-center justify-between gap-3 p-3">
                  <p className="text-xs text-stone-600">
                    {photo.is_primary ? "Photo principale" : `Position ${photo.position + 1}`}
                  </p>
                  <button
                    className="text-sm font-medium text-red-700 disabled:opacity-60"
                    disabled={isPending || isUploading}
                    onClick={() => deletePhoto(photo.id)}
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
