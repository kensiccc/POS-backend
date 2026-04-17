const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const p2p = require('pdf-to-printer');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/print', async (req, res) => {
  try {
    const { order, customerName, orderNum, subtotal, discount, discAmt, total, cash } = req.body;
    
    // Create a temporary PDF file path
    const pdfPath = path.join(__dirname, `receipt_${String(orderNum).replace('#', '')}_${Date.now()}.pdf`);
    
    // Create a PDF document sized for 80mm thermal receipt (80mm wide, auto height)
    const doc = new PDFDocument({ size: [227, 1000], margin: 10 }); // 227 points = 80mm, height 1000 for auto
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);
    
    // 80mm thermal receipt width: 80mm = ~226.77 PDF points at 72 DPI
    const receiptWidth = 207; // Leave some margin
    const startX = 10; // Since margin is 10
    
    // Helper to center text inside our receipt column
    const printCenter = (text, yOffset, size = 10, font = 'Courier') => {
      doc.font(font).fontSize(size).text(text, startX, yOffset, { width: receiptWidth, align: 'center' });
      return doc.y;
    };
    
    // Helper to do left/right aligned row in the receipt column
    const printRow = (leftTxt, rightTxt, yOffset, size = 10, isBold = false) => {
      doc.font(isBold ? 'Courier-Bold' : 'Courier').fontSize(size);
      doc.text(leftTxt, startX, yOffset, { width: receiptWidth, align: 'left', lineBreak: false });
      doc.text(rightTxt, startX, yOffset, { width: receiptWidth, align: 'right' });
      return doc.y;
    };
    
    const printDivider = (yOffset) => {
      doc.font('Courier').fontSize(10).text('-------------------------------------', startX, yOffset, { width: receiptWidth, align: 'center' });
      return doc.y;
    };

    let currentY = 100;

    // Draw a light grey bounding box to represent the thermal paper edges as requested for a demo
    // We estimate height based on standard limits, or we could calculate dynamically.
    const estimatedHeight = 350 + (order.length * 30);
    doc.rect(startX - 15, currentY - 20, receiptWidth + 30, estimatedHeight)
       .strokeColor('#e2e8f0')
       .stroke();
    
    doc.fillColor('#000000'); // Ensure text is black

    // Headers
    currentY = printCenter('HOUSE BLEND', currentY, 14, 'Courier-Bold');
    currentY = printCenter('Quality Coffee. Fresh Drinks.', currentY, 8);
    currentY = printCenter(new Date().toLocaleString('en-US'), currentY + 4, 8);
    
    currentY = printDivider(currentY + 10);
    
    currentY = printRow('Customer', customerName || 'Guest', currentY + 5, 10);
    currentY = printRow('Order', String(orderNum), currentY + 5, 10, true);
    
    currentY = printDivider(currentY + 5);
    
    currentY += 5;
    // Items
    if (order && order.length > 0) {
      order.forEach(o => {
        currentY = printRow(`${o.name} x${o.qty} [${o.size}]`, `P${(o.unitPrice * o.qty).toFixed(2)}`, currentY, 10, true);
        doc.font('Courier').fontSize(8).text(`${o.sugar} sugar - ${o.ice}`, startX, currentY, { width: receiptWidth, align: 'left' });
        currentY = doc.y + 8;
      });
    }
    
    currentY = printDivider(currentY - 2);
    
    currentY = printRow('Subtotal', `P${subtotal.toFixed(2)}`, currentY + 5, 10);
    if (discAmt > 0) {
      currentY = printRow(`Discount (${discount}%)`, `-P${discAmt.toFixed(2)}`, currentY + 5, 10);
    }
    currentY = printRow('TOTAL', `P${total.toFixed(2)}`, currentY + 5, 12, true);
    
    currentY = printDivider(currentY + 5);
    
    currentY = printRow('Cash', `P${cash.toFixed(2)}`, currentY + 5, 10);
    currentY = printRow('Change', `P${(cash - total).toFixed(2)}`, currentY + 5, 10, true);
    
    currentY += 15;
    currentY = printCenter('Thank you! Please come again.', currentY, 10, 'Courier-Bold');
    
    doc.end();
    
    // Wait for the file stream to finish writing
    writeStream.on('finish', () => {
      // Print the generated PDF to the default system printer silently
      p2p.print(pdfPath).then(() => {
        console.log(`Print job dispatched successfully for Order ${orderNum}`);
        res.json({ success: true, message: 'Printed successfully!' });
      }).catch(err => {
        console.error("Print Error:", err);
        res.status(500).json({ success: false, error: err.message });
      });
    });
    
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🖨️  PDF Print Spooler running on http://localhost:${PORT}`);
  console.log(`   Waiting for print jobs from the POS frontend...`);
});
