"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, FilePenLine } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Product } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

type ProductTableProps = {
  products: Product[];
  onDelete: (id: string) => void;
};

export function ProductTable({ products, onDelete }: ProductTableProps) {
  const { toast } = useToast();
  
  const handleDelete = (product: Product) => {
    onDelete(product.id);
    toast({
      title: "Produto Removido",
      description: `"${product.name}" foi removido da lista.`,
      variant: "destructive",
    });
  }

  if (products.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed bg-muted/50">
        <p className="text-muted-foreground">Nenhum produto cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Imagem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
               <TableCell>
                 <Image
                    src={product.imageUrl || "https://placehold.co/64x64.png"}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="h-10 w-10 rounded-md object-cover"
                    data-ai-hint="product image"
                  />
               </TableCell>
              <TableCell className="font-medium">
                <Link href={`/products/${product.id}`} className="hover:underline">
                  {product.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{product.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={product.stock > 10 ? "outline" : "destructive"}>{product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(product.price)}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Link href={`/admin/edit-product/${product.id}`}>
                          <FilePenLine className="h-4 w-4" />
                          <span className="sr-only">Editar produto</span>
                      </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover produto</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso irá remover permanentemente o produto
                          <span className="font-semibold"> {product.name}</span>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(product)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
