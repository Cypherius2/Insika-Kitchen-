import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DocumentItem {
  name: string;
  quantity: number;
  price: number;
}

interface DocumentData {
  type: 'QUOTATION' | 'INVOICE' | 'RECEIPT';
  number: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: DocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  businessName: string;
}

export const generatePDF = (data: DocumentData) => {
  const doc = new jsPDF();

  // Header Colors
  const accentColor = [0, 162, 255]; // MiraTech Blue

  // Business Info Header
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.businessName.toUpperCase(), 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('BUSINESS AUTOMATION OS', 15, 32);

  // Document Type Label
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(18);
  doc.text(data.type, 195, 25, { align: 'right' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text(`#${data.number}`, 195, 32, { align: 'right' });

  // Customer Info
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName, 15, 62);
  doc.text(data.customerEmail, 15, 68);

  // Date Info
  doc.setFont('helvetica', 'bold');
  doc.text('DATED:', 140, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, 140, 62);

  // Table
  autoTable(doc, {
    startY: 85,
    head: [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
    body: data.items.map(item => [
      item.name,
      item.quantity,
      `$${item.price.toFixed(2)}`,
      `$${(item.quantity * item.price).toFixed(2)}`
    ]),
    headStyles: {
      fillColor: [10, 10, 10],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      cellPadding: 5
    } as any,
    bodyStyles: {
      fontSize: 10,
      cellPadding: 5
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: 15, right: 15 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFont('helvetica', 'normal');
  doc.text('SUBTOTAL:', 140, finalY);
  doc.text(`$${data.subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });

  doc.text('TAX (15%):', 140, finalY + 7);
  doc.text(`$${data.tax.toFixed(2)}`, 195, finalY + 7, { align: 'right' });

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(135, finalY + 12, 65, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SETTLED:', 140, finalY + 20);
  doc.text(`$${data.total.toFixed(2)}`, 195, finalY + 20, { align: 'right' });

  // Footer
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Generated via MiraTech Business OS - Secure Distributed Ledger Sync', 105, 285, { align: 'center' });

  doc.save(`${data.type}_${data.number}.pdf`);
};
