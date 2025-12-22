const fs = require('fs');
const content = fs.readFileSync('backend/src/reports/pdf.service.ts', 'utf-8');

const anchor = "<p>${trait.interpretation || 'Sem interpretação disponível.'}</p>";
const injection = `${trait.interpretation || 'Sem interpretação disponível.'}</p>
                ${trait.customTexts ? `
                    <div style="margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        ${trait.customTexts.summary ? `<p style="margin-bottom:10px; color:#1e293b;"><strong>📝 Resumo:</strong> ${trait.customTexts.summary}</p>` : ''}
                        
                        ${trait.customTexts.practicalImpact && trait.customTexts.practicalImpact.length > 0 ? `
                            <div style="margin-top: 10px;">
                                <strong style="color:#0f172a;">💼 Impacto Prático:</strong>
                                <ul style="margin: 5px 0; padding-left: 20px; color:#334155;">
                                    ${trait.customTexts.practicalImpact.map((p: any) => `<li>${p.context ? `<b>${p.context}:</b> ` : ''}${p.text}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${trait.customTexts.expertSynthesis ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;"><strong style="color:#4f46e5;">🧠 Síntese (Especialista):</strong> <span style="color:#334155;">${trait.customTexts.expertSynthesis}</span></div>` : ''}
                        
                        ${trait.customTexts.expertHypothesis && trait.customTexts.expertHypothesis.length > 0 ? `
                            <div style="margin-top: 10px;">
                                <strong style="color:#b91c1c;">⚠️ Hipóteses:</strong>
                                <ul style="margin: 5px 0; padding-left: 20px; color:#451a03;">
                                    ${trait.customTexts.expertHypothesis.map((h: any) => `<li>${h.type ? `<b>${h.type}:</b> ` : ''}${h.text}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}`;

// Escape backticks for replace logic if needed, but template literal handles it in JS runtime
if (content.includes(anchor) && !content.includes('customTexts?')) {
    const newContent = content.replace(anchor, injection);
    fs.writeFileSync('backend/src/reports/pdf.service.ts', newContent);
    console.log('PDF Service updated');
} else {
    console.log('Already updated or anchor not found');
}
