import React, { useState, useEffect } from 'react';
import api from '../../api/api'; // Import the api instance
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/InvoiceDetail.css'; // Import the CSS for styling
const InvoiceDetail = () => {
  const { id } = useParams(); // Access the invoice ID from the URL
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null); // Error state for handling errors
  const [includeGST, setIncludeGST] = useState(true); // GST toggle
  const [gstRate, setGstRate] = useState(18); // GST rate
  const [discount, setDiscount] = useState(0); // State for discount input
  const gstRates = [5, 12, 18, 28];
  useEffect(() => {
    // Fetch the invoice details using the ID from the URL
    api.get(`/api/invoices/${id}`) // Use api.js instance
      .then(response => {
        setInvoice(response.data);
        setError(null); // Reset error if data is received successfully
      })
      .catch(error => {
        setError("Failed to fetch invoice data. Please try again."); // Set error message
      });
  }, [id]);
  if (error) return <div className="error">{error}</div>; // Show error message if any
  if (!invoice) return <div className="loading">Loading...</div>; // Show loading until invoice data is available
  // Calculate amounts based on GST settings
  const calculateSubtotal = () => {
    return invoice.subtotal || invoice.total_amount || 0;
  };
  const calculateGSTAmount = () => {
    if (!includeGST) return 0;
    const subtotal = calculateSubtotal();
    return (subtotal * gstRate) / 100;
  };
  const discountAmount = parseFloat(discount) || (invoice.discount || 0);
  const gstAmount = invoice.gst_amount !== undefined ? invoice.gst_amount : calculateGSTAmount();
  const finalAmount = calculateSubtotal() + gstAmount - discountAmount;
  // Load GST data from invoice if available
  useEffect(() => {
    if (invoice) {
      if (invoice.include_gst !== undefined) {
        setIncludeGST(invoice.include_gst);
      }
      if (invoice.gst_rate !== undefined) {
        setGstRate(invoice.gst_rate);
      }
      if (invoice.discount !== undefined) {
        setDiscount(invoice.discount);
      }
    }
  }, [invoice]);
  // Function to handle printing the invoice
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    // Create a printable HTML content for the invoice
    printWindow.document.write('<html><head><title>Invoice Print</title>');
    // Add styles for the printed document
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2, h3 { text-align: center; }
        .invoice-info, .invoice-items-table { margin: 20px 0; }
        .invoice-items-table th, .invoice-items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .invoice-items-table { width: 100%; border-collapse: collapse; }
        .invoice-info div { margin-bottom: 10px; }
        img { display: block; margin: 0 auto; max-width: 150px; }
        .totals { text-align: right; margin-top: 20px; }
      </style>
    `);
    // Add company logo and details at the top
    printWindow.document.write('<body>');
    printWindow.document.write('<div style="text-align:center;">');
    printWindow.document.write(`<img src="http://localhost:5000/static/logo.jpg" alt="Company Logo" style="max-width: 150px; height:auto;" />`);
    printWindow.document.write('<h2>Construction Management Inc.</h2>');
    printWindow.document.write('<p>1234 Builder Lane, Construct City, ABC 56789</p>');
    printWindow.document.write('<p>Email: contact@construction.com | Phone: +1234567890</p>');
    printWindow.document.write('</div>');
    // Add invoice details
    printWindow.document.write('<h2>Invoice Detail</h2>');
    printWindow.document.write(`<div><strong>Customer:</strong> ${invoice.customer.toUpperCase() || "N/A"}</div>`);
    printWindow.document.write(`<div><strong>Total Amount:</strong> ₹${invoice.total_amount || "0"}</div>`);
    printWindow.document.write(`<div><strong>Date:</strong> ${invoice.date ? new Date(invoice.date).toLocaleDateString() : "N/A"}</div>`);
    // Print items
    printWindow.document.write('<h3>Invoice Items</h3>');
    printWindow.document.write('<table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>Description</th><th>Quantity</th><th>Rate</th><th>Total</th></tr></thead><tbody>');
    invoice.items.forEach(item => {
      printWindow.document.write(`<tr><td>${item.description.toUpperCase()}</td><td>${item.quantity}</td><td>₹${item.rate}</td><td>₹${item.total}</td></tr>`);
    });
    printWindow.document.write('</tbody></table>');
    // Add subtotal, GST and discount details
    printWindow.document.write('<div class="totals" style="margin-top: 20px; border-top: 2px solid #ddd; padding-top: 10px;">');
    printWindow.document.write(`<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><strong>Subtotal:</strong> <span>₹${calculateSubtotal().toFixed(2)}</span></div>`);
    if (includeGST) {
      printWindow.document.write(`<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><strong>GST (${gstRate}%):</strong> <span>₹${gstAmount.toFixed(2)}</span></div>`);
    }
    if (discountAmount > 0) {
      printWindow.document.write(`<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><strong>Discount:</strong> <span>-₹${discountAmount.toFixed(2)}</span></div>`);
    }
    printWindow.document.write(`<div style="display: flex; justify-content: space-between; margin-top: 10px; font-weight: bold; font-size: 16px;"><strong>Grand Total:</strong> <span>₹${finalAmount.toFixed(2)}</span></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    // Trigger the print dialog
    printWindow.print();
  };
  return (
    <div className="invoice-detail">
      <h2 className="invoice-header">Invoice Detail</h2>
      <div className="invoice-info">
        <div>
          <strong>Customer:</strong> {invoice.customer.toUpperCase() || "N/A"}
        </div>
        <div>
          <strong>Date:</strong> {invoice.date ? new Date(invoice.date).toLocaleDateString() : "N/A"}
        </div>
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeGST}
                onChange={(e) => setIncludeGST(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span><strong>Include GST (Goods and Services Tax)</strong></span>
            </label>
          </div>
          {includeGST && (
            <div>
              <label><strong>GST Rate (%):</strong></label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value))}
                style={{ padding: '5px', marginTop: '5px', width: '100%' }}
              >
                {gstRates.map(rate => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ marginTop: '12px' }}>
            <label><strong>Discount (₹):</strong></label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              min="0"
              step="0.01"
              style={{ padding: '5px', marginTop: '5px', width: '100%' }}
            />
          </div>
        </div>
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f0e6ff',
          borderRadius: '5px',
          border: '1px solid #8b5cf6'
        }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Subtotal:</strong></span>
            <span>₹{calculateSubtotal().toFixed(2)}</span>
          </div>
          {includeGST && (
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>GST ({gstRate}%):</strong></span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>Discount:</strong></span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '2px solid #8b5cf6',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#8b5cf6'
          }}>
            <span>Grand Total:</span>
            <span>₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <h3 className="invoice-items-header">Invoice Items</h3>
      {Array.isArray(invoice.items) && invoice.items.length > 0 ? (
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td>{item.description.toUpperCase()}</td>
                <td>{item.quantity}</td>
                <td>₹{item.rate}</td>
                <td>₹{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No items available for this invoice.</div>
      )}
      <div className="invoice-buttons">
        {/* Print button */}
        <button onClick={handlePrint} className="print-btn">
          Print Invoice
        </button>
      </div>
    </div>
  );
};
export default InvoiceDetail;
