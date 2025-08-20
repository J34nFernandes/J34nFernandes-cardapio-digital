"use client";

import Image from "next/image";
import { ShoppingCart, Trash2, X, Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { CheckoutDialog } from "./checkout-dialog";

export function CartSheet() {
  const { cartItems, cartCount, cartTotal, removeFromCart, updateQuantity } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {cartCount}
            </span>
          )}
          <span className="sr-only">Abrir carrinho</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Carrinho ({cartCount})</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartCount > 0 ? (
          <>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-6 p-6 pr-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-md">
                      <Image
                        src={item.imageUrl || "https://placehold.co/100x100.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        data-ai-hint="product image"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                      <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between self-stretch">
                         <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                            >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover item</span>
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="bg-background p-6">
                <div className="flex w-full flex-col gap-4">
                     <div className="flex w-full items-center justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <CheckoutDialog />
                </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
             <ShoppingCart className="h-20 w-20 text-muted-foreground/50" strokeWidth={1} />
            <h3 className="text-xl font-semibold">Seu carrinho está vazio</h3>
            <p className="text-muted-foreground">
              Adicione produtos para vê-los aqui.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
