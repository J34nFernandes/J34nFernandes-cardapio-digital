"use client";

import { useState, useEffect, useMemo } from "react";
import { ListOrdered, Loader2, User, Home, CreditCard, BotMessageSquare, PackageCheck, Package, PackageSearch, Truck, CheckCircle, XCircle, Trash2, DollarSign, ShoppingBag, Clock, Phone, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dynamic from 'next/dynamic';


import { type Order, OrderStatus } from "@/types";
import { listenToOrders, updateOrderStatus, deleteOrder } from "@/services/order-service";
import { formatCurrency } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });


const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
        case "Pendente":
            return "default";
        case "Em Preparo":
            return "secondary";
        case "Saiu para Entrega":
            return "outline";
        case "Concluído":
            return "default"; 
        case "Cancelado":
            return "destructive";
        default:
            return "secondary";
    }
};

const statusConfig: Record<OrderStatus, { icon: React.ElementType, title: string, color: string, notify?: boolean, notificationMessage?: string }> = {
    "Pendente": { icon: Package, title: "Pendentes", color: "#f97316" }, // orange-500
    "Em Preparo": { icon: PackageSearch, title: "Em Preparo", color: "#3b82f6", notify: true, notificationMessage: "Seu pedido #[ORDER_ID] já está em preparo! 🍳 Logo ele estará a caminho." }, // blue-500
    "Saiu para Entrega": { icon: Truck, title: "Em Transporte", color: "#8b5cf6", notify: true, notificationMessage: "Boas notícias! Seu pedido #[ORDER_ID] saiu para entrega e chegará em breve! 🛵" }, // violet-500
    "Concluído": { icon: CheckCircle, title: "Concluídos", color: "#22c55e" }, // green-500
    "Cancelado": { icon: XCircle, title: "Cancelados", color: "#ef4444" }, // red-500
}

const orderStatuses: OrderStatus[] = ["Pendente", "Em Preparo", "Saiu para Entrega", "Concluído", "Cancelado"];


function DashboardStats({ orders }: { orders: Order[] }) {
    const stats = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'Concluído');
        const pendingOrders = orders.filter(o => o.status === 'Pendente');

        const totalRevenue = completedOrders.reduce((acc, order) => acc + order.total, 0);
        const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
        
        return {
            totalRevenue,
            completedOrdersCount: completedOrders.length,
            pendingOrdersCount: pendingOrders.length,
            averageTicket
        }
    }, [orders]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">Soma de todos os pedidos concluídos</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Concluídos</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.completedOrdersCount}</div>
                    <p className="text-xs text-muted-foreground">Total de pedidos entregues</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.pendingOrdersCount}</div>
                    <p className="text-xs text-muted-foreground">Pedidos aguardando preparo</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
                    <p className="text-xs text-muted-foreground">Valor médio por pedido concluído</p>
                </CardContent>
            </Card>
        </div>
    );
}


function OrderStatusChart({ orders }: { orders: Order[] }) {
    const chartData = useMemo(() => {
        return orderStatuses.map(status => ({
            name: status,
            value: orders.filter(o => o.status === status).length,
            color: statusConfig[status].color,
        })).filter(item => item.value > 0);
    }, [orders]);
    
    if(chartData.length === 0) return null;
    
    const series = chartData.map(d => d.value);
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'pie',
        },
        labels: chartData.map(d => d.name),
        colors: chartData.map(d => d.color),
        legend: {
            position: 'bottom'
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} pedidos`
            }
        },
        dataLabels: {
            formatter(val, opts) {
                const name = opts.w.globals.labels[opts.seriesIndex]
                return `${name}: ${val.toFixed(1)}%`
            },
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Distribuição de Pedidos</CardTitle>
                <CardDescription>Visão geral do status de todos os pedidos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full h-[300px]">
                    <Chart options={options} series={series} type="pie" height="100%" width="100%" />
                </div>
            </CardContent>
        </Card>
    )
}

function OrderCard({ 
    order, 
    onStatusChange,
    onDeleteOrder, 
}: { 
    order: Order; 
    onStatusChange: (orderId: string, status: OrderStatus) => void;
    onDeleteOrder: (orderId: string) => void; 
}) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <CardTitle className="text-lg">Pedido #{order.id.slice(0, 5).toUpperCase()}</CardTitle>
                        <CardDescription>
                            {format(order.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(order.status) as any} className="text-sm whitespace-nowrap">{order.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold flex items-center gap-2"><User size={16} /> Cliente</h4>
                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                            <h4 className="font-semibold flex items-center gap-2 justify-end"><Phone size={16} /> Telefone</h4>
                            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold flex items-center gap-2"><Home size={16} /> Endereço de Entrega</h4>
                        <p className="text-sm text-muted-foreground">{order.address}</p>
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-2">
                    <h4 className="font-semibold">Itens do Pedido</h4>
                    <ul className="space-y-1">
                        {order.items.map(item => (
                            <li key={item.id} className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{item.quantity}x {item.name} <span className="text-xs">({formatCurrency(item.price)})</span></span>
                                <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(order.total + (order.coupon?.discount ?? 0))}</span>
                    </div>
                     {order.coupon && (
                         <div className="flex justify-between items-center text-sm text-green-600">
                             <span className="text-muted-foreground">Desconto ({order.coupon.code})</span>
                             <span className="font-semibold">-{formatCurrency(order.coupon.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(order.total)}</span>
                    </div>
                      <div className="flex justify-between items-center pt-2 text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><CreditCard size={14}/> Pagamento</span>
                        <span className="font-semibold">{order.paymentMethod}</span>
                    </div>
                </div>
                {order.observations && order.observations !== "Nenhuma" && (
                     <>
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><BotMessageSquare size={16}/> Observações</h4>
                            <p className="text-sm text-muted-foreground italic">"{order.observations}"</p>
                        </div>
                     </>
                )}
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
                 <div className="w-full space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm"><PackageCheck size={14} /> Mover para...</h4>
                    <Select onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)} defaultValue={order.status}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            {orderStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                     {order.status !== "Concluído" && order.status !== 'Cancelado' && (
                        <Button className="w-full" onClick={() => onStatusChange(order.id, "Concluído")}>
                            <CheckCircle size={16}/> Finalizar
                        </Button>
                    )}
                     {order.status !== "Cancelado" && order.status !== 'Concluído' && (
                        <Button className="w-full" variant="secondary" onClick={() => onStatusChange(order.id, "Cancelado")}>
                            <XCircle size={16}/> Cancelar
                        </Button>
                    )}
                    {(order.status === "Concluído" || order.status === "Cancelado") && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full" variant="destructive">
                                    <Trash2 size={16}/> Excluir
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Pedido?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação é permanente e não pode ser desfeita. O pedido #{order.id.slice(0, 5).toUpperCase()} será removido do sistema.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteOrder(order.id)} className="bg-destructive hover:bg-destructive/90">Confirmar Exclusão</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

function OrderList({ orders, onStatusChange, onDeleteOrder }: { orders: Order[], onStatusChange: (orderId: string, status: OrderStatus) => void, onDeleteOrder: (orderId: string) => void }) {
    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 h-64">
                <p className="text-muted-foreground">Nenhum pedido nesta categoria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
                <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} onDeleteOrder={onDeleteOrder} />
            ))}
        </div>
    );
}

export default function ListOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = listenToOrders((ordersFromDb) => {
      setOrders(ordersFromDb);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const ordersByStatus = (status: OrderStatus) => orders.filter(o => o.status === status);
  
  const handleStatusChangeAndNotify = async (orderId: string, newStatus: OrderStatus) => {
        const updatedOrder = await updateOrderStatus(orderId, newStatus);
        
        if(updatedOrder) {
            toast({ title: "Status Atualizado!", description: `O pedido foi movido para "${newStatus}".` });

            // Check if this status change should trigger a notification
            const statusInfo = statusConfig[newStatus];
            if (statusInfo.notify && statusInfo.notificationMessage && updatedOrder.customerPhone) {
                const messageTemplate = statusInfo.notificationMessage;
                const message = `Olá, ${updatedOrder.customerName}! ${messageTemplate}`.replace('#[ORDER_ID]', orderId.slice(0,5).toUpperCase());

                const whatsappUrl = `https://wa.me/${updatedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, "_blank");
                
                toast({
                    title: "Notificação Pronta!",
                    description: `A mensagem para ${updatedOrder.customerName} está pronta para ser enviada no WhatsApp.`,
                    icon: <MessageCircle className="h-5 w-5 text-green-500" />
                });
            }
        } else {
            toast({ title: "Erro!", description: "Não foi possível atualizar o status do pedido.", variant: "destructive" });
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        const success = await deleteOrder(orderId);
         if(success) {
            toast({ title: "Pedido Excluído!", description: "O pedido foi removido permanentemente.", variant: "destructive" });
        } else {
            toast({ title: "Erro!", description: "Não foi possível excluir o pedido.", variant: "destructive" });
        }
    }


  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <ListOrdered className="h-6 w-6" />
                <CardTitle className="font-headline text-xl">
                    Acompanhamento de Pedidos
                </CardTitle>
            </div>
            <CardDescription>
                Gerencie e atualize o status de todos os pedidos recebidos. Os pedidos se moverão entre as abas automaticamente.
            </CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <DashboardStats orders={orders} />
                </div>
                 <div className="lg:col-span-2">
                    <OrderStatusChart orders={orders} />
                </div>
            </div>

            <Tabs defaultValue="Pendente" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {orderStatuses.map(status => {
                        const Icon = statusConfig[status].icon;
                        const ordersInStatus = ordersByStatus(status);
                        return (
                            <TabsTrigger key={status} value={status} className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                {statusConfig[status].title}
                                <Badge variant={status === "Pendente" || status === "Cancelado" ? "destructive" : "secondary"} className="ml-2 rounded-full px-2 py-0.5 text-xs">{ordersInStatus.length}</Badge>
                            </TabsTrigger>
                        )
                    })}
                </TabsList>
                {orderStatuses.map(status => (
                    <TabsContent key={status} value={status} className="pt-6">
                        <OrderList orders={ordersByStatus(status)} onStatusChange={handleStatusChangeAndNotify} onDeleteOrder={handleDeleteOrder} />
                    </TabsContent>
                ))}
            </Tabs>
        </>
      )}
    </div>
  );
}
