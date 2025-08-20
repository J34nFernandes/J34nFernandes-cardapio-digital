"use client";

import Link from "next/link";
import { Package, ListOrdered, Settings, TicketPercent, Users, PanelLeft, Truck, BarChart2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6 text-primary" />
            <span className="">Product Co</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-2 p-4">
           <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <BarChart2 className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Package className="h-4 w-4" />
            Produtos
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <ListOrdered className="h-4 w-4" />
            Pedidos
          </Link>
           <Link
            href="/admin/coupons"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <TicketPercent className="h-4 w-4" />
            Cupons
          </Link>
           <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Users className="h-4 w-4" />
            Usuários
          </Link>
           <Link
            href="/admin/delivery-analysis"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Truck className="h-4 w-4" />
            Análise de Entregas
          </Link>
           <Link
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <Package className="h-5 w-5 transition-all group-hover:scale-110" />
                </Link>
                 <Link
                  href="/admin"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <BarChart2 className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/products"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Package className="h-5 w-5" />
                  Produtos
                </Link>
                <Link
                  href="/admin/orders"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ListOrdered className="h-5 w-5" />
                  Pedidos
                </Link>
                 <Link
                  href="/admin/coupons"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <TicketPercent className="h-5 w-5" />
                  Cupons
                </Link>
                 <Link
                  href="/admin/users"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  Usuários
                </Link>
                <Link
                  href="/admin/delivery-analysis"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Truck className="h-5 w-5" />
                  Análise de Entregas
                </Link>
                 <Link
                  href="/admin/settings"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-5 w-5" />
                  Configurações
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="font-headline text-2xl font-bold tracking-tight">Painel Administrativo</h1>
          <div className="ml-auto">
            {/* ThemeToggle was here */}
          </div>
        </header>
        <main className="p-4 sm:px-6 sm:py-0 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
