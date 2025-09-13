import React, { useState, useRef } from 'react';
import { FaTimes, FaPrint, FaDownload, FaPalette } from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function BillPreview({
    isOpen,
    onClose,
    billData,
    businessData,
    userData,
    onCreateNew,
    onConfirmAndSave,
    submitting = false
}) {
    const [selectedTheme, setSelectedTheme] = useState('premium');
    const [isDownloading, setIsDownloading] = useState(false);
    const previewRef = useRef(null);

    if (!isOpen || !billData) return null;

    const themes = [
        { id: 'premium', name: 'Premium', isNew: true },
        { id: 'thermal', name: 'Thermal' },
        { id: 'basic', name: 'Basic' }
    ];

    // Calculate totals
    const subtotal = billData.products?.reduce((sum, product) => {
        return sum + (product.quantity * product.price);
    }, 0) || 0;

    const totalCharges = billData.additionalCharges?.reduce((sum, charge) => {
        return sum + (parseFloat(charge.amount) || 0);
    }, 0) || 0;

    const totalDiscounts = billData.additionalDiscounts?.reduce((sum, discount) => {
        return sum + (parseFloat(discount.amount) || 0);
    }, 0) || 0;

    const finalTotal = subtotal + totalCharges - totalDiscounts;

    // Format currency
    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    // Convert number to words
    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
        return num.toString();
    };

    const amountInWords = numberToWords(Math.floor(finalTotal)) + ' rupees only';

    // Download as PDF
    const downloadPDF = async () => {
        if (!previewRef.current) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${billData.billNumber || 'bill'}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    // Print function
    const handlePrint = () => {
        if (!previewRef.current) return;

        const printWindow = window.open('', '_blank');
        const printContent = previewRef.current.innerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Bill</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .bill-preview { max-width: 800px; margin: 0 auto; }
                        @media print {
                            body { margin: 0; padding: 0; }
                            .bill-preview { max-width: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="bill-preview">${printContent}</div>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    // Share via WhatsApp
    const shareWhatsApp = () => {
        const text = `Invoice #${billData.billNumber}\nFrom: ${businessData?.name || 'Business'}\nTo: ${billData.parties?.name || 'Customer'}\nAmount: ${formatCurrency(finalTotal)}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Render different themes
    const renderPremiumTheme = () => (
        <div className="bill-theme-premium">
            <div className="bill-header">
                <div className="business-info">
                    <div className="business-logo">
                        {businessData?.logo_url ? (
                            <img src={`http://localhost:5000${businessData.logo_url}`} alt="Logo" />
                        ) : (
                            <div className="logo-placeholder">{businessData?.business_name?.charAt(0) || 'B'}</div>
                        )}
                    </div>
                    <div className="business-details">
                        <h2>{businessData?.business_name || 'Business Name'}</h2>
                        <p>Phone: {userData?.phone || 'N/A'}</p>
                    </div>
                </div>
                <div className="invoice-info">
                    <h3>Invoice No. {billData.billNumber || 'NEW'}</h3>
                    <p>Invoice Date: {billData.date ? new Date(billData.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="bill-to-section">
                <h4>Bill and Ship To</h4>
                <div className="customer-info">
                    <p><strong>{billData.parties?.name || 'Customer'}</strong></p>
                    <p>Phone: {billData.parties?.phone || 'N/A'}</p>
                    {billData.parties?.address && <p>{billData.parties.address}</p>}
                    {billData.parties?.gst_number && <p>GSTIN: {billData.parties.gst_number}</p>}
                </div>
            </div>

            <div className="payment-status">
                {billData.method === 'cash' || billData.method === 'online' ? (
                    <div className="paid-badge">
                        <span className="paid-text">PAID</span>
                        <div className="total-amount">
                            <span className="amount">{formatCurrency(finalTotal)}</span>
                            <p>{amountInWords}</p>
                        </div>
                    </div>
                ) : (
                    <div className="unpaid-badge">
                        <span className="unpaid-text">UNPAID</span>
                        <div className="balance-due">
                            <span className="amount">{formatCurrency(billData.balanceDue || finalTotal)}</span>
                            <p>{amountInWords}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="items-table">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item Details</th>
                            <th>Price/Unit</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billData.products?.map((product, index) => (
                            <tr key={index}>
                                <td>{String(index + 1).padStart(2, '0')}</td>
                                <td>{product.name}</td>
                                <td>{formatCurrency(product.price)}/{product.unit || 'PCS'}</td>
                                <td>{product.quantity}</td>
                                <td>{formatCurrency(product.price)}</td>
                                <td>{formatCurrency(product.quantity * product.price)}</td>
                            </tr>
                        ))}
                        <tr className="subtotal-row">
                            <td colSpan="5"><strong>Sub-total Amount</strong></td>
                            <td><strong>{formatCurrency(subtotal)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {billData.terms && billData.terms.length > 0 && (
                <div className="terms-section">
                    <h4>Terms & conditions</h4>
                    <ol>
                        {billData.terms.map((term, index) => (
                            <li key={index}>{term}</li>
                        ))}
                    </ol>
                </div>
            )}

            <div className="total-section">
                <div className="total-amount-final">
                    <span className="label">Total amount</span>
                    <span className="amount">{formatCurrency(finalTotal)}</span>
                    <p>{amountInWords}</p>
                </div>
            </div>

            <div className="footer">
                <p>~ THIS IS A DIGITALLY CREATED INVOICE ~</p>
                <p>AUTHORISED SIGNATURE</p>
                <p>Thank you for the business.</p>
            </div>
        </div>
    );

    const renderThermalTheme = () => (
        <div className="bill-theme-thermal">
            <div className="thermal-header">
                <h3>{businessData?.business_name || 'Business Name'}</h3>
                <p>Phone: {userData?.phone || 'N/A'}</p>
                <div className="divider"></div>
            </div>

            <div className="thermal-bill-info">
                <p><strong>Original • #{billData.type === 'sale' ? 'Sale' : 'Purchase'} Bill no. {billData.billNumber}</strong></p>
                <p>Date: {billData.date ? new Date(billData.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>

            <div className="thermal-customer">
                <div className="customer-box">
                    <p><strong>BILL TO</strong></p>
                    <p>{billData.parties?.name || 'Customer'}</p>
                    <p>Phone: {billData.parties?.phone || 'N/A'}</p>
                </div>
            </div>

            <div className="thermal-items">
                <table>
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>ITEMS</th>
                            <th>QTY</th>
                            <th>RATE</th>
                            <th>DISC.</th>
                            <th>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billData.products?.map((product, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{product.name}</td>
                                <td>{product.quantity} {product.unit || 'KGS'}</td>
                                <td>{formatCurrency(product.price).replace('₹', '')}</td>
                                <td>0.00</td>
                                <td>{formatCurrency(product.quantity * product.price).replace('₹', '')}</td>
                            </tr>
                        ))}
                        <tr className="subtotal">
                            <td colSpan="5"><em>Subtotal</em></td>
                            <td><strong>{formatCurrency(subtotal).replace('₹', '')}</strong></td>
                        </tr>
                        <tr className="roundoff">
                            <td colSpan="5"><em>Round Off</em></td>
                            <td>-</td>
                        </tr>
                        <tr className="total">
                            <td colSpan="5"><strong>TOTAL</strong></td>
                            <td><strong>{formatCurrency(finalTotal).replace('₹', '')}</strong></td>
                        </tr>
                        <tr className="received">
                            <td colSpan="5"><strong>RECEIVED AMOUNT</strong></td>
                            <td><strong>{billData.method === 'unpaid' ? '0.00' : formatCurrency(finalTotal).replace('₹', '')}</strong></td>
                        </tr>
                        <tr className="balance">
                            <td colSpan="5"><strong>INVOICE BALANCE</strong></td>
                            <td><strong>{billData.method === 'unpaid' ? formatCurrency(billData.balanceDue || finalTotal).replace('₹', '') : '0.00'}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="thermal-amount-words">
                <p><strong>TOTAL AMOUNT IN WORDS</strong></p>
                <p>{amountInWords}</p>
            </div>

            {billData.terms && billData.terms.length > 0 && (
                <div className="thermal-terms">
                    <p><strong>TERMS & CONDITIONS</strong></p>
                    {billData.terms.map((term, index) => (
                        <p key={index}>{index + 1}. {term}</p>
                    ))}
                </div>
            )}
        </div>
    );

    const renderBasicTheme = () => (
        <div className="bill-theme-basic">
            <div className="basic-header">
                <h2>{businessData?.business_name || 'Business Name'}</h2>
                <p>PHONE: {userData?.phone || 'N/A'}</p>
                <div className="dots-line">...................................................................</div>
            </div>

            <div className="basic-customer">
                <p><strong>BILL AND SHIP TO</strong></p>
                <p>{billData.parties?.name || 'Customer'}</p>
                <p>Phone: {billData.parties?.phone || 'N/A'}</p>
                {billData.parties?.gst_number && <p><em>GSTIN:</em></p>}
                <div className="dots-line">...................................................................</div>
                <div className="bill-type">
                    <p>{billData.type === 'sale' ? 'Sale' : 'Purchase'} Bill</p>
                    <p>Invoice No.{billData.billNumber}</p>
                    <p>Invoice Date: {billData.date ? new Date(billData.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>
                <div className="dots-line">...................................................................</div>
            </div>

            <div className="basic-items">
                <div className="items-header">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Amount</span>
                </div>
                <div className="dots-line">...................................................................</div>

                {billData.products?.map((product, index) => (
                    <div key={index} className="item-row">
                        <div className="item-name">{product.name}</div>
                        <div className="item-details">
                            <span>{product.quantity}.0</span>
                            <span>₹{(product.quantity * product.price).toFixed(0)}</span>
                        </div>
                    </div>
                ))}

                <div className="totals-section">
                    <div className="total-line">
                        <span>Item Total ₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div className="total-line">
                        <span>Net Amount ₹{finalTotal.toFixed(0)}</span>
                    </div>
                    <div className="dots-line">...................................................................</div>
                    <div className="final-total">
                        <span>RECEIVED ₹{billData.method === 'unpaid' ? '0' : finalTotal.toFixed(0)}</span>
                    </div>
                    <div className="balance">
                        <span>Balance {billData.method === 'unpaid' ? formatCurrency(billData.balanceDue || finalTotal).replace('₹', '₹') : '₹0.00'}</span>
                    </div>
                    <div className="dots-line">...................................................................</div>
                </div>
            </div>

            {billData.terms && billData.terms.length > 0 && (
                <div className="basic-terms">
                    <p><strong>TERMS & CONDITIONS</strong></p>
                    {billData.terms.map((term, index) => (
                        <p key={index}>{index + 1}. {term}</p>
                    ))}
                    <div className="dots-line">...................................................................</div>
                </div>
            )}
        </div>
    );

    const renderBillContent = () => {
        switch (selectedTheme) {
            case 'premium':
                return renderPremiumTheme();
            case 'thermal':
                return renderThermalTheme();
            case 'basic':
                return renderBasicTheme();
            default:
                return renderPremiumTheme();
        }
    };

    return (
        <div className="bill-preview-overlay">
            <div className="bill-preview-modal">
                <div className="bill-preview-header">
                    <h3>Invoice #{billData.billNumber || 'NEW'}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="bill-preview-content">
                    <div className="bill-preview-container" ref={previewRef}>
                        {renderBillContent()}
                    </div>
                </div>

                <div className="bill-preview-actions">
                    <div className="theme-selector">
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                className={`theme-btn ${selectedTheme === theme.id ? 'active' : ''}`}
                                onClick={() => setSelectedTheme(theme.id)}
                            >
                                {theme.isNew && <span className="new-badge">New</span>}
                                {theme.name}
                            </button>
                        ))}
                    </div>

                    <div className="action-buttons">
                        <button className="action-btn print-btn" onClick={handlePrint}>
                            <FaPrint />
                            Print
                        </button>
                        <button className="action-btn theme-btn">
                            <FaPalette />
                            Theme
                        </button>
                        <button
                            className="action-btn download-btn"
                            onClick={downloadPDF}
                            disabled={isDownloading}
                        >
                            <FaDownload />
                            {isDownloading ? 'Downloading...' : 'Download Invoice'}
                        </button>
                        <button className="action-btn share-btn" onClick={shareWhatsApp}>
                            <FaWhatsapp />
                            Share on WhatsApp
                        </button>
                    </div>

                    <div className="bottom-actions">
                        {onConfirmAndSave ? (
                            <>
                                <button
                                    className="create-new-btn"
                                    onClick={onCreateNew}
                                    disabled={submitting}
                                >
                                    CREATE NEW
                                </button>
                                <button
                                    className="done-btn"
                                    onClick={onConfirmAndSave}
                                    disabled={submitting}
                                >
                                    {submitting ? 'SAVING...' : 'SAVE & DONE'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="create-new-btn" onClick={onCreateNew}>
                                    CREATE NEW
                                </button>
                                <button className="done-btn" onClick={onClose}>
                                    DONE
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
