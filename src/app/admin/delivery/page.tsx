"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Ban, DollarSign, CheckCircle, BarChart2, ListChecks, Calendar, CalendarCheck, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { listenToOrders, updateOrderStatus } from "@/services/order-service";
import { type Order, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { subDays, format, isAfter, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeliveryOrderCard } from "@/components/delivery-order-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444", "#f59e0b"];

function DeliveryStats({ ordersToDeliver, completedTodayOrders }: { ordersToDeliver: Order[], completedTodayOrders: Order[] }) {
    const stats = useMemo(() => {
        const cashToReceive = ordersToDeliver.filter(o => o.paymentMethod === 'Dinheiro').reduce((acc, order) => acc + order.total, 0);

        return {
            pendingDeliveries: ordersToDeliver.length,
            completedOrdersCount: completedTodayOrders.length,
            cashToReceive,
        }
    }, [ordersToDeliver, completedTodayOrders]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Entregas Pendentes</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
                    <p className="text-xs text-muted-foreground">Pedidos aguardando entrega</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Entregas Concluídas (Hoje)</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.completedOrdersCount}</div>
                    <p className="text-xs text-muted-foreground">Total de pedidos entregues hoje</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">A Receber (Dinheiro)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.cashToReceive)}</div>
                    <p className="text-xs text-muted-foreground">Soma das entregas pendentes</p>
                </CardContent>
            </Card>
        </div>
    );
}

function DeliveryChart({ orders }: { orders: Order[] }) {
    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), i);
            return {
                date: format(date, 'dd/MM'),
                shortDate: format(date, 'd MMM', { locale: ptBR }),
                count: 0
            };
        }).reverse();

        const completedOrders = orders.filter(o => o.status === 'Concluído');

        completedOrders.forEach(order => {
            const orderDate = order.createdAt.toDate();
            const dayEntry = last7Days.find(d => d.date === format(orderDate, 'dd/MM'));
            if(dayEntry) {
                dayEntry.count += 1;
            }
        });
        
        return last7Days.map((item) => ({
            x: item.shortDate,
            y: item.count,
        }));

    }, [orders]);
    
    const series = [{
        name: 'Entregas',
        data: chartData,
    }];
    
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: chartData.map(d => d.x),
        },
        yaxis: {
             labels: {
                formatter: (value) => String(parseInt(value))
            }
        },
        colors: CHART_COLORS,
        legend: {
            show: false,
        },
        grid: {
             borderColor: '#e5e7eb',
             strokeDashArray: 5,
        },
        tooltip: {
             y: {
                formatter: (val) => `${val} entregas`
             }
        }
    };

    return (
        <Card>
             <CardHeader>
                <div className="flex items-center gap-3">
                    <BarChart2 className="h-5 w-5" />
                    <CardTitle className="font-headline text-lg">Desempenho Semanal</CardTitle>
                </div>
                <CardDescription>Total de entregas concluídas nos últimos 7 dias.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="h-64 min-h-[200px] w-full">
                    <Chart options={options} series={series} type="bar" height="100%" width="100%" />
                </div>
            </CardContent>
        </Card>
    )
}

function CompletedOrdersHistory({ orders, title, icon: Icon }: { orders: Order[], title: string, icon: React.ElementType }) {
    const groupedOrders = useMemo(() => {
        return orders.reduce((acc, order) => {
            const date = format(order.completedAt?.toDate() ?? new Date(), 'PPP', { locale: ptBR });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(order);
            return acc;
        }, {} as Record<string, Order[]>);
    }, [orders]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </div>
                <CardDescription>Suas entregas concluídas.</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length === 0 ? (
                     <div className="text-center py-12 text-muted-foreground">
                        Nenhuma entrega nesta categoria.
                    </div>
                ) : (
                <ScrollArea className="h-96">
                    <div className="space-y-4 pr-4">
                        {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                            <div key={date}>
                                <h3 className="font-semibold my-2">{date}</h3>
                                <div className="space-y-3">
                                {dateOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center rounded-md border p-3">
                                        <div>
                                            <p className="font-medium">Pedido #{order.id.slice(0,5).toUpperCase()}</p>
                                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                                        </div>
                                        <Badge variant="secondary">{formatCurrency(order.total)}</Badge>
                                    </div>
                                ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

export default function DeliveryDashboardPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile, loadingAuth } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth) return;
    
    if (!user || (userProfile && userProfile.role !== 'delivery' && userProfile.role !== 'admin')) {
        router.push('/');
        return;
    }

    setIsLoading(true);
    
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

    // Listener for all orders
    const unsubscribeAllOrders = listenToOrders((allOrdersFromDb) => {
      // Filter for orders from the last 30 days on the client-side
      const recentOrders = allOrdersFromDb.filter(order => isAfter(order.createdAt.toDate(), thirtyDaysAgo));
      setAllOrders(recentOrders);
      setIsLoading(false);
    });

    return () => {
        unsubscribeAllOrders();
    };
  }, [user, userProfile, loadingAuth, router]);

  const { ordersToDeliver, completedTodayOrders, completedPastOrders } = useMemo(() => {
    const today = new Date();
    return {
        ordersToDeliver: allOrders.filter(o => o.status === "Saiu para Entrega"),
        completedTodayOrders: allOrders.filter(o => o.status === 'Concluído' && o.completedAt && isSameDay(o.completedAt.toDate(), today)),
        completedPastOrders: allOrders.filter(o => o.status === 'Concluído' && o.completedAt && !isSameDay(o.completedAt.toDate(), today)),
    }
  }, [allOrders]);

  const handleCompleteOrder = async (orderId: string) => {
      const updatedOrder = await updateOrderStatus(orderId, "Concluído");
      if (updatedOrder) {
          toast({
              title: "Entrega Concluída!",
              description: `Pedido #${orderId.slice(0,5).toUpperCase()} finalizado com sucesso.`,
              icon: <CheckCircle className="h-5 w-5 text-green-500" />
          })
      } else {
          toast({
              title: "Erro",
              description: "Não foi possível finalizar a entrega.",
              variant: "destructive"
          })
      }
  }


  if (loadingAuth || isLoading) {
     return (
        <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (!user || (userProfile && userProfile.role !== 'delivery' && userProfile.role !== 'admin')) {
      return (
         <div className="flex flex-col justify-center items-center h-[calc(100vh-8rem)] text-center p-4">
             <Ban className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            <Button asChild className="mt-4">
                <Link href="/">Voltar para a Página Inicial</Link>
            </Button>
        </div>
      )
  }

  return (
    <div className="space-y-8">
        <DeliveryStats ordersToDeliver={ordersToDeliver} completedTodayOrders={completedTodayOrders} />
        
        <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Entregas Pendentes ({ordersToDeliver.length})</TabsTrigger>
                <TabsTrigger value="history">Histórico & Análise</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="pt-6">
                 {ordersToDeliver.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 h-64">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <p className="font-semibold text-muted-foreground">Nenhum pedido aguardando entrega no momento.</p>
                        <p className="text-sm text-muted-foreground mt-1">Bom trabalho!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {ordersToDeliver.map((order) => (
                            <DeliveryOrderCard key={order.id} order={order} onCompleteOrder={handleCompleteOrder} />
                        ))}
                    </div>
                )}
            </TabsContent>
            <TabsContent value="history" className="pt-6 space-y-6">
                <DeliveryChart orders={allOrders} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CompletedOrdersHistory orders={completedTodayOrders} title="Concluídas Hoje" icon={CalendarCheck} />
                    <CompletedOrdersHistory orders={completedPastOrders} title="Concluídas (Dias Anteriores)" icon={Calendar} />
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
