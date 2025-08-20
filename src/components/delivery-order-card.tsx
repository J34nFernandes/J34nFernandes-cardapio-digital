"use client";

import { Map, User, Home, CreditCard, Truck, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { type Order } from "../types";
import { formatCurrency } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
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
} from "./ui/alert-dialog";
import { useState } from "react";


export function DeliveryOrderCard({ order, onCompleteOrder }: { order: Order; onCompleteOrder: (orderId: string) => Promise<void> }) {
    const [isCompleting, setIsCompleting] = useState(false);
    
    const whatsappUrl = `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, sou o entregador do seu pedido #${order.id.slice(0,5).toUpperCase()}. Estou a caminho!`)}`;
    const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`;

    const handleConfirm = async () => {
      setIsCompleting(true);
      await onCompleteOrder(order.id);
      // No need to set isCompleting to false, as the component will disappear from the list
    }
    
    return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Pedido #{order.id.slice(0, 5).toUpperCase()}</CardTitle>
            <CardDescription>
              {format(order.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            <Truck className="mr-1.5 h-4 w-4" />
            Para Entrega
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2"><User size={16} /> Cliente</h4>
          <p className="text-sm text-muted-foreground">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2"><Home size={16} /> Endereço de Entrega</h4>
          <p className="text-sm text-muted-foreground">{order.address}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-semibold">Itens</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {order.items.map(item => (
              <li key={item.id}>
                {item.quantity}x {item.name}
              </li>
            ))}
          </ul>
        </div>
        
        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold flex items-center gap-2"><CreditCard size={16} /> Pagamento</span>
            <span className="text-sm text-muted-foreground">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {order.observations && order.observations !== "Nenhuma" && (
            <>
            <Separator />
            <div className="space-y-2">
                <h4 className="font-semibold">Observações</h4>
                <p className="text-sm text-muted-foreground fst-italic">"{order.observations}"</p>
            </div>
            </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button className="w-full" disabled={isCompleting} variant="accent">
                {isCompleting ? <Loader2 className="animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                Confirmar Entrega
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Entrega?</AlertDialogTitle>
              <AlertDialogDescription>
                Ao confirmar, o pedido #{order.id.slice(0, 5).toUpperCase()} será marcado como "Concluído" e removido da sua lista de pendências.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button asChild className="w-full">
            <a href={googleMapsDirectionsUrl} target="_blank" rel="noopener noreferrer">
                 <Map className="mr-2 h-5 w-5" />
                 Ver Rota no Mapa
            </a>
        </Button>
        <Button asChild variant="outline" className="w-full">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-5 w-5" />
                Chamar no WhatsApp
            </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
