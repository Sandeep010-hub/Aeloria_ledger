import PDFDocument from 'pdfkit';

/**
 * Generate a PDF invoice or quotation and write it directly to an Express response stream
 * @param {Object} documentData - The invoice or quotation object
 * @param {Object} clientData - The associated client details
 * @param {Object} companyDetails - The user's company settings/details
 * @param {String} type - 'invoice' or 'quotation'
 * @param {Object} res - The Express response object to stream to
 */
export const generateFinancialPDF = (documentData, clientData, companyDetails, type = 'invoice', res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream directly to response
  doc.pipe(res);

  const title = type.toUpperCase();
  const docNumber = type === 'invoice' ? documentData.invoiceNumber : documentData.quotationNumber;
  const docDate = new Date(documentData.date).toLocaleDateString();
  const docDueDate = type === 'invoice' 
    ? new Date(documentData.dueDate).toLocaleDateString()
    : new Date(documentData.expiryDate).toLocaleDateString();

  // ==========================================
  // HEADER
  // ==========================================
  doc.fillColor('#0A192F') // Deep Navy
     .fontSize(22)
     .font('Helvetica-Bold')
     .text(companyDetails.companyName || 'Aeloria Ledger', 50, 50);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#515F78')
     .text(companyDetails.address || 'Operations HQ', 50, 75)
     .text(`Phone: ${companyDetails.phone || '+1 555-0199'}`, 50, 90)
     .text(`GSTIN: ${companyDetails.gstNumber || 'N/A'}`, 50, 105);

  // Document Title Banner on the top-right
  doc.fillColor('#00696F') // Teal/Cyan Accent
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(title, 400, 50, { align: 'right' });

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#191C1E')
     .text(`${title} #:`, 350, 75, { width: 100, align: 'right' })
     .font('Helvetica')
     .text(docNumber, 450, 75, { width: 90, align: 'right' })
     
     .font('Helvetica-Bold')
     .text('Date:', 350, 90, { width: 100, align: 'right' })
     .font('Helvetica')
     .text(docDate, 450, 90, { width: 90, align: 'right' })

     .font('Helvetica-Bold')
     .text(type === 'invoice' ? 'Due Date:' : 'Expires:', 350, 105, { width: 100, align: 'right' })
     .font('Helvetica')
     .text(docDueDate, 450, 105, { width: 90, align: 'right' });

  // Divider Line
  doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#E2E8F0').stroke();

  // ==========================================
  // CLIENT DETAILS
  // ==========================================
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#0A192F')
     .text('BILLED TO:', 50, 150);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#191C1E')
     .text(clientData.name, 50, 168)
     .text(clientData.companyName || '', 50, 182)
     .text(clientData.address || '', 50, 196)
     .text(`Email: ${clientData.email}`, 50, 210)
     .text(`GSTIN: ${clientData.gstNumber || 'N/A'}`, 50, 224);

  // ==========================================
  // TABLE OF ITEMS
  // ==========================================
  let tableTop = 260;

  // Header Row
  doc.rect(50, tableTop, 495, 20).fill('#0A192F');
  
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#FFFFFF')
     .text('DESCRIPTION', 60, tableTop + 5)
     .text('QTY', 330, tableTop + 5, { width: 40, align: 'center' })
     .text('RATE', 380, tableTop + 5, { width: 60, align: 'right' })
     .text('AMOUNT', 460, tableTop + 5, { width: 75, align: 'right' });

  let rowY = tableTop + 20;

  doc.fillColor('#191C1E').font('Helvetica');

  // Loop Items
  const items = documentData.items || [];
  items.forEach((item, index) => {
    // Alternating row background for clean legibility
    if (index % 2 !== 0) {
      doc.rect(50, rowY, 495, 20).fill('#F7F9FB');
    }
    
    doc.fillColor('#191C1E')
       .text(item.description, 60, rowY + 5, { width: 260, height: 12, ellipsis: true })
       .text(item.quantity.toString(), 330, rowY + 5, { width: 40, align: 'center' })
       .text(item.rate.toFixed(2), 380, rowY + 5, { width: 60, align: 'right' })
       .text(item.amount.toFixed(2), 460, rowY + 5, { width: 75, align: 'right' });

    rowY += 20;
  });

  // Table bottom divider line
  doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor('#E2E8F0').stroke();

  // ==========================================
  // SUMMARY CALCULATIONS
  // ==========================================
  let summaryY = rowY + 15;

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Subtotal:', 340, summaryY, { width: 100, align: 'right' })
     .font('Helvetica')
     .text(documentData.subtotal.toFixed(2), 450, summaryY, { width: 85, align: 'right' });

  summaryY += 15;

  if (documentData.gst > 0) {
    const taxAmt = documentData.subtotal * (documentData.gst / 100);
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`GST (${documentData.gst}%):`, 340, summaryY, { width: 100, align: 'right' })
       .font('Helvetica')
       .text(taxAmt.toFixed(2), 450, summaryY, { width: 85, align: 'right' });
    summaryY += 15;
  }

  if (documentData.discount > 0) {
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`Discount:`, 340, summaryY, { width: 100, align: 'right' })
       .font('Helvetica')
       .text(`-${documentData.discount.toFixed(2)}`, 450, summaryY, { width: 85, align: 'right' });
    summaryY += 15;
  }

  // Final Total Banner
  doc.rect(340, summaryY, 205, 25).fill('#00696F');
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#FFFFFF')
     .text('Total Amount:', 350, summaryY + 7, { width: 90, align: 'left' })
     .text(`${companyDetails.currency || 'USD'} $${documentData.total.toFixed(2)}`, 440, summaryY + 7, { width: 95, align: 'right' });

  // Notes
  if (documentData.notes) {
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#0A192F')
       .text('Notes / Instructions:', 50, rowY + 15)
       .font('Helvetica')
       .fillColor('#515F78')
       .text(documentData.notes, 50, rowY + 30, { width: 280 });
  }

  // ==========================================
  // FOOTER
  // ==========================================
  doc.moveTo(50, 750).lineTo(545, 750).strokeColor('#E2E8F0').stroke();

  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#0A192F')
     .text('Thank you for choosing Aeloria Ledger.', 50, 760, { align: 'center' })
     .fontSize(8)
     .font('Helvetica')
     .fillColor('#6A7A7B')
     .text('This is a computer-generated transaction record powered by Aeloria Ledger.', 50, 775, { align: 'center' });

  // Finalize
  doc.end();
};
