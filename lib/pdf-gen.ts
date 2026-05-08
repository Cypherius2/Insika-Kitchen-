import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFData {
  documentNumber: string;
  type: string;
  customer: any;
  items: any[];
  subtotal: number;
  vat: number;
  totalAmount: number;
  businessName: string;
  brandColor: string;
  logoUrl?: string;
}

export async function generateDocumentPDF(data: PDFData): Promise<string> {
  const doc = new jsPDF() as any;
  const { 
    documentNumber, 
    type, 
    customer, 
    items, 
    subtotal, 
    vat, 
    totalAmount, 
    businessName,
    brandColor 
  } = data;

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [122, 43, 34]; // default red
  };

  const rgb = hexToRgb(brandColor);

  // Header
  doc.setFontSize(24);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text(businessName.toUpperCase(), 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Home of Fresh Bakes & Culinary Excellence', 14, 32);

  // Document Info
  doc.setFontSize(18);
  doc.setTextColor(50, 50, 50);
  const typeLabel = type.toUpperCase();
  doc.text(`${typeLabel} #${documentNumber}`, 200, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 200, 32, { align: 'right' });

  // Bill To
  doc.setFontSize(12);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text('BILL TO:', 14, 50);
  
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(customer?.name || 'Walk-in Customer', 14, 57);
  if (customer?.phone) doc.text(`Phone: ${customer.phone}`, 14, 64);
  if (customer?.email) doc.text(`Email: ${customer.email}`, 14, 71);

  // Table
  const tableData = items.map(item => [
    item.name,
    item.quantity.toString(),
    `E ${item.price.toFixed(2)}`,
    `E ${(item.price * item.quantity).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Description', 'Qty', 'Price', 'Amount']],
    body: tableData,
    headStyles: { 
      fillColor: rgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 6
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(11);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`E ${subtotal.toFixed(2)}`, 200, finalY, { align: 'right' });
  
  doc.text('VAT:', 140, finalY + 7);
  doc.text(`E ${vat.toFixed(2)}`, 200, finalY + 7, { align: 'right' });

  doc.setFontSize(14);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text('TOTAL:', 140, finalY + 15);
  doc.text(`E ${totalAmount.toFixed(2)}`, 200, finalY + 15, { align: 'right' });

  // Footer
  doc.setFontSize(12);
  doc.text('Thank you for your business!', 105, 270, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Eat Fresh, Stay Happy', 105, 277, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}
