
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

import { type Product } from "../../../types";
import { ProductForm, type ProductFormValues } from "../../../components/product-form";
import { ProductTable } from "../../../components/product-table";
import { ProductChart } from "../../../components/product-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import {
  listenToProducts,
  addProduct,
  deleteProduct,
} from "../../../services/product-service";
import { uploadProductImage } from "../../../services/storage-service";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = listenToProducts((productsFromDb) => {
      setProducts(productsFromDb);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (values.imageFile) {
        const uploadedUrl = await uploadProductImage(values.imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          throw new Error("Falha no upload da imagem.");
        }
      }

      const newProduct: Omit<Product, "id"> = {
        name: values.name,
        price: values.price,
        category: values.category,
        size: values.size,
        unit: values.unit,
        stock: values.stock,
        imageUrl: imageUrl,
        description: values.description,
      };

      await addProduct(newProduct);
      
      toast({
        title: "Produto Adicionado!",
        description: `"${values.name}" foi adicionado à lista.`,
      });

    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível adicionar o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
  };

  if (isLoading && products.length === 0) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
        <Card>
            <CardHeader>
            <CardTitle className="font-headline text-xl">
                Adicionar Novo Produto
            </CardTitle>
            <CardDescription>
                Preencha os dados abaixo para adicionar um novo item ao cardápio.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <ProductForm
                onSubmit={handleAddProduct}
                isSubmitting={isSubmitting}
            />
            </CardContent>
        </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline text-xl">
                    Produtos por Categoria
                </CardTitle>
                </CardHeader>
                <CardContent>
                <ProductChart products={products} />
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-5">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline text-xl">
                    Produtos Cadastrados
                </CardTitle>
                </CardHeader>
                <CardContent>
                <ProductTable
                    products={products}
                    onDelete={handleDeleteProduct}
                />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
