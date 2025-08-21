
"use client";

import { useState, useEffect, useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, Minus, Plus, Loader2, Star } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { useCart } from "../../../hooks/use-cart";
import { formatCurrency, cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { getProductById } from "../../../services/product-service";
import { type Product, type Review } from "../../../types";
import { Skeleton } from "../../../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "../../../components/ui/separator";

function ProductReviews({ product }: { product: Product }) {
    const averageRating = useMemo(() => {
        if (!product.reviews || product.reviews.length === 0) return 0;
        const total = product.reviews.reduce((acc, review) => acc + review.rating, 0);
        return total / product.reviews.length;
    }, [product.reviews]);

    const sortedReviews = useMemo(() => {
        if (!product.reviews) return [];
        // Create a sortable copy
        return [...product.reviews].sort((a,b) => {
            // Ensure we have valid Date objects before comparing
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return dateB - dateA;
        });
    }, [product.reviews]);


    if (!sortedReviews || sortedReviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Este produto ainda não possui avaliações.</p>
                <p className="text-sm">Seja o primeiro a avaliar!</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center gap-2">
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                <div className="flex items-center">
                     {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-6 w-6", i < averageRating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')}/>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground">({sortedReviews.length} {sortedReviews.length === 1 ? 'avaliação' : 'avaliações'})</p>
            </div>
            
            <Separator className="my-12" />

            <div className="space-y-6">
                {sortedReviews.map(review => (
                    <div key={review.userId + (review.createdAt as any)?.toString()} className="flex gap-4">
                        <Avatar>
                            <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                 <p className="font-semibold">{review.userName}</p>
                                 <span className="text-xs text-muted-foreground">
                                    {review.createdAt instanceof Date ? formatDate(review.createdAt, 'dd/MM/yyyy', {locale: ptBR}) : ''}
                                 </span>
                            </div>
                             <div className="flex items-center gap-0.5 my-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4", i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')}/>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { id } = params;
  
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const dbProduct = await getProductById(id);
      if (!dbProduct) {
        notFound();
      }
      setProduct(dbProduct);
      setIsLoading(false);
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);


  if (isLoading) {
    return (
       <div className="flex min-h-screen w-full flex-col bg-background">
         <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur-md md:px-6">
            <Skeleton className="h-6 w-48" />
         </header>
         <main className="flex-1">
           <div className="container mx-auto max-w-5xl py-8 px-4 md:px-6">
             <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
               <div className="flex items-center justify-center">
                 <Skeleton className="aspect-square w-full max-w-md rounded-lg" />
               </div>
               <div className="flex flex-col justify-center space-y-6">
                 <Skeleton className="h-6 w-24 rounded-full" />
                 <Skeleton className="h-12 w-3/4" />
                 <Skeleton className="h-6 w-1/4" />
                 <Skeleton className="h-10 w-1/3" />
                 <Skeleton className="h-20 w-full" />
                 <div className="flex items-center gap-4">
                   <Skeleton className="h-12 w-32" />
                   <Skeleton className="h-12 flex-1" />
                 </div>
               </div>
             </div>
           </div>
         </main>
       </div>
    );
  }

  if (!product) {
    // This will be handled by notFound() in useEffect, but as a fallback
    return <div className="flex justify-center items-center min-h-screen">Produto não encontrado.</div>;
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: "Produto adicionado!",
      description: `${quantity}x "${product.name}" foram adicionados ao carrinho.`,
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur-md md:px-6">
        <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
            <ChevronLeft className="h-5 w-5" />
            <span>Voltar para o Cardápio</span>
        </Link>
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl py-8 px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="flex items-center justify-center">
                    <Image
                        src={product.imageUrl || "https://placehold.co/500x500.png"}
                        alt={product.name}
                        width={500}
                        height={500}
                        className="aspect-square w-full max-w-md rounded-lg object-cover shadow-lg"
                        data-ai-hint="product image"
                    />
                </div>
                <div className="flex flex-col justify-center space-y-6">
                    <div>
                        <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                        <h1 className="font-headline text-4xl font-bold tracking-tighter lg:text-5xl">{product.name}</h1>
                        <p className="text-lg text-muted-foreground mt-2">{product.size}{product.unit}</p>
                    </div>
                    <p className="text-4xl font-bold text-primary">
                        {formatCurrency(product.price)}
                    </p>
                    <p className="text-lg text-muted-foreground whitespace-pre-wrap">
                        {product.description || 'Descrição detalhada do produto não disponível.'}
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 rounded-full border p-1">
                             <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                                <Minus className="h-5 w-5" />
                             </Button>
                             <span className="w-10 text-center text-lg font-bold">{quantity}</span>
                             <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity(q => q + 1)}>
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <Button size="lg" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleAddToCart}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Adicionar ao carrinho
                        </Button>
                    </div>
                </div>
            </div>

            <Separator className="my-12" />

             <div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter mb-6">Avaliações dos Clientes</h2>
                <ProductReviews product={product} />
            </div>

        </div>
      </main>
    </div>
  );
}

    
