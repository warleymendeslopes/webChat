import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsApp Chat - Mensagens em Tempo Real",
  description:
    "Aplicação de chat integrada com WhatsApp Business API. Envie e receba mensagens, mídia e muito mais.",
  keywords: ["whatsapp", "chat", "mensagens", "firebase", "nextjs"],
  authors: [{ name: "WhatsApp Chat Team" }],
  openGraph: {
    title: "WhatsApp Chat",
    description: "Chat integrado com WhatsApp Business API",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
