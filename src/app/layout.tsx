import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import { ThemeProvider } from "../components/theme-provider";
import { cn } from "../lib/utils";
import { Inter, Space_Grotesk } from 'next/font/google'
import { CartProvider } from "../hooks/use-cart";
import { AuthProvider } from "../hooks/use-auth";
import { AppSettingsProvider } from "../hooks/use-app-settings";


const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
})


export const metadata: Metadata = {
  title: "Product Manager",
  description: "Manage your products with ease and smart suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen font-body antialiased",
          fontBody.variable,
          fontHeadline.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
          <AppSettingsProvider>
              <CartProvider>
                  {children}
                  <Toaster />
              </CartProvider>
          </AppSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
