"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, TicketPercent, Percent, DollarSign, BarChart2, Users } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';


import { type Coupon, type Order } from "../../../types";
import {
  listenToCoupons,
  addCoupon,
  deleteCoupon,
} from "../../../services/coupon-service";
import { listenToOrdersWithCoupon } from "../../../services/order-service";
import { useToast } from "../../../hooks/use-toast";
import { formatCurrency } from "../../../lib/utils";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
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
} from "../../../components/ui/alert-dialog";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Textarea } from "../../../components/ui/textarea";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });


const couponFormSchema = z.object({
  code: z.string().min(3, "O código deve ter pelo menos 3 caracteres.").max(20).toUpperCase(),
  type: z.enum(["percentage", "fixed"], { required_error: "Selecione o tipo de desconto." }),
  value: z.coerce.number().positive("O valor do desconto deve ser positivo."),
  description: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444", "#f59e0b"];


function CouponUsageChart({ orders }: { orders: Order[] }) {
    const chartData = useMemo(() => {
        if (!orders.length) return [];
        const usageCounts = orders.reduce((acc, order) => {
            if (order.coupon) {
                acc[order.coupon.code] = (acc[order.coupon.code] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(usageCounts).map(([code, count]) => ({
            x: code,
            y: count,
        }));
    }, [orders]);


    if (chartData.length === 0) {
        return (
            <div className="flex h-64 min-h-[200px] w-full items-center justify-center rounded-md bg-muted/50">
                <p className="text-muted-foreground">Nenhum cupom foi utilizado ainda.</p>
            </div>
        );
    }
    
    const series = [{
        name: 'Usos',
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
                distributed: true,
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
                formatter: (val) => `${val} usos`
             }
        }
    };


    return (
        <div className="h-64 min-h-[200px] w-full">
            <Chart options={options} series={series} type="bar" height="100%" width="100%" />
        </div>
    );
}

function CouponUsageTable({ orders }: { orders: Order[] }) {
    if (orders.length === 0) {
        return null; // Don't show the table if no coupons were used
    }
    
    return (
         <div className="w-full overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cupom</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Desconto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono font-medium">{order.coupon?.code}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{format(order.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                                -{formatCurrency(order.coupon?.discount ?? 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}


export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [ordersWithCoupon, setOrdersWithCoupon] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: 0,
      description: "",
    },
  });

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeCoupons = listenToCoupons((couponsFromDb) => {
      setCoupons(couponsFromDb);
      setIsLoading(false);
    });
    const unsubscribeOrders = listenToOrdersWithCoupon((ordersFromDb) => {
        setOrdersWithCoupon(ordersFromDb);
    });

    return () => {
        unsubscribeCoupons();
        unsubscribeOrders();
    }
  }, []);

  const handleAddCoupon = async (values: CouponFormValues) => {
    setIsSubmitting(true);
    try {
      const newCoupon: Omit<Coupon, "id" | "createdAt"> = {
        code: values.code.toUpperCase(),
        type: values.type,
        value: values.value,
        description: values.description || undefined,
      };

      await addCoupon(newCoupon);
      
      toast({
        title: "Cupom Adicionado!",
        description: `O cupom "${values.code.toUpperCase()}" foi criado com sucesso.`,
      });
      form.reset();

    } catch (error: any) {
      console.error("Erro ao adicionar cupom:", error);
      let description = "Não foi possível criar o cupom. Tente novamente.";
      if (error.message.includes("Coupon code already exists")) {
        description = "Já existe um cupom com este código.";
      }
      toast({
        title: "Erro!",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    await deleteCoupon(coupon.id);
    toast({
      title: "Cupom Removido",
      description: `O cupom "${coupon.code}" foi removido.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                <TicketPercent className="h-6 w-6" />
                <CardTitle className="font-headline text-xl">Criar Novo Cupom</CardTitle>
                </div>
                <CardDescription>
                Preencha os dados para criar um novo cupom de desconto.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddCoupon)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Código do Cupom</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: BEMVINDO10" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                <SelectItem value="fixed">Fixo (R$)</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="10" {...field} />
                            </FormControl>
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
                            <FormLabel>Descrição (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ex: Cupom de 10% para primeira compra." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" variant="accent" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Plus />}
                        Criar Cupom
                    </Button>
                </form>
                </Form>
            </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Cupons Ativos</CardTitle>
                <CardDescription>Lista de todos os cupons de desconto disponíveis no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                ) : coupons.length > 0 ? (
                <div className="w-full overflow-hidden rounded-md border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-[100px] text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                            <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="gap-1.5 pl-1.5">
                                    {coupon.type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                    {coupon.type === 'percentage' ? 'Porcentagem' : 'Fixo'}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                                {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                            </TableCell>
                            <TableCell className="text-center">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remover cupom</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso irá remover permanentemente o cupom
                                        <span className="font-semibold"> {coupon.code}</span>.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCoupon(coupon)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                ) : (
                <div className="flex h-40 flex-col items-center justify-center rounded-md bg-muted/50">
                    <p className="text-muted-foreground">Nenhum cupom cadastrado ainda.</p>
                    <p className="text-sm text-muted-foreground mt-1">Use o formulário ao lado para começar.</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <BarChart2 className="h-6 w-6" />
                        <CardTitle className="font-headline text-xl">Análise de Uso</CardTitle>
                    </div>
                    <CardDescription>Visualize quais cupons são mais populares.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CouponUsageChart orders={ordersWithCoupon} />
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6" />
                        <CardTitle className="font-headline text-xl">Histórico de Utilização</CardTitle>
                    </div>
                    <CardDescription>Veja o detalhe de cada cupom utilizado nos pedidos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CouponUsageTable orders={ordersWithCoupon} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
