
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

        const levelMap: Record<string, string> = {
            'VERY_LOW': 'Muito Baixo',
            'LOW': 'Baixo',
            'AVERAGE': 'Médio',
            'HIGH': 'Alto',
            'VERY_HIGH': 'Muito Alto'
        };

        // Gerar linhas de traits com scores normalizados (0-100)
        const traits = (data.traits || []).map((trait: any) => `
            <div class="trait-row">
                <span class="trait-name">${trait.name}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${trait.score}%"></div>
                </div>
                <span class="trait-value">${trait.score}</span>
                <span class="trait-level">${levelMap[trait.level] || trait.level}</span>
            </div>
        `).join('');

        // Gerar interpretações
        const interpretations = (data.traits || []).map((trait: any) => `
            <div class="interpretation-item">
                <h3>${trait.name} <span style="font-weight:normal; font-size: 0.9em; color:#666;">(${trait.score}/100 - ${levelMap[trait.level]})</span></h3>
                <p>${trait.interpretation || 'Sem interpretação disponível.'}</p>
                ${trait.facets && trait.facets.length > 0 ? `
                    <div class="facets">
                        <h4>Facetas:</h4>
                        ${trait.facets.map((facet: any) => `
                            <div class="facet-item">
                                <span>${facet.facetName}:</span> <strong>${facet.score}</strong>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; padding: 20px; }
                .header { text-align: center; margin-bottom: 50px; border-bottom: 3px solid ${data.config?.primaryColor || '#2563eb'}; padding-bottom: 20px; }
                .header h1 { color: ${data.config?.primaryColor || '#2563eb'}; margin: 0; font-size: 28px; text-transform: uppercase; }
                .client-info { margin-top: 15px; font-size: 18px; font-weight: bold; color: #555; }
                .meta-info { font-size: 14px; color: #888; margin-top: 5px; }
                
                .section { margin-bottom: 40px; page-break-inside: avoid; }
                .section h2 { border-left: 5px solid ${data.config?.primaryColor || '#2563eb'}; padding-left: 10px; color: #1f2937; font-size: 22px; }
                
                .trait-row { display: flex; align-items: center; margin-bottom: 20px; padding: 10px; background: #f9fafb; border-radius: 8px; }
                .trait-name { width: 200px; font-weight: bold; font-size: 15px; color: #111827; }
                .bar-container { flex: 1; background: #e5e7eb; height: 20px; border-radius: 10px; margin: 0 15px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
                .bar { background: linear-gradient(90deg, ${data.config?.primaryColor || '#2563eb'}, ${data.config?.primaryColor || '#60a5fa'}); height: 100%; border-radius: 10px; transition: width 0.3s; }
                .trait-value { width: 50px; text-align: center; font-weight: bold; font-size: 16px; color: ${data.config?.primaryColor || '#2563eb'}; }
                .trait-level { width: 100px; text-align: right; font-size: 13px; color: #6b7280; font-style: italic; }

                .interpretation-container { margin-top: 20px; }
                .interpretation-item { background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .interpretation-item h3 { margin-top: 0; font-size: 18px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
                .interpretation-item p { margin: 15px 0; font-size: 14px; line-height: 1.8; color: #374151; }
                
                .facets { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #d1d5db; }
                .facets h4 { font-size: 14px; color: #6b7280; margin-bottom: 10px; }
                .facet-item { display: inline-block; margin-right: 20px; margin-bottom: 8px; font-size: 13px; }
                .facet-item span { color: #6b7280; }
                .facet-item strong { color: ${data.config?.primaryColor || '#2563eb'}; }
                
                .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
            </style>
        </head>
        <body>
            <div class="header">
                ${data.config?.companyLogo ? `<img src="${data.config.companyLogo}" style="max-width: 150px; margin-bottom: 20px;" />` : ''}
                <h1>${data.config?.reportHeader || 'Relatório de Perfil Comportamental'}</h1>
                <div class="client-info">${data.userName}</div>
                <div class="meta-info">Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
                <div class="meta-info">Configuração: ${data.config?.name || 'Padrão'}</div>
            </div>

            <div class="section">
                <h2>Análise Gráfica - Big Five</h2>
                ${traits}
            </div>

            <div class="section">
                <h2>Interpretação Detalhada</h2>
                <div class="interpretation-container">
                    ${interpretations}
                </div>
            </div>
            
            <div class="footer">
                ${data.config?.reportFooter || 'PINC Mindsight - Análise de Perfil Comportamental'}
            </div>
        </body>
        </html>
        `;
    }
}
