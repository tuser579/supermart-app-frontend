import { Order } from '../types/order.types';
import { User } from '../types/auth.types';
import { formatCurrency, formatDate } from './formatters';
import { Platform } from 'react-native';

export function generateReceiptHtml(order: Order, user?: User | null): string {
  const accountId = user?.id || order.userId || 'N/A';
  const accountName = user?.name || order.user?.name || order.deliveryAddress?.fullName || 'Valued Customer';
  const accountEmail = user?.email || order.user?.email || 'customer@supermart.com';
  const accountPhone = user?.phone || order.user?.phone || order.deliveryAddress?.phone || 'N/A';

  const recipientName = order.deliveryAddress?.fullName || accountName;
  const recipientPhone = order.deliveryAddress?.phone || accountPhone;
  const addressLine1 = order.deliveryAddress?.addressLine1 || 'Delivery Address';
  const areaCity = `${order.deliveryAddress?.area || 'Dhaka'}, ${order.deliveryAddress?.city || 'Dhaka'}`;

  const orderItems = order.items || [];
  
  let originalSubtotal = 0;
  let discountedSubtotal = 0;

  const itemizedRows = orderItems.map((item, idx) => {
    const name = item.product?.name || item.productName || `Item #${idx + 1}`;
    const qty = item.quantity || 1;
    const prod = item.product as any;
    const itemPaidPrice = item.price ?? (item.subtotal ? item.subtotal / qty : 0);
    const prodRegPrice = prod?.price || prod?.originalPrice || itemPaidPrice;
    const prodDiscPrice = prod?.discountPrice ?? (itemPaidPrice < prodRegPrice ? itemPaidPrice : prodRegPrice);
    
    const regPrice = Math.max(prodRegPrice, itemPaidPrice);
    const discPrice = Math.min(prodDiscPrice, itemPaidPrice);
    const unitSavings = Math.max(0, regPrice - discPrice);
    
    const rowRegTotal = regPrice * qty;
    const rowDiscTotal = discPrice * qty;

    originalSubtotal += rowRegTotal;
    discountedSubtotal += rowDiscTotal;

    const hasDiscount = discPrice < regPrice;

    return `
      <tr>
        <td style="padding: 7px 8px; border-bottom: 1px solid #E5E7EB; text-align: center;">${idx + 1}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #E5E7EB;">
          <strong style="color: #1F2937;">${name}</strong>
        </td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #E5E7EB; text-align: center; font-weight: 700;">${qty}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #6B7280;">
          ${hasDiscount ? `<span style="text-decoration: line-through;">${formatCurrency(regPrice)}</span>` : `${formatCurrency(regPrice)}`}
        </td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 700; color: ${hasDiscount ? '#059669' : '#1F2937'};">
          ${formatCurrency(discPrice)}
        </td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #059669; font-weight: 700;">
          ${unitSavings > 0 ? `-${formatCurrency(unitSavings * qty)}` : '-'}
        </td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 800; color: #1F2937;">
          ${formatCurrency(rowDiscTotal)}
        </td>
      </tr>
    `;
  }).join('');

  const totalProductSavings = Math.max(0, originalSubtotal - discountedSubtotal);
  const effectiveSubtotal = discountedSubtotal > 0 ? discountedSubtotal : (order.totalAmount || 0);
  const deliveryFee = effectiveSubtotal >= 2000 ? 0 : 60;
  const finalTotal = order.grandTotal ?? order.totalAmount ?? (discountedSubtotal + deliveryFee);
  const invoiceNo = `REC-${(order.orderNumber || order.orderId || order.id).slice(-8).toUpperCase()}`;

  const orderDate = order.notes ? formatDate(new Date().toISOString()) : formatDate(new Date().toISOString());

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>SuperMart_Receipt_${(order.orderId || order.id).slice(-8).toUpperCase()}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          *, *:before, *:after {
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1F2937;
            font-size: 11.5px;
          }
          .receipt-box {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            border: 2.5px solid #10B981;
            border-radius: 12px;
            padding: 20px 22px;
            box-sizing: border-box;
            background-color: #FFFFFF;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .status-stamp-top {
            text-align: center;
            margin-bottom: 10px;
          }
          .paid-badge-center {
            display: inline-block;
            background-color: #ECFDF5;
            color: #059669;
            border: 2px solid #059669;
            font-size: 14px;
            font-weight: 900;
            padding: 4px 24px;
            border-radius: 18px;
            letter-spacing: 0.8px;
          }
          .header-table {
            width: 100%;
            margin-bottom: 14px;
            border-bottom: 1.5px solid #E5E7EB;
            padding-bottom: 10px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 900;
            color: #059669;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .brand-sub {
            font-size: 11px;
            color: #6B7280;
            margin-top: 2px;
          }
          .info-grid {
            width: 100%;
            margin-bottom: 14px;
          }
          .info-card {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 10px 14px;
          }
          .card-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
            border-bottom: 1px dashed #D1D5DB;
            padding-bottom: 4px;
          }
          .info-line {
            font-size: 11.5px;
            margin-bottom: 3px;
            line-height: 1.35;
          }
          .info-label {
            font-weight: 700;
            color: #4B5563;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
          }
          .items-table th {
            background-color: #ECFDF5;
            color: #047857;
            font-size: 10.5px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 7px 8px;
            border-bottom: 1.5px solid #A7F3D0;
          }
          .summary-table {
            width: 340px;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          .summary-table td {
            padding: 4px 0;
            font-size: 11.5px;
          }
          .total-row {
            font-size: 15px !important;
            font-weight: 900;
            color: #059669;
            border-top: 1.5px solid #059669;
            padding-top: 7px !important;
          }
          .footer-note {
            margin-top: 14px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
            padding-top: 8px;
            font-size: 10.5px;
            color: #9CA3AF;
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="status-stamp-top">
            <span class="paid-badge-center">✓ PAID & COMPLETED</span>
          </div>

          <table class="header-table">
            <tr>
              <td>
                <div class="brand-title">🛒 SUPERMART GROCERY</div>
                <div class="brand-sub">Official Digital Money Receipt & Tax Invoice</div>
              </td>
              <td style="text-align: right;">
                <div style="font-size: 11.5px; color: #4B5563;"><strong>Invoice No:</strong> ${invoiceNo}</div>
                <div style="font-size: 11.5px; color: #4B5563;"><strong>Order ID:</strong> ${order.orderId || order.id}</div>
                <div style="font-size: 11.5px; color: #4B5563;"><strong>Date:</strong> ${orderDate}</div>
              </td>
            </tr>
          </table>

          <table class="info-grid">
            <tr>
              <td style="width: 49%; vertical-align: top; padding-right: 1%;">
                <div class="info-card">
                  <div class="card-title">👤 Account Information</div>
                  <div class="info-line"><span class="info-label">Account ID:</span> ${accountId}</div>
                  <div class="info-line"><span class="info-label">Name:</span> ${accountName}</div>
                  <div class="info-line"><span class="info-label">Email:</span> ${accountEmail}</div>
                  <div class="info-line"><span class="info-label">Phone Number:</span> ${accountPhone}</div>
                </div>
              </td>
              <td style="width: 49%; vertical-align: top; padding-left: 1%;">
                <div class="info-card">
                  <div class="card-title">📍 Delivery Address</div>
                  <div class="info-line"><span class="info-label">Recipient:</span> ${recipientName}</div>
                  <div class="info-line"><span class="info-label">Phone:</span> ${recipientPhone}</div>
                  <div class="info-line"><span class="info-label">Address:</span> ${addressLine1}</div>
                  <div class="info-line"><span class="info-label">Area & City:</span> ${areaCity}</div>
                </div>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">#</th>
                <th style="text-align: left;">Product Item</th>
                <th style="width: 42px; text-align: center;">Qty</th>
                <th style="width: 85px; text-align: right;">Reg. Price</th>
                <th style="width: 90px; text-align: right;">Disc. Price</th>
                <th style="width: 80px; text-align: right;">Savings</th>
                <th style="width: 90px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemizedRows}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td>Items Regular Subtotal:</td>
              <td style="text-align: right; font-weight: 700;">${formatCurrency(originalSubtotal > 0 ? originalSubtotal : discountedSubtotal)}</td>
            </tr>
            ${totalProductSavings > 0 ? `
              <tr style="color: #059669;">
                <td>Total Product Savings:</td>
                <td style="text-align: right; font-weight: 700;">-${formatCurrency(totalProductSavings)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Delivery Charge:</td>
              <td style="text-align: right; font-weight: 700; color: ${deliveryFee === 0 ? '#059669' : '#1F2937'};">
                ${deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
              </td>
            </tr>
            <tr>
              <td>Payment Method:</td>
              <td style="text-align: right; font-weight: 700;">
                ${order.paymentMethod === 'BKASH' ? 'bKash Mobile Banking' :
                  order.paymentMethod === 'NOGOD' ? 'Nagad Mobile Banking' :
                  order.paymentMethod === 'ROCKET' ? 'Rocket Mobile Banking' :
                  order.paymentMethod === 'CARD' ? 'Credit / Debit Card' :
                  'Cash on Delivery (COD)'}
              </td>
            </tr>
            ${order.transactionId ? `
              <tr style="color: #059669;">
                <td>Transaction ID (TxnID):</td>
                <td style="text-align: right; font-weight: 800; font-family: monospace;">${order.transactionId}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>Total Amount Paid:</td>
              <td style="text-align: right;">${formatCurrency(finalTotal)}</td>
            </tr>
          </table>

          <div class="footer-note">
            Thank you for shopping with SuperMart Grocery! This is an official computer-generated Money Receipt.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function downloadReceiptPdf(order: Order, user?: User | null) {
  const html = generateReceiptHtml(order, user);
  const filename = `SuperMart_Receipt_${(order.orderId || order.id).slice(-8).toUpperCase()}.pdf`;

  if (Platform.OS === 'web') {
    // Generate real PDF file download on web using client-side html2pdf generator
    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    document.body.appendChild(element);

    const loadScript = (): Promise<any> => {
      return new Promise((resolve) => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve((window as any).html2pdf);
        script.onerror = () => resolve(null);
        document.body.appendChild(script);
      });
    };

    try {
      const html2pdf = await loadScript();
      if (html2pdf) {
        const target = element.querySelector('.receipt-box') || element;
        const opt = {
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };
        await html2pdf().set(opt).from(target).save();
        document.body.removeChild(element);
        return;
      }
    } catch (e) {
      console.warn('html2pdf download error, falling back to direct blob:', e);
    }

    // Direct Blob Fallback with .pdf filename
    const blob = new Blob([html], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  try {
    const Print = require('expo-print');
    const Sharing = require('expo-sharing');
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: filename });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

export async function printReceiptPdf(order: Order, user?: User | null) {
  const html = generateReceiptHtml(order, user);

  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    return;
  }

  try {
    const Print = require('expo-print');
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Error printing PDF:', error);
  }
}
