import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateClientPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element #${elementId} not found`);
        return false;
    }

    try {
        // Scroll to top to ensure complete capture
        window.scrollTo(0, 0);

        // Aguarda carregamento de imagens/fontes
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = await html2canvas(element, {
            scale: 2, // Retina quality
            useCORS: true, // Allow loading remote images
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Primeira página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Páginas seguintes (se houver)
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${fileName}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return false;
    }
};
