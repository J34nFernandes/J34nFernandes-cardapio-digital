"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";

import { type Product } from "@/types";
import { listenToProducts } from "@/services/product-service";
import { formatCurrency } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ListProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = listenToProducts((productsFromDb) => {
      setProducts(productsFromDb);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
                <Package className="h-8 w-8" />
                <h1 className="font-headline text-2xl font-bold tracking-tight">
                    Lista de Produtos
                </h1>
            </div>
            <Button asChild variant="secondary">
                <Link href="/admin">
                    Painel Administrativo
                </Link>
            </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Todos os Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : products.length > 0 ? (
                <div className="w-full overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Tamanho</TableHead>
                            <TableHead className="text-right">Preço</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                            <TableCell className="font-medium">
                                <Link href={`/products/${product.id}`} className="hover:underline">
                                  {product.name}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">{product.category}</Badge>
                            </TableCell>
                             <TableCell>
                                {product.size}{product.unit}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(product.price)}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed">
                <p className="text-muted-foreground">
                  Nenhum produto cadastrado ainda.{" "}
                  <Link href="/admin" className="text-primary underline">
                    Adicione um produto
                  </Link>
                  .
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
