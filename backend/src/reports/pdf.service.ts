
import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {


    async generateTalkingToPdf(formattedData: any): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] // Added disable-gpu for stability
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

    private generateTalkingToHtml(data: any): string {
        const { talkingToAnalysis: analysis, unifiedScores, radarData, userName, date } = data;

        // Helper to get color based on score/level
        const getColor = (score: number) => {
            if (score >= 65) return '#10b981'; // Green
            if (score <= 35) return '#ef4444'; // Red
            return '#8b5cf6'; // Purple default/middle
        };

        // Generative Radar SVG
        const generateRadarSvg = (radarData: any[]) => {
            const size = 300;
            const center = size / 2;
            const radius = 100;
            const angles = radarData.map((_, i) => (Math.PI * 2 * i) / radarData.length - Math.PI / 2);

            // Background Grid (5 levels)
            let gridSvg = '';
            for (let i = 1; i <= 5; i++) {
                const r = (radius / 5) * i;
                const points = angles.map(a => `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`).join(' ');
                gridSvg += `<polygon points="${points}" fill="none" stroke="#e5e7eb" stroke-width="1" />`;
            }

            // Data Path
            const dataPoints = radarData.map((d, i) => {
                const val = (d.A / 100) * radius;
                return `${center + val * Math.cos(angles[i])},${center + val * Math.sin(angles[i])}`;
            }).join(' ');

            // Labels
            const labelsSvg = radarData.map((d, i) => {
                const r = radius + 25;
                const x = center + r * Math.cos(angles[i]);
                const y = center + r * Math.sin(angles[i]);
                // Anchor adjustment based on position
                let anchor = 'middle';
                if (Math.abs(Math.cos(angles[i])) > 0.1) anchor = Math.cos(angles[i]) > 0 ? 'start' : 'end';

                return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="10" fill="#6b7280" font-family="Arial, sans-serif" font-weight="bold">${d.subject}</text>`;
            }).join('');

            return `
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${center}" cy="${center}" r="${radius}" fill="#f9fafb" />
                    ${gridSvg}
                    <polygon points="${dataPoints}" fill="rgba(139, 92, 246, 0.4)" stroke="#8b5cf6" stroke-width="2" />
                    ${radarData.map((d, i) => {
                const val = (d.A / 100) * radius;
                const cx = center + val * Math.cos(angles[i]);
                const cy = center + val * Math.sin(angles[i]);
                return `<circle cx="${cx}" cy="${cy}" r="3" fill="#8b5cf6" />`;
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
            <style>
                @page { margin: 0; size: A4; }
                body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; -webkit-print-color-adjust: exact; background: #fff; }
                
                .page { position: relative; width: 210mm; min-height: 297mm; padding: 40px; box-sizing: border-box; page-break-after: always; overflow: hidden; }
                .page:last-child { page-break-after: auto; }

                /* HERO COVER */
                .cover-bg { position: absolute; top:0; left:0; right:0; height: 350px; background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%); z-index: -1; border-bottom-right-radius: 100px; }
                .header-logo { color: white; font-weight: bold; font-size: 24px; margin-bottom: 40px; display: flex; align-items: center; gap: 10px; }
                .report-title { color: white; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9; margin-bottom: 15px; }
                .archetype-title { color: white; font-size: 48px; font-weight: 900; line-height: 1.1; margin: 0 0 20px 0; text-shadow: 0 4px 10px rgba(0,0,0,0.2); }
                .tags { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px; }
                .tag { background: rgba(255,255,255,0.2); color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid rgba(255,255,255,0.3); }
                
                .meta { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 20px; }

                /* EXECUTIVE SUMMARY & RADAR LAYOUT */
                .exec-container { display: flex; gap: 30px; margin-top: 60px; }
                .card { background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; }
                
                .radar-card { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fafafa; }
                .summary-card { flex: 1.5; }

                .section-title { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; }
                
                .list-group h4 { font-size: 12px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
                .list-group.strengths h4 { color: #059669; }
                .list-group.risks h4 { color: #d97706; }
                
                .bullet-list { list-style: none; padding: 0; margin: 0 0 20px 0; }
                .bullet-list li { position: relative; padding-left: 20px; font-size: 13px; line-height: 1.5; color: #4b5563; margin-bottom: 8px; }
                .bullet-list.s li::before { content: '✓'; color: #059669; position: absolute; left: 0; font-weight: bold; }
                .bullet-list.r li::before { content: '!'; color: #d97706; position: absolute; left: 4px; font-weight: bold; }

                /* DETAILED FEATURES */
                .feature-block { margin-top: 40px; page-break-inside: avoid; }
                .feature-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
                .feature-icon { width: 40px; height: 40px; background: #8b5cf6; border-radius: 10px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:18px; }
                .feature-name { font-size: 20px; font-weight: 800; color: #1f2937; }
                .feature-class { font-size: 12px; padding: 4px 10px; border-radius: 6px; font-weight: bold; text-transform: uppercase; }
                
                .feature-body { display: flex; gap: 25px; }
                .feature-text { flex: 2; font-size: 14px; line-height: 1.6; color: #374151; text-align: justify; }
                .feature-side { flex: 1; display: flex; flex-direction: column; gap: 10px; }
                
                .info-box { background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
                .info-box h5 { margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
                .info-box p { margin: 0; font-size: 12px; color: #4b5563; line-height: 1.4; }

                /* SCORES TABLE */
                .score-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                .score-table th { text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; text-transform: uppercase; font-size: 10px; }
                .score-table td { padding: 8px; border-bottom: 1px solid #f3f4f6; color: #1f2937; }
                .score-bar { height: 6px; background: #e5e7eb; border-radius: 3px; width: 100px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 8px; }
                .score-fill { height: 100%; background: #8b5cf6; }

                .footer { position: absolute; bottom: 20px; left: 40px; right: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #f3f4f6; padding-top: 10px; }
            </style>
        </head>
        <body>
            <!-- PAGE 1: CAPA & SUMMARY -->
            <div class="page">
                <div class="cover-bg"></div>
                
                <div class="header-logo">
                    <span>🧠</span> PINC Mindsight
                </div>

                <div style="margin-top: 40px; position: relative; z-index: 10;">
                    <div class="report-title">Relatório de Perfil Comportamental</div>
                    <h1 class="archetype-title">${analysis.profile_summary?.archetype_name || 'Seu Arquétipo'}</h1>
                    
                    <div class="tags">
                        ${(analysis.profile_summary?.dominant_traits || []).map((t: string) => `<div class="tag">${t}</div>`).join('')}
                    </div>

                    <div class="meta">
                        Este relatório foi gerado exclusivamente para <strong>${userName}</strong> em ${date}.
                    </div>
                </div>

                <div class="exec-container">
                    <div class="card radar-card">
                        <div class="section-title">Dimensional</div>
                        ${radarSvg}
                    </div>
                    
                    <div class="card summary-card">
                        <div class="section-title">Síntese Executiva</div>
                        
                        <div class="list-group strengths">
                            <h4>Potencializadores</h4>
                            <ul class="bullet-list s">
                                ${(analysis.executive_summary?.strengths || []).slice(0, 5).map((s: string) => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>

                        <div class="list-group risks">
                            <h4>Pontos de Atenção</h4>
                            <ul class="bullet-list r">
                                ${(analysis.executive_summary?.watch_outs || []).slice(0, 4).map((s: string) => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="footer">PINC Mindsight & TalkingTo Analysis Engine • ${date}</div>
            </div>

            <!-- PAGE 2: DETAILED BREAKDOWN -->
            <div class="page">
                <div class="section-title" style="margin-top:0;">Detalhamento Comportamental</div>
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 30px;">Análise profunda das 5 dimensões fundamentais que compõem sua personalidade.</p>

                ${analysis.talkingto_analysis?.map((item: any) => `
                    <div class="feature-block">
                        <div class="feature-header">
                            <div class="feature-icon">${item.dimension.charAt(0)}</div>
                            <div style="flex:1;">
                                <div class="feature-name">${item.dimension}</div>
                            </div>
                            <div class="feature-class" style="background: ${item.classification === 'ALTO' ? '#d1fae5' : item.classification === 'BAIXO' ? '#fee2e2' : '#e0e7ff'}; color: ${item.classification === 'ALTO' ? '#065f46' : item.classification === 'BAIXO' ? '#991b1b' : '#3730a3'};">
                                ${item.classification}
                            </div>
                        </div>
                        <div class="feature-body">
                            <div class="feature-text">
                                ${item.text_interpretation}
                            </div>
                            <div class="feature-side">
                                ${item.needs?.environment ? `
                                <div class="info-box">
                                    <h5>Ambiente Ideal</h5>
                                    <p>${item.needs.environment}</p>
                                </div>` : ''}
                                ${item.needs?.risk ? `
                                <div class="info-box" style="background:#fffcf5; border-color:#fef3c7;">
                                    <h5 style="color:#d97706;">Risco</h5>
                                    <p>${item.needs.risk}</p>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}

                <div class="footer">PINC Mindsight & TalkingTo Analysis Engine • ${date}</div>
            </div>
            
            <!-- PAGE 3: RAW DATA APPENDIX -->
            <div class="page">
                 <div class="section-title" style="margin-top:0;">Apêndice de Dados Analíticos</div>

                 <div class="card" style="margin-top:20px;">
                    <table class="score-table">
                        <thead>
                            <tr>
                                <th>Traço / Faceta</th>
                                <th style="text-align:right;">Score</th>
                                <th style="text-align:right;">Nível</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(unifiedScores).map((score: any) => `
                                <tr style="background:#f9fafb; font-weight:bold;">
                                    <td>${score.traitName}</td>
                                    <td style="text-align:right;">
                                        <div class="score-bar"><div class="score-fill" style="width:${score.normalizedScore}%"></div></div>
                                        ${score.normalizedScore}%
                                    </td>
                                    <td style="text-align:right;">${score.levelLabel}</td>
                                </tr>
                                ${(score.facets || []).map((f: any) => `
                                    <tr>
                                        <td style="padding-left: 20px; color: #6b7280;">• ${f.facetName}</td>
                                        <td style="text-align:right;">${f.score}%</td>
                                        <td style="text-align:right;">-</td>
                                    </tr>
                                `).join('')}
                            `).join('')}
                        </tbody>
                    </table>
                 </div>

                 <div class="footer">PINC Mindsight & TalkingTo Analysis Engine • ${date}</div>
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
