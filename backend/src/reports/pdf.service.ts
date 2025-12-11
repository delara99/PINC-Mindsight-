
import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {

    async generatePdf(data: any): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 1. Gerar HTML
        const html = this.generateHtml(data);

        // 2. Setar conteúdo
        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        // 3. Gerar PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px'
            }
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
    }

    private generateHtml(data: any): string {
        // Traduções
        const traitMap: Record<string, string> = {
            'OPENNESS': 'Abertura ao Novo',
            'CONSCIENTIOUSNESS': 'Conscienciosidade',
            'EXTRAVERSION': 'Extroversão',
            'AGREEABLENESS': 'Amabilidade',
            'NEUROTICISM': 'Estabilidade Emocional'
        };

        const categoryMap: Record<string, string> = {
            'STRENGTH': 'Fortaleza',
            'RISK': 'Ponto de Atenção',
            'COMMUNICATION_STYLE': 'Estilo de Comunicação'
        };

        const traits = Object.entries(data.scores || {}).map(([key, value]) => `
            <div class="trait-row">
                <span class="trait-name">${traitMap[key] || key}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${(Number(value) / 5) * 100}%"></div>
                </div>
                <span class="trait-value">${Number(value).toFixed(1)}</span>
            </div>
        `).join('');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 50px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                .header h1 { color: #2563eb; margin: 0; font-size: 28px; text-transform: uppercase; }
                .client-info { margin-top: 15px; font-size: 18px; font-weight: bold; color: #555; }
                .meta-info { font-size: 14px; color: #888; margin-top: 5px; }
                
                .section { margin-bottom: 40px; page-break-inside: avoid; }
                .section h2 { border-left: 5px solid #2563eb; padding-left: 10px; color: #1f2937; }
                
                .trait-row { display: flex; align-items: center; margin-bottom: 15px; }
                .trait-name { width: 180px; font-weight: bold; font-size: 14px; }
                .bar-container { flex: 1; background: #e5e7eb; height: 12px; border-radius: 6px; margin: 0 15px; overflow: hidden; }
                .bar { background: #2563eb; height: 100%; border-radius: 6px; }
                .trait-value { width: 40px; text-align: right; font-weight: bold; }

                .interpretation-container { margin-top: 20px; }
                .interpretation-item { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e5e7eb; }
                .interpretation-item h3 { margin-top: 0; font-size: 16px; color: #111827; }
                .category-tag { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
                .category-tag.STRENGTH { background: #dcfce7; color: #166534; }
                .category-tag.RISK { background: #fee2e2; color: #991b1b; }
                .category-tag.COMMUNICATION_STYLE { background: #dbeafe; color: #1e40af; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Perfil Comportamental</h1>
                <div class="client-info">${data.name}</div>
                <div class="meta-info">Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>

            <div class="section">
                <h2>Análise Gráfica</h2>
                ${traits}
            </div>

            <div class="section">
                <h2>Interpretação Personalizada</h2>
                <div class="interpretation-container">
                    ${data.interpretation.map((item: any) => `
                        <div class="interpretation-item">
                            <h3>${traitMap[item.trait] || item.trait} <span style="font-weight:normal; font-size: 0.9em; color:#666;">(Score: ${Number(item.score).toFixed(1)})</span></h3>
                            <div class="category-tag ${item.category}">${categoryMap[item.category] || item.category}</div>
                            <p>${item.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
        `;
    }
}
