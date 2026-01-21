
import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {


    async generateTalkingToPdf(formattedData: any): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });
        const page = await browser.newPage();

        const html = this.generateTalkingToHtml(formattedData);

        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                bottom: '0px',
                left: '0px',
                right: '0px'
            } // Mercilessly control margins via CSS padding for full bleed backgrounds
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
    }

    public generateTalkingToHtml(data: any): string {
        const { talkingToAnalysis: analysis, unifiedScores, radarData, userName, date } = data;

        const generateRadarSvg = (radarData: any[]) => {
            const size = 350;
            const center = size / 2;
            const radius = 120;
            const angles = radarData.map((_, i) => (Math.PI * 2 * i) / radarData.length - Math.PI / 2);

            let gridSvg = '';
            for (let i = 1; i <= 5; i++) {
                const r = (radius / 5) * i;
                const points = angles.map(a => `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`).join(' ');
                gridSvg += `<polygon points="${points}" fill="none" stroke="#e5e7eb" stroke-width="1" />`;
            }

            const dataPoints = radarData.map((d, i) => {
                const val = (d.A / 100) * radius;
                return `${center + val * Math.cos(angles[i])},${center + val * Math.sin(angles[i])}`;
            }).join(' ');

            const labelsSvg = radarData.map((d, i) => {
                const r = radius + 30;
                const x = center + r * Math.cos(angles[i]);
                const y = center + r * Math.sin(angles[i]);
                const anchor = Math.abs(Math.cos(angles[i])) < 0.1 ? 'middle' : (Math.cos(angles[i]) > 0 ? 'start' : 'end');
                return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="11" fill="#4b5563" font-family="'Inter', sans-serif" font-weight="600">${d.subject}</text>`;
            }).join('');

            return `
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${center}" cy="${center}" r="${radius}" fill="#ffffff" />
                    ${gridSvg}
                    <polygon points="${dataPoints}" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="2.5" />
                    ${radarData.map((d, i) => {
                const val = (d.A / 100) * radius;
                const cx = center + val * Math.cos(angles[i]);
                const cy = center + val * Math.sin(angles[i]);
                return `<circle cx="${cx}" cy="${cy}" r="4" fill="#8b5cf6" stroke="#fff" stroke-width="2" />`;
            }).join('')}
                    ${labelsSvg}
                </svg>
            `;
        };

        const radarSvg = generateRadarSvg(radarData);

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
            <style>
                @page { margin: 0; size: A4; }
                * { box-sizing: border-box; }
                body { 
                    margin: 0; 
                    font-family: 'Inter', sans-serif; 
                    color: #1f2937; 
                    background: #fff; 
                    -webkit-print-color-adjust: exact; 
                }
                
                /* UTILS */
                .page-break { page-break-after: always; }
                .avoid-break { page-break-inside: avoid; }
                .container { padding: 40px; max-width: 210mm; margin: 0 auto; }

                /* COVER PAGE */
                .cover-page {
                    height: 297mm;
                    width: 210mm;
                    position: relative;
                    color: white;
                    overflow: hidden;
                    page-break-after: always;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background: #0f172a; /* Fallback */
                }
                .cover-bg {
                    position: absolute; inset: 0;
                    background: radial-gradient(circle at 100% 0%, #7c3aed 0%, #4c1d95 50%, #1e1b4b 100%);
                    z-index: 0;
                }
                .cover-content { position: relative; z-index: 10; padding: 60px; height: 100%; display: flex; flex-direction: column; }
                
                .brand { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 12px; margin-bottom: auto; }
                .report-type { font-size: 14px; text-transform: uppercase; letter-spacing: 3px; font-weight: 600; opacity: 0.8; margin-bottom: 20px; border-left: 4px solid #fff; padding-left: 15px; }
                .main-title { font-size: 56px; line-height: 1.1; font-weight: 900; margin: 0 0 30px 0; letter-spacing: -1px; }
                
                .pill-container { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 60px; }
                .pill { background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); font-weight: 600; font-size: 13px; }

                .cover-footer { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                .client-name { font-size: 20px; font-weight: 700; }
                .date { font-size: 14px; opacity: 0.7; }

                /* CONTENT PAGES */
                .header-strip {
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 40px;
                }
                .header-strip h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 700; margin: 0; }
                
                /* EXECUTIVE SUMMARY */
                .summary-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: center; margin-bottom: 50px; }
                .radar-box { display: flex; justify-content: center; }
                .insights-box h3 { font-size: 18px; font-weight: 800; margin: 0 0 20px 0; color: #111827; }
                
                .insight-group { margin-bottom: 25px; }
                .insight-title { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; display: block; }
                .insight-title.pos { color: #059669; }
                .insight-title.neg { color: #d97706; }
                
                .check-list { list-style: none; padding: 0; margin: 0; }
                .check-list li { 
                    position: relative; padding-left: 18px; font-size: 13px; line-height: 1.5; color: #4b5563; margin-bottom: 6px; 
                }
                .check-list li::before {
                    content: ''; position: absolute; left: 0; top: 6px; width: 6px; height: 6px; border-radius: 50%;
                }
                .check-list.pos li::before { background: #059669; }
                .check-list.neg li::before { background: #d97706; }

                /* FEATURE BLOCKS */
                .feature-block { 
                    margin-bottom: 30px; 
                    background: #fff; 
                    border: 1px solid #e5e7eb; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    /* Crucial avoid break */
                    page-break-inside: avoid; 
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .feature-header {
                    padding: 20px 25px;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .f-title { display: flex; align-items: center; gap: 12px; }
                .circle-icon { width: 32px; height: 32px; background: #7c3aed; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
                .f-name { font-size: 16px; font-weight: 700; color: #111827; }
                .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; }
                .badge.ALTO { background: #d1fae5; color: #065f46; }
                .badge.BAIXO { background: #fee2e2; color: #991b1b; }
                .badge.FLEX { background: #e0e7ff; color: #3730a3; }

                .feature-body { padding: 25px; display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
                .f-desc { font-size: 13px; line-height: 1.7; color: #374151; text-align: justify; }
                .f-side { display: flex; flex-direction: column; gap: 15px; }
                
                .mini-card { background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #cbd5e1; }
                .mini-card h5 { margin: 0 0 4px 0; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
                .mini-card p { margin: 0; font-size: 11px; color: #334155; line-height: 1.4; }

                /* TABLE */
                .table-container { 
                    border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-top: 10px; 
                    page-break-inside: avoid;
                }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { background: #f9fafb; text-align: left; padding: 12px 20px; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
                td { padding: 12px 20px; border-bottom: 1px solid #f3f4f6; color: #1f2937; }
                tr:last-child td { border-bottom: none; }
                .bar-track { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; display: inline-block; margin-right: 8px; vertical-align: middle; }
                .bar-fill { height: 100%; background: #8b5cf6; border-radius: 3px; }
                .sub-row td:first-child { padding-left: 40px; color: #6b7280; font-size: 11px; }

                .footer-strip {
                    position: fixed; bottom: 0; left: 0; right: 0; 
                    padding: 15px 40px; background: white; 
                    border-top: 1px solid #e5e7eb;
                    font-size: 10px; color: #9ca3af;
                    display: flex; justify-content: space-between;
                    z-index: 100;
                }
            </style>
        </head>
        <body>
            
            <!-- PAGE 1: COVER -->
            <div class="cover-page">
                <div class="cover-bg"></div>
                <div class="cover-content">
                    <div class="brand">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                        PINC Mindsight
                    </div>
                    
                    <div class="main-block">
                        <div class="report-type">Relatório de Perfil</div>
                        <h1 class="main-title">${analysis.profile_summary?.archetype_name || 'Seu Arquétipo'}</h1>
                        <div class="pill-container">
                             ${(analysis.profile_summary?.dominant_traits || []).slice(0, 3).map((t: string) => `<div class="pill">${t}</div>`).join('')}
                        </div>
                    </div>

                    <div class="cover-footer">
                        <div>
                            <div class="client-name">${userName}</div>
                            <div class="date">Análise gerada em ${date}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px; opacity:0.6;">POWERED BY</div>
                            <div style="font-weight:bold;">TalkingTo Engine</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PAGE 2: SUMMARY -->
            <div class="container page-break">
                <div class="header-strip">
                    <h2>Síntese Executiva</h2>
                    <span>PINC • ${date}</span>
                </div>

                <div class="summary-grid">
                    <div class="radar-box">
                        ${radarSvg}
                    </div>
                    <div class="insights-box">
                        <h3>Visão Geral do Perfil</h3>
                        
                        <div class="insight-group">
                            <span class="insight-title pos">Pontos Fortes (Potencializadores)</span>
                            <ul class="check-list pos">
                                ${(analysis.executive_summary?.strengths || []).slice(0, 5).map((s: string) => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>

                        <div class="insight-group">
                            <span class="insight-title neg">Pontos de Atenção</span>
                            <ul class="check-list neg">
                                ${(analysis.executive_summary?.watch_outs || []).slice(0, 4).map((s: string) => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <div style="padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #64748b; font-style: italic;">
                        "Este resumo captura as dinâmicas centrais da sua personalidade. Nas próximas páginas, exploraremos cada dimensão em detalhe."
                    </p>
                </div>
            </div>

            <!-- FEATURES FLOW (Continuous) -->
            <div class="container">
                <div class="header-strip">
                    <h2>Detalhamento das Dimensões</h2>
                    <span>PINC • ${date}</span>
                </div>

                ${analysis.talkingto_analysis?.map((item: any) => `
                    <div class="feature-block avoid-break">
                        <div class="feature-header">
                            <div class="f-title">
                                <div class="circle-icon">${item.dimension.charAt(0)}</div>
                                <span class="f-name">${item.dimension}</span>
                            </div>
                            <span class="badge ${item.classification}">${item.classification}</span>
                        </div>
                        <div class="feature-body">
                            <div class="f-desc">
                                ${item.text_interpretation}
                            </div>
                            <div class="f-side">
                                ${item.needs?.environment ? `
                                <div class="mini-card" style="border-left-color: #3b82f6;">
                                    <h5 style="color:#3b82f6;">Ambiente Ideal</h5>
                                    <p>${item.needs.environment}</p>
                                </div>` : ''}
                                ${item.needs?.risk ? `
                                <div class="mini-card" style="border-left-color: #f59e0b; background: #fffbeb;">
                                    <h5 style="color:#f59e0b;">Risco Latente</h5>
                                    <p>${item.needs.risk}</p>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- DATA APPENDIX -->
            <div class="container avoid-break">
                <div class="header-strip">
                    <h2>Apêndice de Dados</h2>
                    <span>PINC • ${date}</span>
                </div>

                <p style="margin-bottom: 20px; font-size: 13px; color: #6b7280;">
                    Tabela completa de pontuações normalizadas por traço e faceta.
                </p>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Dimensão / Faceta</th>
                                <th style="text-align:right;">Score</th>
                                <th style="text-align:right;">Classificação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(unifiedScores).map((score: any) => `
                                <tr style="background:#fcfcfc;">
                                    <td style="font-weight: 600;">${score.traitName}</td>
                                    <td style="text-align:right;">
                                        <div class="bar-track"><div class="bar-fill" style="width:${score.normalizedScore}%"></div></div>
                                        <strong>${score.normalizedScore}%</strong>
                                    </td>
                                    <td style="text-align:right; font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7280;">${score.levelLabel}</td>
                                </tr>
                                ${(score.facets || []).map((f: any) => `
                                    <tr class="sub-row">
                                        <td>↳ ${f.facetName}</td>
                                        <td style="text-align:right;">${f.score}%</td>
                                        <td style="text-align:right;">-</td>
                                    </tr>
                                `).join('')}
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

        </body>
        </html>
        `;
    }

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
                ${trait.customTexts ? `
                    <div style="margin-top:15px;background:#f8fafc;padding:15px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;">
                        ${trait.customTexts.summary ? `<div style="margin-bottom:8px;"><strong>📝 Resumo:</strong> ${trait.customTexts.summary}</div>` : ''}
                        ${trait.customTexts.practicalImpact?.length ? `
                            <div style="margin-top:8px;">
                                <strong>💼 Impacto Prático:</strong>
                                <ul style="margin:4px 0 0 0;padding-left:15px;">
                                    ${trait.customTexts.practicalImpact.map((p: any) => `<li>${p.context ? `<b>${p.context}:</b> ` : ''}${p.text}</li>`).join('')}
                                </ul>
                            </div>` : ''}
                        ${trait.customTexts.expertSynthesis ? `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #cbd5e1;"><strong>🧠 Síntese:</strong> ${trait.customTexts.expertSynthesis}</div>` : ''}
                         ${trait.customTexts.expertHypothesis?.length ? `
                            <div style="margin-top:8px;">
                                <strong style="color:#b91c1c;">⚠️ Hipóteses:</strong>
                                <ul style="margin:4px 0 0 0;padding-left:15px;color:#451a03;">
                                    ${trait.customTexts.expertHypothesis.map((h: any) => `<li>${h.type ? `<b>${h.type}:</b> ` : ''}${h.text}</li>`).join('')}
                                </ul>
                            </div>` : ''}
                    </div>
                ` : ''}
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

            ${data.interpretationSections && data.interpretationSections.length > 0 ? `
                <div class="section" style="margin-top: 40px; page-break-before: always;">
                    <h2>Análise de Padrões e Necessidades</h2>
                    ${data.interpretationSections.map((section: any) => `
                        <div class="advanced-section" style="margin-bottom: 30px; background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                            <h3 style="color: ${data.config?.primaryColor || '#2563eb'}; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">${section.title}</h3>
                            <div class="content" style="color: #334155; line-height: 1.8;">${section.content}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="footer">
                ${data.config?.reportFooter || 'PINC Mindsight - Análise de Perfil Comportamental'}
            </div>
        </body>
        </html>
        `;
    }
}
