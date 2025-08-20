"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { type Product } from "../types";
import { listenToSettings } from "../services/settings-service";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  price: z.coerce
    .number()
    .positive({ message: "O preço deve ser um número positivo." }),
  category: z.string().min(1, { message: "Por favor, selecione uma categoria." }),
  size: z.coerce
    .number()
    .positive({ message: "O tamanho deve ser um número positivo." }),
  unit: z.string().min(1, { message: "A unidade é obrigatória." }),
  stock: z.coerce
    .number()
    .min(0, { message: "O estoque não pode ser negativo." }),
  description: z.string().optional(),
  imageFile: z
    .instanceof(File, { message: "Por favor, selecione uma imagem." })
    .optional(),
  imageUrl: z.string().optional(), // Keep track of existing image
});

export type ProductFormValues = z.infer<typeof formSchema>;

type ProductFormProps = {
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  product?: Product | null;
};

export function ProductForm({ onSubmit, isSubmitting, product }: ProductFormProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      category: "",
      size: 0,
      unit: "",
      stock: 0,
      description: "",
      imageFile: undefined,
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        price: product.price || 0,
        category: product.category || "",
        size: product.size || 0,
        unit: product.unit || "",
        stock: product.stock || 0,
        description: product.description || "",
        imageUrl: product.imageUrl || "",
      });
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    } else {
         form.reset({
            name: "",
            price: 0,
            category: "",
            size: 0,
            unit: "",
            stock: 0,
            description: "",
            imageFile: undefined,
            imageUrl: "",
        });
    }
  }, [product, form]);


  const imageFile = form.watch("imageFile");

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else if (product?.imageUrl) {
        setImagePreview(product.imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [imageFile, product]);

  useEffect(() => {
    setIsLoadingSettings(true);
    const unsubscribe = listenToSettings((settings) => {
      setCategories(settings.categories || []);
      setUnits(settings.units || []);
      setIsLoadingSettings(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFormSubmit = (values: ProductFormValues) => {
    onSubmit(values);
    if (!product) { // only reset form if it's for adding new product
        form.reset();
        setImagePreview(null);
    }
  };

  const removeImage = () => {
    form.setValue("imageFile", undefined);
    form.setValue("imageUrl", ""); // Also clear existing imageUrl
    setImagePreview(null);
  }

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cerveja Artesanal IPA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="19,90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade em Estoque</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="350" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="ml" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição do Produto</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Descreva o produto, ingredientes, sugestões de consumo, etc."
                            className="resize-y min-h-[100px]"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
          </div>

          <div className="md:col-span-4">
             <FormField
              control={form.control}
              name="imageFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Imagem do Produto</FormLabel>
                  <FormControl>
                    <div className="w-full">
                       <label htmlFor="image-upload" className="group cursor-pointer flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <Image src={imagePreview} alt="Prévia da imagem" layout="fill" objectFit="contain" className="rounded-lg" />
                             <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={(e) => { e.preventDefault(); removeImage(); }}>
                                <X className="h-4 w-4" />
                             </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground group-hover:text-primary" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 800x400px)</p>
                          </div>
                        )}
                         <Input 
                            id="image-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/gif"
                            onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} 
                            {...rest}
                         />
                       </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            {isSubmitting ? (product ? "Salvando..." : "Adicionando...") : (product ? "Salvar Alterações" : "Adicionar Produto")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
