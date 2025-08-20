"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { PatternFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import { type Order, type Coupon, type Address } from "@/types";
import { addOrder } from "@/services/order-service";
import { getCouponByCode } from "@/services/coupon-service";
import { addUserAddress } from "@/services/user-service";
import { Loader2, Search, Tag, Home, PlusCircle } from "lucide-react";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { useAppSettings } from "@/hooks/use-app-settings";

const addressSchema = z.object({
  cep: z.string().min(9, "O CEP deve ter 8 dígitos."),
  street: z.string().min(3, "A rua é obrigatória."),
  number: z.string().min(1, "O número é obrigatório."),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, "O bairro é obrigatório."),
  city: z.string().min(3, "A cidade é obrigatória."),
  state: z.string().length(2, "O UF deve ter 2 caracteres."),
  nickname: z.string().min(2, "O apelido do endereço é obrigatório (Ex: Casa, Trabalho).").optional(),
});


const formSchema = z.object({
  phone: z.string().min(15, "O telefone deve ter 11 dígitos."),
  selectedAddressId: z.string().optional(),
  newAddress: addressSchema.optional(),
  isAddingNewAddress: z.boolean().default(false),
  paymentMethod: z.enum(["credit-card", "pix", "cash"], {
    required_error: "Você precisa selecionar uma forma de pagamento.",
  }),
  observations: z.string().optional(),
}).refine(data => {
    // Must select an address OR be adding a new one.
    if (data.isAddingNewAddress) {
        return !!data.newAddress;
    }
    return !!data.selectedAddressId;
}, { message: "Selecione ou adicione um endereço.", path: ["selectedAddressId"]});


export function CheckoutDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { settings } = useAppSettings();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: userProfile?.phone || "",
      isAddingNewAddress: false,
      observations: "",
      newAddress: {
        nickname: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      }
    },
  });

  const isAddingNewAddress = form.watch("isAddingNewAddress");

  useEffect(() => {
    if (userProfile?.phone) {
      form.setValue("phone", userProfile.phone);
    }
    // If there's only one address, select it by default.
    if (userProfile?.addresses && userProfile.addresses.length === 1 && !isAddingNewAddress) {
        form.setValue("selectedAddressId", userProfile.addresses[0].id);
    }
    // Reset new address form when toggling off
     if (!isAddingNewAddress) {
        form.setValue("newAddress", { nickname: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
    }
  }, [userProfile, form, isAddingNewAddress]);

  const handleCepSearch = async () => {
    const cep = form.getValues("newAddress.cep")?.replace(/\D/g, ''); // Remove non-digit characters
    if (!cep || cep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const data = response.data;
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Por favor, verifique o CEP digitado.", variant: "destructive" });
        form.setValue("newAddress.street", "");
        form.setValue("newAddress.neighborhood", "");
        form.setValue("newAddress.city", "");
        form.setValue("newAddress.state", "");

      } else {
        form.setValue("newAddress.street", data.logradouro, { shouldValidate: true });
        form.setValue("newAddress.neighborhood", data.bairro, { shouldValidate: true });
        form.setValue("newAddress.city", data.localidade, { shouldValidate: true });
        form.setValue("newAddress.state", data.uf, { shouldValidate: true });
        toast({ title: "Endereço encontrado!", description: "Agora é só preencher o número." });
        form.setFocus("newAddress.number");
      }
    } catch (error) {
      toast({ title: "Erro ao buscar CEP", description: "Não foi possível buscar o endereço. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSearchingCep(false);
    }
  };


  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "credit-card":
        return "Cartão de Crédito/Débito";
      case "pix":
        return "PIX";
      case "cash":
        return "Dinheiro";
      default:
        return "";
    }
  }
  
  const calculateDiscount = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
        return cartTotal * (coupon.value / 100);
    }
    if (coupon.type === "fixed") {
        return coupon.value;
    }
    return 0;
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        return;
    }
    
    const coupon = await getCouponByCode(couponCode.toUpperCase());

    if(coupon) {
        const discount = calculateDiscount(coupon);
        setDiscountAmount(discount);
        setAppliedCoupon(coupon);
        toast({ title: "Cupom Aplicado!", description: `Você recebeu um desconto de ${formatCurrency(discount)}.`})
    } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        toast({ title: "Cupom Inválido", description: "O código do cupom inserido não é válido.", variant: "destructive"})
    }
  }

  const finalTotal = cartTotal - discountAmount > 0 ? cartTotal - discountAmount : 0;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Erro de Autenticação", description: "Você precisa estar logado para fazer um pedido.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    let finalAddress: Address | undefined;

    if (values.isAddingNewAddress && values.newAddress) {
         if (!values.newAddress.nickname) {
            toast({ title: "Campo Obrigatório", description: "Por favor, dê um apelido para o novo endereço.", variant: "destructive"});
            setIsSubmitting(false);
            return;
        }
        await addUserAddress(user.uid, values.newAddress);
        finalAddress = { ...values.newAddress, id: 'temp-id' }; // Use the just-added address
    } else {
        finalAddress = userProfile?.addresses?.find(addr => addr.id === values.selectedAddressId);
    }

    if(!finalAddress) {
         toast({ title: "Erro de Endereço", description: "Não foi possível determinar o endereço de entrega.", variant: "destructive"});
         setIsSubmitting(false);
         return;
    }


    const companyPhoneNumber = settings?.companyInfo?.phone?.replace(/\D/g, '') || ""; 

    const fullAddress = `${finalAddress.street}, ${finalAddress.number}${finalAddress.complement ? `, ${finalAddress.complement}` : ''} - ${finalAddress.neighborhood}, ${finalAddress.city} - ${finalAddress.state}, CEP: ${finalAddress.cep}`;

    const orderData: Omit<Order, "id"> = {
      userId: user?.uid || null,
      customerName: user?.displayName || user?.email || "Anônimo",
      customerEmail: user?.email || "",
      customerPhone: values.phone,
      items: cartItems,
      total: finalTotal, 
      status: "Pendente",
      address: fullAddress,
      paymentMethod: formatPaymentMethod(values.paymentMethod),
      observations: values.observations || "Nenhuma",
      createdAt: new Date(),
      coupon: appliedCoupon ? { code: appliedCoupon.code, discount: discountAmount } : undefined,
    }

    const orderId = await addOrder(orderData);

    if (!orderId) {
       toast({
        title: "Erro no Pedido",
        description: "Não foi possível salvar seu pedido. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const orderItems = cartItems.map(item => 
      `- ${item.quantity}x ${item.name}`
    ).join("\n");

    const discountText = discountAmount > 0 && appliedCoupon
        ? `\n*Desconto:* -${formatCurrency(discountAmount)} (Cupom: ${appliedCoupon.code})` 
        : '';
    
    const message = `
*Novo Pedido!* (Nº ${orderId.slice(0, 5).toUpperCase()}) 🛍️

*Cliente:* ${user?.displayName || user?.email}
*Telefone:* ${values.phone}

*Itens:*
${orderItems}
-----------------------------------
*Subtotal:* ${formatCurrency(cartTotal)}${discountText}
*Total:* ${formatCurrency(finalTotal)}
-----------------------------------
*Endereço de Entrega:*
${fullAddress}

*Forma de Pagamento:*
${formatPaymentMethod(values.paymentMethod)}

*Observações:*
${values.observations || "Nenhuma"}
    `;

    const whatsappUrl = `https://wa.me/${companyPhoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Pedido enviado!",
      description: "Seu pedido foi enviado para o WhatsApp. Finalize a conversa por lá.",
    });

    clearCart();
    form.reset();
    setDiscountAmount(0);
    setCouponCode("");
    setAppliedCoupon(null);
    setIsOpen(false);
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full" disabled={cartItems.length === 0}>
          Finalizar Compra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg h-full max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Finalizar Pedido
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-4 overflow-y-auto">
             <ScrollArea className="h-full pr-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone (WhatsApp)</FormLabel>
                            <FormControl>
                                <PatternFormat
                                    format="(##) #####-####"
                                    customInput={Input}
                                    placeholder="(99) 99999-9999"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Address Selection */}
                    <FormField
                        control={form.control}
                        name="selectedAddressId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Endereço de Entrega</FormLabel>
                                 <RadioGroup
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue("isAddingNewAddress", false);
                                    }}
                                    value={isAddingNewAddress ? "" : field.value}
                                    className="space-y-2"
                                >
                                    {userProfile?.addresses?.map(addr => (
                                        <FormItem key={addr.id} className="flex items-center space-x-3 space-y-0 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-muted/50">
                                            <FormControl><RadioGroupItem value={addr.id} /></FormControl>
                                            <FormLabel className="font-normal cursor-pointer flex-1">
                                                <p className="font-semibold">{addr.nickname}</p>
                                                <p className="text-sm text-muted-foreground">{addr.street}, {addr.number} - {addr.neighborhood}</p>
                                            </FormLabel>
                                        </FormItem>
                                    ))}
                                </RadioGroup>
                                 <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => form.setValue("isAddingNewAddress", !isAddingNewAddress)}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {isAddingNewAddress ? "Cancelar" : "Adicionar Novo Endereço"}
                    </Button>

                     {/* New Address Form */}
                    {isAddingNewAddress && (
                        <div className="space-y-4 rounded-md border p-4">
                             <FormField
                                control={form.control}
                                name="newAddress.nickname"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apelido do Endereço</FormLabel>
                                    <FormControl><Input placeholder="Ex: Casa, Trabalho" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newAddress.cep"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CEP</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <PatternFormat
                                                format="#####-###"
                                                customInput={Input}
                                                placeholder="00000-000"
                                                onBlur={handleCepSearch}
                                                {...field}
                                            />
                                        </FormControl>
                                        <Button type="button" onClick={handleCepSearch} disabled={isSearchingCep} variant="secondary">
                                        {isSearchingCep ? <Loader2 className="animate-spin" /> : <Search />}
                                            Buscar
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="newAddress.street"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rua</FormLabel>
                                    <FormControl><Input placeholder="Ex: Rua das Flores" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-2">
                                <FormField
                                    control={form.control}
                                    name="newAddress.number"
                                    render={({ field }) => (
                                    <FormItem className="col-span-1">
                                        <FormLabel>Número</FormLabel>
                                        <FormControl><Input placeholder="123" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="newAddress.complement"
                                    render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Complemento</FormLabel>
                                        <FormControl><Input placeholder="Apto 42" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="newAddress.neighborhood"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl><Input placeholder="Ex: Bairro Jardim" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-4 gap-2">
                                <FormField
                                    control={form.control}
                                    name="newAddress.city"
                                    render={({ field }) => (
                                    <FormItem className="col-span-3">
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl><Input placeholder="Ex: São Paulo" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="newAddress.state"
                                    render={({ field }) => (
                                    <FormItem className="col-span-1">
                                        <FormLabel>UF</FormLabel>
                                        <FormControl><Input placeholder="SP" maxLength={2} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                    <FormLabel>Cupom de Desconto</FormLabel>
                    <div className="flex gap-2">
                        <Input placeholder="Ex: BEMVINDO10" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={!!appliedCoupon} />
                        <Button type="button" onClick={handleApplyCoupon} variant="secondary" disabled={!!appliedCoupon}>
                            <Tag className="mr-2 h-4 w-4" />
                            Aplicar
                        </Button>
                    </div>
                     {appliedCoupon && (
                        <p className="text-xs text-muted-foreground">
                            Cupom <span className="font-semibold text-primary">{appliedCoupon.code}</span> aplicado!{' '}
                            <button
                            type="button"
                            onClick={() => {
                                setCouponCode('');
                                setAppliedCoupon(null);
                                setDiscountAmount(0);
                            }}
                            className="text-destructive underline"
                            >
                            Remover
                            </button>
                        </p>
                    )}
                </div>

                <Separator className="my-4" />
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Desconto</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span>{formatCurrency(finalTotal)}</span>
                    </div>
                </div>
                
                <Separator className="my-4" />


                <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:bg-muted/50">
                            <FormControl>
                            <RadioGroupItem value="credit-card" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                            Cartão de Crédito/Débito
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:bg-muted/50">
                            <FormControl>
                            <RadioGroupItem value="pix" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">PIX</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:bg-muted/50">
                            <FormControl>
                            <RadioGroupItem value="cash" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">Dinheiro</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Ex: Deixar sem cebola, ponto da carne mal passado, etc."
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </ScrollArea>
          </form>
        </Form>
        <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button form="checkout-form" type="submit" variant="accent" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                Confirmar Pedido
              </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
