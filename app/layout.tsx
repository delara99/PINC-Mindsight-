import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "PINC By Sued.Inc - Mapeamento de Perfil Comportamental",
    description: "Ferramenta definitiva baseada no Big Five para mapeamento de perfil comportamental e inteligência organizacional",
};

import QueryProvider from '../src/providers/query-provider';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body>
                <QueryProvider>
                    {children}
                </QueryProvider>
            </body>
        </html>
    );
}
