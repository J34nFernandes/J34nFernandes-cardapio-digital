"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Utensils, GlassWater, ShoppingCart, User, Loader2, Beer, CupSoda, Droplets, Package as PackageIcon, Search, LogOut, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Product } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { CartSheet } from "@/components/cart-sheet";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { signOutUser } from "@/services/auth-service";
import { listenToProducts } from "@/services/product-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";
import { Banner } from "@/components/banner";
import { DiscountPopup } from "@/components/discount-popup";
import { useAppSettings } from "@/hooks/use-app-settings";
import { Footer } from "@/components/footer";

const categoryIcons: Record<string, React.ElementType> = {
  "Bebidas": CupSoda,
  "Cervejas": Beer,
  "Água": Droplets,
  "Alimento": Utensils,
  "Outro": PackageIcon,
};


const getCategoryIcon = (category: string) => {
  const Icon = categoryIcons[category] || GlassWater; // GlassWater as fallback
  return <Icon className="h-6 w-6 text-foreground/80" />;
};


export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { addToCart } = useCart();
  const { user, loadingAuth } = useAuth();
  const { settings, isLoading: isLoadingSettings } = useAppSettings();
  const router = useRouter();


  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = listenToProducts((dbProducts) => {
      setProducts(dbProducts);
      setIsLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/login");
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setSearchTerm("");
  }

  const allCategories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = debouncedSearchTerm ? p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  const displayCategories = selectedCategory ? [selectedCategory] : allCategories.filter(category => filteredProducts.some(p => p.category === category));


  return (
    <div className="flex flex-col min-h-screen w-full font-body text-foreground">
      <DiscountPopup />
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
             {isLoadingSettings ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              ) : settings?.logoUrl ? (
                <Image src={settings.logoUrl} alt="Logo da empresa" width={32} height={32} className="h-8 w-8 object-contain" />
              ) : (
                <Utensils className="h-8 w-8 text-primary" />
             )}
            <h1 className="font-headline text-2xl font-bold tracking-tight">
              {settings?.companyInfo?.name || "Cardápio Digital"}
            </h1>
          </Link>
          <div className="flex items-center gap-2">
           <CartSheet />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-6 w-6" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {loadingAuth ? (
                   <DropdownMenuItem disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </DropdownMenuItem>
                ) : user ? (
                  <>
                    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => router.push('/my-orders')} className="cursor-pointer">
                      <PackageIcon className="mr-2 h-4 w-4" />
                      <span>Meus Pedidos</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login">Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register">Cadastre-se</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 md:px-6 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-12">
            <Banner />
             {products.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum produto cadastrado ainda.</p>
                <p className="text-sm text-muted-foreground mt-2">Vá para o <Link href="/admin" className="text-primary underline">painel administrativo</Link> para começar.</p>
              </div>
            ) : (
              <>
                <section className="space-y-6">
                  <h2 className="font-headline text-2xl font-bold tracking-tight">Pesquisar ou filtrar</h2>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     <Input 
                        placeholder="Buscar por nome do produto..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setSelectedCategory(null);
                        }}
                        className="pl-10 w-full md:w-1/2 lg:w-1/3"
                     />
                     {searchTerm && (
                       <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm("")}>
                         <X className="h-4 w-4" />
                       </Button>
                     )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => handleCategorySelect(null)}
                      variant={selectedCategory === null ? 'secondary' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-5 w-5" />
                      Ver Tudo
                    </Button>
                    {allCategories.map(category => (
                      <Button 
                        key={category} 
                        onClick={() => handleCategorySelect(category)}
                        variant={selectedCategory === category ? 'secondary' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {getCategoryIcon(category)}
                        {category}
                      </Button>
                    ))}
                  </div>
                </section>
                
                {displayCategories.length > 0 ? displayCategories.map(category => (
                  <section key={category}>
                    <h2 className="font-headline text-3xl font-bold tracking-tighter mb-6 flex items-center gap-3">
                      {getCategoryIcon(category)}
                      {category}
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredProducts.filter(p => p.category === category).map(product => (
                        <Card key={product.id} className="group relative flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                          <CardContent className="flex flex-1 flex-col p-0">
                            <Link href={`/products/${product.id}`} className="block">
                                <div className="overflow-hidden rounded-t-lg">
                                <Image
                                    src={product.imageUrl || `https://placehold.co/600x400.png`}
                                    alt={product.name}
                                    width={600}
                                    height={400}
                                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                </div>
                            </Link>
                            <div className="flex flex-1 flex-col p-4">
                                <h3 className="font-headline text-lg font-semibold">
                                <Link href={`/products/${product.id}`} className="hover:text-primary">
                                    {product.name}
                                </Link>
                                </h3>
                                <p className="text-sm text-muted-foreground">{product.size}{product.unit}</p>
                                <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(product.price)}</p>
                                <div className="mt-auto pt-4">
                                <Button className="w-full" onClick={() => addToCart(product)} variant="default">
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Adicionar
                                </Button>
                                </div>
                            </div>
                           </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )) : (
                   <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhum produto encontrado com os filtros aplicados.</p>
                        { (selectedCategory || debouncedSearchTerm) && (
                            <Button onClick={() => {
                              setSelectedCategory(null);
                              setSearchTerm("");
                            }} variant="link" className="mt-2">Limpar filtros</Button>
                        )}
                    </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
