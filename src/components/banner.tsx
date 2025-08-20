"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { listenToSettings, type BannerSettings } from "@/services/settings-service";
import { Skeleton } from "./ui/skeleton";

export function Banner() {
  const [banner, setBanner] = useState<BannerSettings | undefined | null>(undefined); // undefined: loading, null: no data

  useEffect(() => {
    const unsubscribe = listenToSettings((settings) => {
      setBanner(settings.banner || null);
    });
    return () => unsubscribe();
  }, []);

  if (banner === undefined) {
    return (
      <Skeleton className="relative w-full h-64 md:h-80 rounded-lg my-8" />
    );
  }

  if (banner === null) {
     return (
        <section className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden my-8 bg-muted flex items-center justify-center">
             <div className="text-center text-muted-foreground p-4">
                <h2 className="font-headline text-2xl font-bold">Banner não configurado</h2>
                <p>Vá para o painel de configurações para adicionar um banner.</p>
            </div>
        </section>
     )
  }

  return (
    <section className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden my-8">
      <Image
        src={banner.imageUrl || "https://placehold.co/1200x400.png"}
        alt={banner.headline || "Banner promocional"}
        layout="fill"
        objectFit="cover"
        className="brightness-50"
        data-ai-hint="promotional banner"
        priority
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
        <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">{banner.headline}</h2>
        <p className="mt-2 text-lg md:text-xl max-w-2xl">{banner.description}</p>
      </div>
    </section>
  );
}
