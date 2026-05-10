import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const downloadReportAsPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Temporarily make it visible for html2canvas to capture it
  const originalTop = element.style.top;
  const originalLeft = element.style.left;
  const originalZIndex = element.style.zIndex;
  
  element.style.top = '0';
  element.style.left = '0';
  element.style.zIndex = '-9999';

  try {
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#FCFCFD' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  } finally {
    // Restore original hidden styles
    element.style.top = originalTop;
    element.style.left = originalLeft;
    element.style.zIndex = originalZIndex;
  }
};
