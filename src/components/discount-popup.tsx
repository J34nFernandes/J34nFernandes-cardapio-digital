"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TicketPercent, ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";

const POPUP_SEEN_KEY = "discountPopupSeen";
const COUPON_CODE = "BEMVINDO10";

export function DiscountPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem(POPUP_SEEN_KEY);
    const timer = setTimeout(() => {
        if (!hasSeenPopup) {
            setIsOpen(true);
            localStorage.setItem(POPUP_SEEN_KEY, "true");
        }
    }, 3000); // Show popup after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    toast({
      title: "Cupom Copiado!",
      description: `O código ${COUPON_CODE} foi copiado para sua área de transferência.`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
            <TicketPercent className="h-16 w-16 text-primary" />
          <DialogTitle className="font-headline text-2xl mt-4">Bem-vindo(a)!</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            É sua primeira vez aqui? Use o cupom abaixo para ganhar 10% de desconto na sua compra!
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full items-center space-x-2 my-4">
            <Input 
                value={COUPON_CODE} 
                readOnly 
                className="flex-1 font-mono text-lg text-center bg-muted border-dashed"
            />
            <Button type="button" size="icon" onClick={copyToClipboard} className="shrink-0">
                <ClipboardCopy className="h-5 w-5" />
            </Button>
        </div>
        <DialogFooter className="sm:justify-center">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Fechar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
