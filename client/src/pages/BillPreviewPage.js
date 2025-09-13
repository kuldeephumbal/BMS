import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaArrowLeft, FaPrint, FaDownload, FaPalette } from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function BillPreviewPage() {
    const navigate = useNavigate();
    const { type } = useParams(); // sale | purchase
    const location = useLocation();
    const billingType = ['sale', 'purchase'].includes(type) ? type : 'sale';

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [selectedTheme, setSelectedTheme] = useState('premium');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [billData, setBillData] = useState(null);
    const [businessData, setBusinessData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [nextBillNumber, setNextBillNumber] = useState(null);
    const previewRef = useRef(null);

    // user and business
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const token = localStorage.getItem('token');
    const activeBusinessId = localStorage.getItem('activeBusinessId');

    const fetchBusinessData = React.useCallback(async () => {
        try {
            const businessResponse = await axios.get(`http://localhost:5000/api/business/active/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBusinessData(businessResponse.data.business);
        } catch (err) {
            console.error('Error fetching business data:', err);
            toast.error('Error loading business data');
        }
    }, [user._id, token]);

    const fetchNextBillNumber = React.useCallback(async () => {
        try {
            console.log('Fetching next bill number with:', {
                businessId: activeBusinessId,
                type: billingType
            });

            const response = await axios.get(`http://localhost:5000/api/billing/next-number`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    businessId: activeBusinessId,
                    type: billingType
                }
            });

            console.log('Next bill number response:', response.data);
            setNextBillNumber(response.data.nextNumber);
        } catch (err) {
            console.error('Error fetching next bill number:', err);
            console.error('Error response:', err.response?.data);
            // If we can't fetch the next number, we'll show 'NEW'
            setNextBillNumber(null);
        }
    }, [token, activeBusinessId, billingType]);

    useEffect(() => {
        if (!token || !user._id) {
            navigate('/login');
            return;
        }
        if (!activeBusinessId) {
            navigate(`/billing/${billingType}`);
            return;
        }

        // Get bill data from location state
        if (location.state?.billData) {
            setBillData(location.state.billData);
            setUserData(user);

            // Fetch business data and next bill number
            fetchBusinessData();
            fetchNextBillNumber();
        } else {
            toast.error('No bill data provided');
            navigate(`/billing/${billingType}`);
        }
    }, [token, user, activeBusinessId, billingType, navigate, location.state, fetchBusinessData, fetchNextBillNumber]); const handleToggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isOpen: newState } }));
    };

    const handleBack = () => {
        navigate(`/billing/${billingType}/add`);
    };

    const themes = [
        { id: 'premium', name: 'Premium', isNew: true },
        { id: 'thermal', name: 'Thermal' },
        { id: 'basic', name: 'Basic' }
    ];

    // Calculate totals
    const subtotal = billData?.products?.reduce((sum, product) => {
        return sum + (product.quantity * product.price);
    }, 0) || 0;

    const totalCharges = billData?.additionalCharges?.reduce((sum, charge) => {
        return sum + (parseFloat(charge.amount) || 0);
    }, 0) || 0;

    const totalDiscounts = billData?.discount?.reduce((sum, discount) => {
        const value = parseFloat(discount.value) || 0;
        if (discount.type === 'percentage') {
            // Apply percentage to subtotal
            return sum + ((subtotal * value) / 100);
        }
        return sum + value;
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

    // Get display bill number (use actual bill number if exists, otherwise next bill number, otherwise 'NEW')
    const getDisplayBillNumber = () => {
        console.log('getDisplayBillNumber - billData.billNumber:', billData?.billNumber);
        console.log('getDisplayBillNumber - nextBillNumber:', nextBillNumber);

        if (billData?.billNumber) {
            return `#${billData.billNumber}`;
        }
        if (nextBillNumber) {
            return `#${nextBillNumber}`;
        }
        return 'NEW';
    };

    // Download as PDF
    const downloadPDF = async () => {
        if (!previewRef.current) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 1.2, // Reduced from 2 to 1.2 for smaller file size
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality instead of PNG
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Create filename with party name and date
            const partyName = (billData?.parties?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
            const billDate = billData?.date ? new Date(billData.date).toLocaleDateString('en-GB').replace(/\//g, '-') : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            const fileName = `${partyName}_${billDate}`;

            pdf.save(`${fileName}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error generating PDF');
        } finally {
            setIsDownloading(false);
        }
    };    // Print function
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
    const shareWhatsApp = async () => {
        if (isSharing) return; // Prevent multiple simultaneous shares

        try {
            setIsSharing(true);

            // First generate the PDF
            if (!previewRef.current) {
                toast.error('Unable to generate PDF for sharing');
                return;
            }

            toast.info('Generating PDF for WhatsApp sharing...');

            const canvas = await html2canvas(previewRef.current, {
                scale: 1.2, // Reduced from 2 to 1.2 for smaller file size
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality instead of PNG
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Generate filename and bill info
            const billNumber = getDisplayBillNumber();
            const partyName = (billData?.parties?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
            const billDate = billData?.date ? new Date(billData.date).toLocaleDateString('en-GB').replace(/\//g, '-') : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            const fileName = `${partyName}_${billDate}`;

            // Create the PDF blob
            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });

            // Try Web Share API first (works better on mobile)
            if (navigator.share && navigator.canShare) {
                try {
                    const shareData = {
                        title: `Invoice ${billNumber}`,
                        text: `Invoice ${billNumber}\nFrom: ${businessData?.business_name || 'Business'}\nTo: ${billData?.parties?.name || 'Customer'}\nAmount: ${formatCurrency(finalTotal)}`,
                        files: [pdfFile]
                    };

                    if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        toast.success('PDF shared successfully!');
                        return;
                    }
                } catch (shareError) {
                    console.log('Web Share API failed, falling back to download + WhatsApp:', shareError);
                }
            }

            // Fallback: Download PDF and open WhatsApp
            pdf.save(`${fileName}.pdf`);

            // Create WhatsApp message with instructions
            const text = `Invoice ${billNumber}\nFrom: ${businessData?.business_name || 'Business'}\nTo: ${billData?.parties?.name || 'Customer'}\nAmount: ${formatCurrency(finalTotal)}\n\nPDF has been downloaded. Please attach it manually to your WhatsApp message.`;

            // Open WhatsApp with the text message
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank');

            toast.success('PDF downloaded! You can now attach it to your WhatsApp message.');
        } catch (error) {
            console.error('Error sharing via WhatsApp:', error);
            toast.error('Error generating PDF for WhatsApp sharing');
        } finally {
            setIsSharing(false);
        }
    };

    // Save bill function
    const handleSaveAndDone = async () => {
        if (!billData) return;

        setSubmitting(true);
        try {
            const body = {
                userId: user._id,
                businessId: activeBusinessId,
                type: billingType,
                ...billData
            };

            await axios.post('http://localhost:5000/api/billing', body, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Billing created successfully');
            navigate(`/billing/${billingType}`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error creating billing';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateNew = () => {
        navigate(`/billing/${billingType}/add`);
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
                    <h3>Invoice No. {getDisplayBillNumber()}</h3>
                    <p>Invoice Date: {billData?.date ? new Date(billData.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="bill-to-section">
                <h4>Bill and Ship To</h4>
                <div className="customer-info">
                    <p><strong>{billData?.parties?.name || 'Customer'}</strong></p>
                    <p>Phone: {billData?.parties?.phone || 'N/A'}</p>
                    {billData?.parties?.address && <p>{billData.parties.address}</p>}
                    {billData?.parties?.gst_number && <p>GSTIN: {billData.parties.gst_number}</p>}
                </div>
            </div>

            <div className="payment-status">
                {billData?.method === 'cash' || billData?.method === 'online' ? (
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
                            <span className="amount">{formatCurrency(billData?.balanceDue || finalTotal)}</span>
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
                        {billData?.products?.map((product, index) => (
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
                        {billData?.additionalCharges && billData.additionalCharges.length > 0 &&
                            billData.additionalCharges.map((charge, index) => (
                                <tr key={`charge-${index}`} className="charge-row">
                                    <td colSpan="5">{charge.name}</td>
                                    <td>+{formatCurrency(charge.amount)}</td>
                                </tr>
                            ))
                        }
                        {billData?.discount && billData.discount.length > 0 &&
                            billData.discount.map((discount, index) => (
                                <tr key={`discount-${index}`} className="discount-row">
                                    <td colSpan="5">
                                        Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Amount'})
                                    </td>
                                    <td>
                                        -{formatCurrency(discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value)}
                                    </td>
                                </tr>
                            ))
                        }
                        <tr className="final-total-row">
                            <td colSpan="5"><strong>Final Total</strong></td>
                            <td><strong>{formatCurrency(finalTotal)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {billData?.optionalFields?.termsAndConditions && billData.optionalFields.termsAndConditions.length > 0 && (
                <div className="terms-section">
                    <h4>Terms & conditions</h4>
                    <ol>
                        {billData.optionalFields.termsAndConditions.map((term, index) => (
                            <li key={index}>{term.text || term}</li>
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
                <p><strong>Original • #{billData?.type === 'sale' ? 'Sale' : 'Purchase'} Bill no. {getDisplayBillNumber()}</strong></p>
                <p>Date: {billData?.date ? new Date(billData.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>

            <div className="thermal-customer">
                <div className="customer-box">
                    <p><strong>BILL TO</strong></p>
                    <p>{billData?.parties?.name || 'Customer'}</p>
                    <p>Phone: {billData?.parties?.phone || 'N/A'}</p>
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
                        {billData?.products?.map((product, index) => (
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
                        {billData?.additionalCharges && billData.additionalCharges.length > 0 &&
                            billData.additionalCharges.map((charge, index) => (
                                <tr key={`charge-${index}`} className="charges">
                                    <td colSpan="5"><em>{charge.name}</em></td>
                                    <td>+{formatCurrency(charge.amount).replace('₹', '')}</td>
                                </tr>
                            ))
                        }
                        {billData?.discount && billData.discount.length > 0 &&
                            billData.discount.map((discount, index) => (
                                <tr key={`discount-${index}`} className="discounts">
                                    <td colSpan="5">
                                        <em>Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Amount'})</em>
                                    </td>
                                    <td>
                                        -{formatCurrency(discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value).replace('₹', '')}
                                    </td>
                                </tr>
                            ))
                        }
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
                            <td><strong>{billData?.method === 'unpaid' ? '0.00' : formatCurrency(finalTotal).replace('₹', '')}</strong></td>
                        </tr>
                        <tr className="balance">
                            <td colSpan="5"><strong>INVOICE BALANCE</strong></td>
                            <td><strong>{billData?.method === 'unpaid' ? formatCurrency(billData?.balanceDue || finalTotal).replace('₹', '') : '0.00'}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="thermal-amount-words">
                <p><strong>TOTAL AMOUNT IN WORDS</strong></p>
                <p>{amountInWords}</p>
            </div>

            {billData?.optionalFields?.termsAndConditions && billData.optionalFields.termsAndConditions.length > 0 && (
                <div className="thermal-terms">
                    <p><strong>TERMS & CONDITIONS</strong></p>
                    {billData.optionalFields.termsAndConditions.map((term, index) => (
                        <p key={index}>{index + 1}. {term.text || term}</p>
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
                <p>{billData?.parties?.name || 'Customer'}</p>
                <p>Phone: {billData?.parties?.phone || 'N/A'}</p>
                {billData?.parties?.gst_number && <p><em>GSTIN:</em></p>}
                <div className="dots-line">...................................................................</div>
                <div className="bill-type">
                    <p>{billData?.type === 'sale' ? 'Sale' : 'Purchase'} Bill</p>
                    <p>Invoice No. {getDisplayBillNumber()}</p>
                    <p>Invoice Date: {billData?.date ? new Date(billData.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
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

                {billData?.products?.map((product, index) => (
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
                    {billData?.additionalCharges && billData.additionalCharges.length > 0 &&
                        billData.additionalCharges.map((charge, index) => (
                            <div key={`charge-${index}`} className="total-line">
                                <span>{charge.name} +₹{charge.amount.toFixed(0)}</span>
                            </div>
                        ))
                    }
                    {billData?.discount && billData.discount.length > 0 &&
                        billData.discount.map((discount, index) => (
                            <div key={`discount-${index}`} className="total-line">
                                <span>
                                    Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Amount'}) -₹
                                    {(discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value).toFixed(0)}
                                </span>
                            </div>
                        ))
                    }
                    <div className="total-line">
                        <span>Net Amount ₹{finalTotal.toFixed(0)}</span>
                    </div>
                    <div className="dots-line">...................................................................</div>
                    <div className="final-total">
                        <span>RECEIVED ₹{billData?.method === 'unpaid' ? '0' : finalTotal.toFixed(0)}</span>
                    </div>
                    <div className="balance">
                        <span>Balance {billData?.method === 'unpaid' ? formatCurrency(billData?.balanceDue || finalTotal).replace('₹', '₹') : '₹0.00'}</span>
                    </div>
                    <div className="dots-line">...................................................................</div>
                </div>
            </div>

            {billData?.optionalFields?.termsAndConditions && billData.optionalFields.termsAndConditions.length > 0 && (
                <div className="basic-terms">
                    <p><strong>TERMS & CONDITIONS</strong></p>
                    {billData.optionalFields.termsAndConditions.map((term, index) => (
                        <p key={index}>{index + 1}. {term.text || term}</p>
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

    if (!billData) {
        return (
            <div className="main-layout-root">
                <div className="main-layout-row">
                    <Sidebar open={sidebarOpen} />
                    <div className="main-content-container">
                        <Header onToggleSidebar={handleToggleSidebar} />
                        <main className="main-content">
                            <div style={{ textAlign: 'center', padding: 40 }}>Loading bill preview...</div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-layout-root">
            <div className="main-layout-row">
                <Sidebar open={sidebarOpen} />
                <div className="main-content-container">
                    <Header onToggleSidebar={handleToggleSidebar} />
                    <main className="main-content">
                        <div className="main-data-header-row">
                            <div className='d-flex align-items-center gap-3'>
                                <button
                                    className='btn-secondary-back'
                                    onClick={handleBack}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    <FaArrowLeft /> Back
                                </button>
                                <h2 className="main-data-page-title">
                                    Bill Preview - Invoice {getDisplayBillNumber()}
                                </h2>
                            </div>
                        </div>

                        <div className="bill-preview-page-container">
                            {/* Theme Selector and Action Buttons */}
                            <div className="theme-and-actions-row">
                                <div className="theme-selector-section">
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

                                <div className="action-buttons-section">
                                    <button className="action-btn print-btn" onClick={handlePrint}>
                                        <FaPrint />
                                    </button>
                                    <button className="action-btn theme-btn">
                                        <FaPalette />
                                    </button>
                                    <button
                                        className="action-btn download-btn"
                                        onClick={downloadPDF}
                                        disabled={isDownloading}
                                    >
                                        <FaDownload />
                                    </button>
                                    <button
                                        className="action-btn share-btn"
                                        onClick={shareWhatsApp}
                                        disabled={isSharing}
                                    >
                                        <FaWhatsapp />
                                    </button>
                                </div>
                            </div>

                            {/* Bill Preview */}
                            <div className="bill-preview-wrapper">
                                <div className="bill-preview-container" ref={previewRef}>
                                    {renderBillContent()}
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="bottom-actions-row">
                                <button
                                    className="create-new-btn"
                                    onClick={handleCreateNew}
                                    disabled={submitting}
                                >
                                    CREATE NEW
                                </button>
                                <button
                                    className="save-done-btn"
                                    onClick={handleSaveAndDone}
                                    disabled={submitting}
                                >
                                    {submitting ? 'SAVING...' : 'SAVE & DONE'}
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
