"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, PanelLeft, Truck, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/use-app-settings";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import React, { useState } from "react";


const NavLink = ({ href, icon: Icon, label, isExpanded }: { href: string, icon: React.ElementType, label: string, isExpanded: boolean }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-4 px-4 py-2.5 rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                !isExpanded && "justify-center"
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={cn("truncate transition-opacity", !isExpanded && "sr-only opacity-0")}>{label}</span>
        </Link>
    )
}

const MobileNavLink = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => {
     const pathname = usePathname();
    const isActive = pathname.startsWith(href);
    return (
         <Link
            href={href}
            className={cn(
                "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                isActive && "text-foreground font-semibold"
            )}
            >
            <Icon className="h-5 w-5" />
            {label}
        </Link>
    )
}


export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, isLoading } = useAppSettings();
  const [isExpanded, setIsExpanded] = useState(true);


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background transition-all duration-300 ease-in-out sm:flex",
            isExpanded ? "w-60" : "w-20"
        )}>
             <div className="flex h-16 items-center border-b px-6">
                 <Link
                    href="/"
                    className="group flex items-center gap-3 font-semibold"
                    >
                     {isLoading ? (
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    ) : settings?.logoUrl ? (
                        <Image src={settings.logoUrl} alt="Logo da Empresa" width={32} height={32} className="h-8 w-8 object-contain transition-all group-hover:scale-110" />
                    ) : (
                        <Package className="h-8 w-8 text-primary transition-all group-hover:scale-110" />
                    )}
                    <span className={cn("font-headline text-lg tracking-tight transition-opacity", !isExpanded && "sr-only opacity-0")}>
                        {settings?.companyInfo?.name || "Painel"}
                    </span>
                </Link>
            </div>
            <nav className="flex-1 p-4">
                 <NavLink href="/delivery/dashboard" icon={Truck} label="Entregas" isExpanded={isExpanded} />
            </nav>
             <div className="mt-auto border-t p-4">
                 <Button onClick={() => setIsExpanded(!isExpanded)} variant="ghost" className="w-full justify-center">
                    {isExpanded ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
                    <span className="sr-only">{isExpanded ? "Recolher menu" : "Expandir menu"}</span>
                </Button>
            </div>
        </aside>
      <div className={cn("flex flex-col transition-all duration-300 ease-in-out", isExpanded ? "sm:pl-60" : "sm:pl-20")}>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Abrir Menu</span>
                    </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs">
                    <nav className="grid gap-6 text-lg font-medium">
                         <Link
                            href="/"
                            className="group flex h-16 items-center gap-3 border-b px-6 font-semibold"
                            >
                            {isLoading ? (
                                <div className="h-8 w-8 animate-pulse rounded-full bg-primary/80" />
                            ) : settings?.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Logo da Empresa" width={32} height={32} className="h-8 w-8 object-contain transition-all group-hover:scale-110" />
                            ) : (
                                <Package className="h-8 w-8 text-primary transition-all group-hover:scale-110" />
                            )}
                             <span className="font-headline text-lg tracking-tight">
                                {settings?.companyInfo?.name || "Painel"}
                            </span>
                        </Link>
                        <MobileNavLink href="/delivery/dashboard" icon={Truck} label="Entregas" />
                    </nav>
                    </SheetContent>
                </Sheet>
                 <div className="flex-1">
                    <h1 className="font-headline text-2xl font-bold tracking-tight">
                        Painel do Entregador
                    </h1>
                 </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-8 md:gap-8">
                {children}
            </main>
      </div>
    </div>
  );
}
