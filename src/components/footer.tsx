"use client";

import { useAppSettings } from "@/hooks/use-app-settings";
import { Utensils, Building, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
    const { settings, isLoading } = useAppSettings();

    if (isLoading) return null;

    return (
        <footer className="w-full bg-muted text-muted-foreground border-t">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left py-8">
                    {/* Coluna 1: Logo e Nome */}
                    <div className="flex flex-col items-center md:items-start">
                         <div className="flex items-center gap-3 mb-2">
                            {settings?.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Logo da Empresa" width={32} height={32} className="h-8 w-8 object-contain" />
                            ) : (
                                <Utensils className="h-8 w-8 text-primary" />
                            )}
                            <h2 className="font-headline text-2xl font-semibold text-foreground">
                                {settings?.companyInfo?.name || "Cardápio Digital"}
                            </h2>
                        </div>
                         <p className="text-sm max-w-xs">
                            Sua melhor opção para pedir online. Rápido, fácil e delicioso.
                        </p>
                    </div>

                    {/* Coluna 2: Informações de Contato */}
                    <div className="space-y-2 text-sm">
                        <h3 className="font-semibold text-foreground mb-3 uppercase tracking-wider">Contato</h3>
                        <p>{settings?.companyInfo?.address || "Rua Fictícia, 123 - Cidade, Estado"}</p>
                        <p>{settings?.companyInfo?.phone || "(00) 12345-6789"}</p>
                        <p>{settings?.companyInfo?.email || "contato@empresa.com"}</p>
                    </div>
                    
                    {/* Coluna 3: Links de Acesso */}
                    <div className="space-y-2 text-sm">
                        <h3 className="font-semibold text-foreground mb-3 uppercase tracking-wider">Acesso Rápido</h3>
                        <div className="flex flex-col items-center md:items-start space-y-2">
                            <Link href="/login/admin" className="flex items-center gap-2 hover:text-primary transition-colors">
                                <Building className="h-4 w-4" />
                                <span>Painel Administrativo</span>
                            </Link>
                             <Link href="/delivery/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors">
                                <Truck className="h-4 w-4" />
                                <span>Painel do Entregador</span>
                            </Link>
                        </div>
                    </div>
                </div>
                 <div className="border-t py-4 text-center text-xs">
                    <p>&copy; {new Date().getFullYear()} {settings?.companyInfo?.name || "Cardápio Digital"}. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    )
}
