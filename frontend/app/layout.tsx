import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "SaaS Avaliação de Competências",
    description: "Plataforma avançada de gestão de RH e competências",
};

import QueryProvider from "@/src/providers/query-provider";

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
