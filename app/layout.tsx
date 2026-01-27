import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL('https://www.pinc.app.br'),
    title: {
        default: "PINC - Autoconhecimento, Big Five e Inteligência Comportamental",
        template: "%s | PINC"
    },
    description: "Plataforma avançada de autoconhecimento e análise comportamental baseada no Big Five. Mapeamento de perfil, IA Coach e inteligência organizacional para RH e indivíduos.",
    keywords: ["autoconhecimento", "big five", "teste de personalidade", "perfil comportamental", "RH", "carreira", "soft skills", "inteligência emocional", "avaliação psicológica", "PINC", "Sued.Inc"],
    authors: [{ name: "Sued.Inc" }],
    creator: "Sued.Inc",
    publisher: "PINC",
    openGraph: {
        type: "website",
        locale: "pt_BR",
        url: "https://www.pinc.app.br",
        title: "PINC - Revele seu Potencial com Big Five e IA",
        description: "Descubra seus traços de personalidade, receba orientações de carreira e melhore seus relacionamentos com a ciência do Big Five.",
        siteName: "PINC",
        images: [
            {
                url: "/pinc-logo.png", // Using logo as placeholder until dedicated social image is ready
                width: 800,
                height: 600,
                alt: "PINC - Mapeamento de Perfil Comportamental",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "PINC - Inteligência Comportamental",
        description: "Mapeamento de perfil Big Five e IA Coach para sua carreira.",
        images: ["/pinc-logo.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'google-site-verification-code', // Placeholder
    }
};

import QueryProvider from '../src/providers/query-provider';
import GlobalHelpButton from '../src/components/GlobalHelpButton';
import Script from 'next/script';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "PINC",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "29.90",
            "priceCurrency": "BRL",
            "availability": "https://schema.org/InStock"
        },
        "description": "Plataforma de autoconhecimento baseada no Big Five com IA Coach.",
        "author": {
            "@type": "Organization",
            "name": "Sued.Inc",
            "url": "https://www.pinc.app.br"
        }
    };

    return (
        <html lang="pt-BR">
            <body>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <QueryProvider>
                    {children}
                    <GlobalHelpButton />
                </QueryProvider>
            </body>
        </html>
    );
}
