"use client";
import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div>
      <div className="surface relative aspect-square overflow-hidden">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt ?? name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain p-4"
            unoptimized={current.url.startsWith("/api/")}
          />
        ) : (
          <div className="grid h-full place-items-center">
            <Package className="text-ink-500 size-20" aria-hidden />
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "surface relative aspect-square cursor-pointer overflow-hidden",
                i === active && "border-brand-cyan/60",
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                unoptimized={img.url.startsWith("/api/")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
