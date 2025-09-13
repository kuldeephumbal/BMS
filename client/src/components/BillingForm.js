import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';

export default function BillingForm({
    mode = 'create', // 'create' | 'edit'
    type = 'sale', // 'sale' | 'purchase'
    initialValues,
    onSubmit,
    onCancel,
    submitting = false,
    onAddParty, // Function to open add party modal
    onAddProduct, // Function to open add product modal
}) {
    const [values, setValues] = useState(() => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        return {
            parties: { id: '', name: '', phone: '' },
            products: [{ id: '', name: '', quantity: 1, price: 0 }],
            additionalCharges: [],
            discount: [],
            optionalFields: {
                customFields: [],
                partyAddress: { address: '', pincode: '', city: '', state: '' },
                shippingAddress: { address: '', pincode: '', city: '', state: '' },
                businessAddress: { address: '', pincode: '', city: '', state: '' },
                termsAndConditions: [],
            },
            note: '',
            photos: [],
            method: 'unpaid',
            date: today, // Set today's date as default
            dueDate: '',
            balanceDue: '',
            totalAmount: '',
            ...(initialValues || {}),
        };
    });

    const [showOptional, setShowOptional] = useState(false);
    const [error, setError] = useState('');
    const [invalidFields, setInvalidFields] = useState(new Set());

    // Handle field blur to validate
    const handleFieldBlur = (fieldName, value, isRequired = false) => {
        // Check if field is invalid
        const isInvalid = isRequired && (!value || value.toString().trim() === '');

        setInvalidFields(prev => {
            const newSet = new Set(prev);
            if (isInvalid) {
                newSet.add(fieldName);
            } else {
                newSet.delete(fieldName);
            }
            return newSet;
        });
    };

    // Handle field focus to remove invalid styling while typing
    const handleFieldFocus = (fieldName) => {
        setInvalidFields(prev => {
            const newSet = new Set(prev);
            newSet.delete(fieldName);
            return newSet;
        });
    };

    // Photo file handling state
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);

    // Shared terms state
    const [availableTerms, setAvailableTerms] = useState([]);
    const [termsLoading, setTermsLoading] = useState(false);
    const [newTermText, setNewTermText] = useState('');
    const [addingTerm, setAddingTerm] = useState(false);

    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const token = useMemo(() => localStorage.getItem('token') || '', []);
    const activeBusinessId = useMemo(() => localStorage.getItem('activeBusinessId') || '', []);

    // Update form values when initialValues changes (for edit mode)
    useEffect(() => {
        if (initialValues && mode === 'edit') {
            setValues(prev => ({
                ...prev,
                ...initialValues
            }));
        }
    }, [initialValues, mode]);

    // Load shared terms for this business and bill type
    const loadSharedTerms = React.useCallback(async () => {
        setTermsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/billing-terms', {
                headers: { Authorization: `Bearer ${token}` },
                params: { businessId: activeBusinessId, type }
            });
            setAvailableTerms(response.data.terms || []);
        } catch (error) {
            console.error('Error loading terms:', error);
            setAvailableTerms([]);
        } finally {
            setTermsLoading(false);
        }
    }, [activeBusinessId, type, token]);

    useEffect(() => {
        if (activeBusinessId && type && token) {
            loadSharedTerms();
        }
    }, [activeBusinessId, type, token, loadSharedTerms]);

    const addNewSharedTerm = async () => {
        if (!newTermText.trim()) return;

        setAddingTerm(true);
        try {
            const response = await axios.post('http://localhost:5000/api/billing-terms', {
                businessId: activeBusinessId,
                type,
                text: newTermText.trim(),
                userId: user._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Add to available terms
            setAvailableTerms(prev => [...prev, response.data.term]);
            setNewTermText('');
            setError('');
        } catch (error) {
            const msg = error.response?.data?.message || 'Error adding term';
            setError(msg);
        } finally {
            setAddingTerm(false);
        }
    };

    const toggleTermSelection = (termText) => {
        const currentTerms = values.optionalFields?.termsAndConditions || [];
        const existingIndex = currentTerms.findIndex(t => t.text === termText);

        if (existingIndex >= 0) {
            // Remove term
            const newTerms = currentTerms.filter((_, idx) => idx !== existingIndex);
            updateField('optionalFields.termsAndConditions', newTerms);
        } else {
            // Add term
            const newTerms = [...currentTerms, { text: termText }];
            updateField('optionalFields.termsAndConditions', newTerms);
        }
    };

    // Parties (customers/suppliers) autocomplete + inline create
    const partyType = type === 'sale' ? 'customer' : 'supplier';
    const [partyQuery, setPartyQuery] = useState(values.parties?.name || '');
    const [partyOpts, setPartyOpts] = useState([]);
    const [partyLoading, setPartyLoading] = useState(false);
    const [showNewParty, setShowNewParty] = useState(false);
    const [newParty, setNewParty] = useState({ name: '', phone: '' });

    useEffect(() => {
        if (!partyQuery || partyQuery.length < 2) { setPartyOpts([]); return; }
        if (!activeBusinessId || !token) return;
        const t = setTimeout(() => {
            setPartyLoading(true);
            axios.get('http://localhost:5000/api/parties/get', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    business_id: activeBusinessId,
                    type: partyType,
                    page: 1,
                    limit: 10,
                    search: partyQuery,
                },
            }).then(res => {
                setPartyOpts(res.data?.parties || []);
            }).catch(() => {
                setPartyOpts([]);
            }).finally(() => setPartyLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [partyQuery, activeBusinessId, token, partyType]);

    // Listen for partyAdded events from modal
    useEffect(() => {
        const handlePartyAdded = (event) => {
            const newParty = event.detail?.party;
            if (newParty && newParty.type === partyType) {
                // Refresh party options if there's a search query
                if (partyQuery && partyQuery.length >= 2) {
                    setPartyLoading(true);
                    axios.get('http://localhost:5000/api/parties/get', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: {
                            business_id: activeBusinessId,
                            type: partyType,
                            page: 1,
                            limit: 10,
                            search: partyQuery,
                        },
                    }).then(res => {
                        setPartyOpts(res.data?.parties || []);
                    }).catch(() => {
                        setPartyOpts([]);
                    }).finally(() => setPartyLoading(false));
                }
            }
        };

        window.addEventListener('partyAdded', handlePartyAdded);
        return () => window.removeEventListener('partyAdded', handlePartyAdded);
    }, [partyQuery, activeBusinessId, token, partyType]);

    const handleCreatePartyInline = () => {
        if (!newParty.name || !newParty.phone) { setError('Party name and phone are required to create.'); return; }
        if (!user?._id || !activeBusinessId) { setError('Missing user or business.'); return; }
        axios.post('http://localhost:5000/api/parties/create', {
            user_id: user._id,
            business_id: activeBusinessId,
            type: partyType,
            name: newParty.name,
            phone: newParty.phone,
        }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
            const p = res.data?.party || {};
            setValues(v => ({
                ...v,
                parties: { id: p._id || '', name: p.name || newParty.name, phone: p.phone || newParty.phone },
            }));
            setPartyQuery(p.name || newParty.name);
            setShowNewParty(false);
            setNewParty({ name: '', phone: '' });
            setError('');
        }).catch(err => {
            setError(err.response?.data?.message || 'Failed to create party.');
        });
    };

    const selectParty = (p) => {
        setValues(v => ({ ...v, parties: { id: p._id, name: p.name, phone: p.phone || '' } }));
        setPartyQuery(p.name);
        setPartyOpts([]);
    };

    // Products autocomplete + inline create per row
    const [productQueries, setProductQueries] = useState(() => (values.products || []).map(p => p.name || ''));
    const [productOpts, setProductOpts] = useState([]); // options for active row only
    const [productLoading, setProductLoading] = useState(false);
    const [activeProductRow, setActiveProductRow] = useState(-1);

    useEffect(() => {
        const idx = activeProductRow;
        if (idx < 0) return;
        const q = productQueries[idx] || '';
        if (!q || q.length < 2) { setProductOpts([]); return; }
        if (!user?._id || !activeBusinessId || !token) return;
        const t = setTimeout(() => {
            setProductLoading(true);
            axios.get('http://localhost:5000/api/product', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    userId: user._id,
                    businessId: activeBusinessId,
                    name: q,
                    page: 1,
                    limit: 10,
                },
            }).then(res => {
                setProductOpts(res.data?.products || res.data?.data || []);
            }).catch(() => setProductOpts([]))
                .finally(() => setProductLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [activeProductRow, productQueries, user?._id, activeBusinessId, token]);

    const selectProduct = (idx, prod) => {
        setValues(prev => {
            const arr = [...(prev.products || [])];
            const price = type === 'sale' ? (prod.salePrice ?? arr[idx]?.price ?? 0) : (prod.purchasePrice ?? arr[idx]?.price ?? 0);
            arr[idx] = { ...(arr[idx] || {}), id: prod._id, name: prod.name, price };
            return { ...prev, products: arr };
        });
        setProductQueries(qs => { const n = [...qs]; n[idx] = prod.name; return n; });
        setProductOpts([]);
        setActiveProductRow(-1);
    };

    // Listen for productAdded events from modal
    useEffect(() => {
        const handleProductAdded = (event) => {
            const newProduct = event.detail?.product;
            if (newProduct) {
                // Refresh product options for active row if there's a search query
                const idx = activeProductRow;
                if (idx >= 0 && productQueries[idx] && productQueries[idx].length >= 2) {
                    setProductLoading(true);
                    axios.get('http://localhost:5000/api/product', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: {
                            userId: user._id,
                            businessId: activeBusinessId,
                            page: 1,
                            limit: 10,
                            search: productQueries[idx],
                        },
                    }).then(res => {
                        setProductOpts(res.data?.products || res.data?.data || []);
                    }).catch(() => {
                        setProductOpts([]);
                    }).finally(() => setProductLoading(false));
                }
            }
        };

        window.addEventListener('productAdded', handleProductAdded);
        return () => window.removeEventListener('productAdded', handleProductAdded);
    }, [activeProductRow, productQueries, activeBusinessId, token, user._id]);

    // Initialize photo previews from initial values (for edit mode)
    useEffect(() => {
        if (initialValues && initialValues.photos && Array.isArray(initialValues.photos) && initialValues.photos.length > 0) {
            const previews = initialValues.photos.map((url, index) => ({
                id: `initial-${index}`,
                url: url,
                file: null, // These are existing URLs, not files
                name: `Photo ${index + 1}`
            }));
            setPhotoPreviews(previews);
        } else if (mode === 'create') {
            // Clear previews for create mode
            setPhotoPreviews([]);
        }
    }, [initialValues, mode]);

    const title = useMemo(() => `${mode === 'create' ? 'Add' : 'Edit'} ${type === 'sale' ? 'Sale' : 'Purchase'}`, [mode, type]);

    const updateField = (path, value) => {
        setValues(prev => {
            const next = { ...prev };
            const keys = path.split('.');
            let ref = next;
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!(k in ref)) ref[k] = {};
                ref = ref[k];
            }
            ref[keys[keys.length - 1]] = value;
            return next;
        });
    };

    const updateArrayItem = (arrKey, index, field, value) => {
        setValues(prev => {
            const arr = Array.isArray(prev[arrKey]) ? [...prev[arrKey]] : [];
            arr[index] = { ...(arr[index] || {}), [field]: value };
            return { ...prev, [arrKey]: arr };
        });
    };

    const addArrayItem = (arrKey, template) => {
        setValues(prev => ({ ...prev, [arrKey]: [...(prev[arrKey] || []), template] }));
    };

    const removeArrayItem = (arrKey, index) => {
        setValues(prev => ({ ...prev, [arrKey]: (prev[arrKey] || []).filter((_, i) => i !== index) }));
    };

    // Auto-calculate total amount and balance
    const calculateTotals = React.useCallback((currentValues = values) => {
        // Calculate product total
        const productTotal = (currentValues.products || []).reduce((sum, product) => {
            const qty = Number(product.quantity) || 0;
            const price = Number(product.price) || 0;
            return sum + (qty * price);
        }, 0);

        // Calculate additional charges total
        const additionalTotal = (currentValues.additionalCharges || []).reduce((sum, charge) => {
            return sum + (Number(charge.amount) || 0);
        }, 0);

        // Calculate discount total
        const discountTotal = (currentValues.discount || []).reduce((sum, discount) => {
            const value = Number(discount.value) || 0;
            if (discount.type === 'percentage') {
                // Apply percentage to product total only
                return sum + ((productTotal * value) / 100);
            }
            return sum + value;
        }, 0);

        const totalAmount = productTotal + additionalTotal - discountTotal;

        return {
            productTotal,
            additionalTotal,
            discountTotal,
            totalAmount: Math.max(0, totalAmount) // Ensure total is not negative
        };
    }, [values]);

    // Update totals whenever products, charges, or discounts change
    React.useEffect(() => {
        const { totalAmount } = calculateTotals();
        setValues(prev => {
            // Only update if the calculated total is different from current total
            if (Number(prev.totalAmount) !== totalAmount) {
                let newBalanceDue = prev.balanceDue;

                // Auto-calculate balance due for unpaid method
                if (prev.method === 'unpaid') {
                    newBalanceDue = totalAmount.toString();
                }

                return {
                    ...prev,
                    totalAmount: totalAmount.toString(),
                    balanceDue: newBalanceDue
                };
            }
            return prev;
        });
    }, [calculateTotals]);

    // Handle payment method change
    const handlePaymentMethodChange = (method) => {
        const { totalAmount } = calculateTotals();
        setValues(prev => {
            let newBalanceDue = prev.balanceDue;

            if (method === 'unpaid') {
                // For unpaid, balance due should equal total amount
                newBalanceDue = totalAmount.toString();
            } else {
                // For paid methods (cash/online), balance due can remain as entered or be 0
                newBalanceDue = '0';
            }

            return {
                ...prev,
                method,
                balanceDue: newBalanceDue
            };
        });
    };

    // Photo handling functions
    const compressImage = (file, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    };

    const handlePhotoFilesChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newFiles = [...photoFiles];
        const newPreviews = [...photoPreviews];

        for (const file of files) {
            try {
                // Compress image if it's larger than 1MB
                const compressedFile = file.size > 1024 * 1024 ? await compressImage(file) : file;
                const finalFile = compressedFile || file;

                const reader = new FileReader();
                reader.onload = (event) => {
                    newPreviews.push({
                        id: Date.now() + Math.random(), // Simple unique ID
                        url: event.target.result,
                        file: finalFile,
                        name: file.name
                    });
                    setPhotoPreviews([...newPreviews]);
                };
                reader.readAsDataURL(finalFile);
                newFiles.push(finalFile);
            } catch (error) {
                console.error('Error processing image:', error);
                // Fallback to original file
                const reader = new FileReader();
                reader.onload = (event) => {
                    newPreviews.push({
                        id: Date.now() + Math.random(),
                        url: event.target.result,
                        file: file,
                        name: file.name
                    });
                    setPhotoPreviews([...newPreviews]);
                };
                reader.readAsDataURL(file);
                newFiles.push(file);
            }
        }

        setPhotoFiles(newFiles);
        // Clear the input so the same files can be selected again if needed
        e.target.value = '';
    };

    const removePhoto = (photoId) => {
        setPhotoPreviews(prev => prev.filter(p => p.id !== photoId));
        setPhotoFiles(prev => {
            const photoToRemove = photoPreviews.find(p => p.id === photoId);
            if (!photoToRemove) return prev;
            return prev.filter(f => f !== photoToRemove.file);
        });
    };

    const validate = () => {
        if (!values.parties?.id || !values.parties?.name || !values.parties?.phone) {
            return 'Party id, name and phone are required.';
        }
        if (!Array.isArray(values.products) || values.products.length === 0) {
            return 'Add at least one product.';
        }
        for (const p of values.products) {
            if (!p.name || !p.id) return 'Each product must have id and name.';
            const qty = Number(p.quantity);
            const price = Number(p.price);
            if (!(qty > 0)) return 'Quantity must be greater than 0.';
            if (price < 0) return 'Price cannot be negative.';
        }
        if (!['unpaid', 'cash', 'online'].includes(values.method)) {
            return 'Select a valid method.';
        }

        // Conditional validation based on payment method
        if (values.method === 'unpaid') {
            if (!values.dueDate) return 'Due date is required for unpaid bills.';
        } else {
            if (!values.date) return 'Payment date is required for paid bills.';
        }

        if (values.balanceDue !== '' && Number(values.balanceDue) < 0) return 'Balance Due must be >= 0.';
        if (values.totalAmount !== '' && Number(values.totalAmount) < 0) return 'Total Amount must be >= 0.';
        return '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }

        // Normalize types
        const payload = { ...values };
        payload.products = (payload.products || []).map(p => ({
            id: p.id,
            name: p.name,
            quantity: Number(p.quantity),
            price: Number(p.price),
        }));
        payload.additionalCharges = (payload.additionalCharges || []).map(c => ({ name: c.name, amount: Number(c.amount || 0) }));
        payload.discount = (payload.discount || []).map(d => ({ type: d.type, value: Number(d.value || 0) }));
        payload.balanceDue = payload.balanceDue === '' ? undefined : Number(payload.balanceDue);
        payload.totalAmount = payload.totalAmount === '' ? undefined : Number(payload.totalAmount);
        payload.date = payload.date || undefined;
        payload.dueDate = payload.dueDate || undefined;

        // Convert photo files to URLs for submission (using Base64 data URLs)
        payload.photos = photoPreviews.map(photo => photo.url);

        onSubmit && onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className='billing-form'>
            <div className='billing-form-header'>
                <h3 className='billing-form-title'>{title}</h3>
            </div>

            {/* Party Section */}
            <div className='billing-form-section'>
                <div className='d-flex align-items-center justify-content-between'>
                    <h5 className='m-0'>Party Details</h5>
                    {onAddParty ? (
                        <button type='button' className='btn-primary-add' onClick={onAddParty}>+ New {partyType.charAt(0).toUpperCase() + partyType.slice(1)}</button>
                    ) : (
                        <button type='button' className='btn-primary-add' onClick={() => setShowNewParty(s => !s)}>{showNewParty ? 'Cancel New Party' : `+ New ${partyType.charAt(0).toUpperCase() + partyType.slice(1)}`}</button>
                    )}
                </div>
                <div className='row'>
                    <div className='col-md-6'>
                        <label className='billing-form-label' style={{ position: 'relative' }}>Party
                            <input
                                className={`billing-form-input ${invalidFields.has('party-name') ? 'invalid-field' : ''}`}
                                value={partyQuery}
                                onChange={(e) => { setPartyQuery(e.target.value); updateField('parties.name', e.target.value); }}
                                onFocus={() => handleFieldFocus('party-name')}
                                onBlur={() => handleFieldBlur('party-name', partyQuery, true)}
                                placeholder={`Search ${partyType} name…`}
                                required
                            />
                            {partyLoading && <div className='small' style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888' }}>…</div>}
                            {partyOpts.length > 0 && (
                                <div className='dropdown' style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', width: '100%', maxHeight: 180, overflowY: 'auto' }}>
                                    {partyOpts.map(p => (
                                        <div key={p._id} className='dropdown-item' style={{ padding: 8, cursor: 'pointer' }} onClick={() => selectParty(p)}>
                                            {p.name} {p.phone ? `(${p.phone})` : ''}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </label>
                    </div>
                    <div className='col-md-6'>
                        <label className='billing-form-label'>Party Phone
                            <input
                                className={`billing-form-input ${invalidFields.has('party-phone') ? 'invalid-field' : ''}`}
                                value={values.parties.phone}
                                onChange={(e) => updateField('parties.phone', e.target.value)}
                                onFocus={() => handleFieldFocus('party-phone')}
                                onBlur={() => handleFieldBlur('party-phone', values.parties.phone, true)}
                                required
                            />
                        </label>
                    </div>
                </div>
                {showNewParty && (
                    <div className='row'>
                        <div className='col-md-5'>
                            <label className='billing-form-label'>Name
                                <input className='billing-form-input' value={newParty.name} onChange={(e) => setNewParty(p => ({ ...p, name: e.target.value }))} />
                            </label>
                        </div>
                        <div className='col-md-5'>
                            <label className='billing-form-label'>Phone
                                <input className='billing-form-input' value={newParty.phone} onChange={(e) => setNewParty(p => ({ ...p, phone: e.target.value }))} />
                            </label>
                        </div>
                        <div className='col-md-2 d-flex align-items-end'>
                            <button type='button' className='btn-submit' onClick={handleCreatePartyInline}>Create {partyType}</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Products */}
            <div className='billing-form-section'>
                <div className='d-flex align-items-center justify-content-between'>
                    <h5 className='m-0'>Items</h5>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type='button' className='btn-primary-add' onClick={() => addArrayItem('products', { id: '', name: '', quantity: 1, price: 0 })}>+ Add Item</button>
                        {onAddProduct && (
                            <button type='button' className='btn-primary-add' onClick={onAddProduct}>+ New Product</button>
                        )}
                    </div>
                </div>
                {(values.products || []).map((p, idx) => (
                    <div className='row' key={idx}>
                        <div className='col-md-5'>
                            <label className='billing-form-label' style={{ position: 'relative' }}>Product
                                <input
                                    className={`billing-form-input ${invalidFields.has(`product-${idx}`) ? 'invalid-field' : ''}`}
                                    value={productQueries[idx] ?? p.name ?? ''}
                                    onFocus={() => { setActiveProductRow(idx); handleFieldFocus(`product-${idx}`); }}
                                    onChange={(e) => {
                                        const val = e.target.value; updateArrayItem('products', idx, 'name', val); setProductQueries(qs => { const n = [...qs]; n[idx] = val; return n; }); setActiveProductRow(idx);
                                    }}
                                    onBlur={() => handleFieldBlur(`product-${idx}`, productQueries[idx] ?? p.name ?? '', true)}
                                    required
                                />
                                {productLoading && activeProductRow === idx && <div className='small' style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888' }}>…</div>}
                                {activeProductRow === idx && productOpts.length > 0 && (
                                    <div className='dropdown' style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', width: '100%', maxHeight: 180, overflowY: 'auto' }}>
                                        {productOpts.map(op => (
                                            <div key={op._id} className='dropdown-item' style={{ padding: 8, cursor: 'pointer' }} onClick={() => selectProduct(idx, op)}>
                                                {op.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </label>
                        </div>
                        <div className='col-md-3'>
                            <label className='billing-form-label'>Qty
                                <input
                                    type='number'
                                    min='1'
                                    className={`billing-form-input ${invalidFields.has(`quantity-${idx}`) ? 'invalid-field' : ''}`}
                                    value={p.quantity}
                                    onChange={(e) => updateArrayItem('products', idx, 'quantity', e.target.value)}
                                    onFocus={() => handleFieldFocus(`quantity-${idx}`)}
                                    onBlur={() => handleFieldBlur(`quantity-${idx}`, p.quantity, true)}
                                    required
                                />
                            </label>
                        </div>
                        <div className='col-md-3'>
                            <label className='billing-form-label'>Price
                                <input
                                    type='number'
                                    min='0'
                                    className={`billing-form-input ${invalidFields.has(`price-${idx}`) ? 'invalid-field' : ''}`}
                                    value={p.price}
                                    onChange={(e) => updateArrayItem('products', idx, 'price', e.target.value)}
                                    onFocus={() => handleFieldFocus(`price-${idx}`)}
                                    onBlur={() => handleFieldBlur(`price-${idx}`, p.price, true)}
                                    required
                                />
                            </label>
                        </div>
                        <div className='col-md-1 d-flex align-items-center justify-content-center'>
                            <button type='button' className='btn-delete-icon' onClick={() => removeArrayItem('products', idx)} title="Delete product">
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Optional Toggle */}
            <div className='d-flex align-items-center justify-content-between' style={{ marginTop: 20 }}>
                <h5 className='m-0'>Optional Details</h5>
                <button type='button' className='btn-cancel' onClick={() => setShowOptional(s => !s)}>{showOptional ? 'Hide' : 'Show'}</button>
            </div>
            {showOptional && (
                <>
                    {/* Additional Charges */}
                    <div className='billing-form-section'>
                        <div className='d-flex align-items-center justify-content-between'>
                            <h6 className='m-0'>Additional Charges</h6>
                            <button type='button' className='btn-primary-add' onClick={() => addArrayItem('additionalCharges', { name: '', amount: 0 })}>+ Add</button>
                        </div>
                        {(values.additionalCharges || []).map((c, idx) => (
                            <div className='row' key={idx}>
                                <div className='col-md-5'>
                                    <label className='billing-form-label'>Name
                                        <input className='billing-form-input' value={c.name} onChange={(e) => updateArrayItem('additionalCharges', idx, 'name', e.target.value)} />
                                    </label>
                                </div>
                                <div className='col-md-6'>
                                    <label className='billing-form-label'>Amount
                                        <input type='number' min='0' className='billing-form-input' value={c.amount || 0} onChange={(e) => updateArrayItem('additionalCharges', idx, 'amount', e.target.value)} />
                                    </label>
                                </div>
                                <div className='col-md-1 d-flex align-items-center justify-content-center'>
                                    <button type='button' className='btn-delete-icon' onClick={() => removeArrayItem('additionalCharges', idx)} title="Delete charge">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Discounts */}
                    <div className='billing-form-section'>
                        <div className='d-flex align-items-center justify-content-between'>
                            <h6 className='m-0'>Discounts</h6>
                            <button type='button' className='btn-primary-add' onClick={() => addArrayItem('discount', { type: 'amount', value: 0 })}>+ Add</button>
                        </div>
                        {(values.discount || []).map((d, idx) => (
                            <div className='row' key={idx}>
                                <div className='col-md-5'>
                                    <label className='billing-form-label'>Type
                                        <select className='billing-form-input' value={d.type} onChange={(e) => updateArrayItem('discount', idx, 'type', e.target.value)}>
                                            <option value='amount'>Amount</option>
                                            <option value='percentage'>Percentage</option>
                                        </select>
                                    </label>
                                </div>
                                <div className='col-md-6'>
                                    <label className='billing-form-label'>Value
                                        <input type='number' min='0' className='billing-form-input' value={d.value || 0} onChange={(e) => updateArrayItem('discount', idx, 'value', e.target.value)} />
                                    </label>
                                </div>
                                <div className='col-md-1 d-flex align-items-center justify-content-center'>
                                    <button type='button' className='btn-delete-icon' onClick={() => removeArrayItem('discount', idx)} title="Delete discount">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Address Sections */}
                    <div className='billing-form-section'>
                        <h6>Party Address</h6>
                        <div className='row'>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Address
                                    <input className='billing-form-input' value={values.optionalFields?.partyAddress?.address || ''} onChange={(e) => updateField('optionalFields.partyAddress.address', e.target.value)} />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Pincode
                                    <input className='billing-form-input' value={values.optionalFields?.partyAddress?.pincode || ''} onChange={(e) => updateField('optionalFields.partyAddress.pincode', e.target.value)} />
                                </label>
                            </div>
                        </div>
                        <div className='row'>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>City
                                    <input className='billing-form-input' value={values.optionalFields?.partyAddress?.city || ''} onChange={(e) => updateField('optionalFields.partyAddress.city', e.target.value)} />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>State
                                    <input className='billing-form-input' value={values.optionalFields?.partyAddress?.state || ''} onChange={(e) => updateField('optionalFields.partyAddress.state', e.target.value)} />
                                </label>
                            </div>
                        </div>

                        <h6>Shipping Address</h6>
                        <div className='row'>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Address
                                    <input className='billing-form-input' value={values.optionalFields?.shippingAddress?.address || ''} onChange={(e) => updateField('optionalFields.shippingAddress.address', e.target.value)} />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Pincode
                                    <input className='billing-form-input' value={values.optionalFields?.shippingAddress?.pincode || ''} onChange={(e) => updateField('optionalFields.shippingAddress.pincode', e.target.value)} />
                                </label>
                            </div>
                        </div>
                        <div className='row'>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>City
                                    <input className='billing-form-input' value={values.optionalFields?.shippingAddress?.city || ''} onChange={(e) => updateField('optionalFields.shippingAddress.city', e.target.value)} />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>State
                                    <input className='billing-form-input' value={values.optionalFields?.shippingAddress?.state || ''} onChange={(e) => updateField('optionalFields.shippingAddress.state', e.target.value)} />
                                </label>
                            </div>
                        </div>

                        <h6>Business Address</h6>
                        <div className='row'>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Address
                                    <input className='billing-form-input' value={values.optionalFields?.businessAddress?.address || ''} onChange={(e) => updateField('optionalFields.businessAddress.address', e.target.value)} />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Pincode
                                    <input className='billing-form-input' value={values.optionalFields?.businessAddress?.pincode || ''} onChange={(e) => updateField('optionalFields.businessAddress.pincode', e.target.value)} />
                                </label>
                            </div>
                        </div>
                        <div className='row'>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>City
                                    <input className='billing-form-input' value={values.optionalFields?.businessAddress?.city || ''} onChange={(e) => updateField('optionalFields.businessAddress.city', e.target.value)} />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>State
                                    <input className='billing-form-input' value={values.optionalFields?.businessAddress?.state || ''} onChange={(e) => updateField('optionalFields.businessAddress.state', e.target.value)} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions Section */}
                    <div className='billing-form-section'>
                        <div className='d-flex align-items-center justify-content-between'>
                            <h6 className='m-0'>Terms & Conditions</h6>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {termsLoading && <span style={{ fontSize: '0.9rem', color: '#666' }}>Loading...</span>}
                            </div>
                        </div>

                        {/* Add New Term */}
                        <div className='row' style={{ marginBottom: '16px' }}>
                            <div className='col-md-9'>
                                <input
                                    className='billing-form-input'
                                    value={newTermText}
                                    onChange={(e) => setNewTermText(e.target.value)}
                                    placeholder="Add a new term for all future bills..."
                                    onKeyPress={(e) => e.key === 'Enter' && addNewSharedTerm()}
                                />
                            </div>
                            <div className='col-md-3'>
                                <button
                                    type='button'
                                    className='btn-submit'
                                    onClick={addNewSharedTerm}
                                    disabled={addingTerm || !newTermText.trim()}
                                    style={{ width: '100%' }}
                                >
                                    {addingTerm ? 'Adding...' : 'Add Term'}
                                </button>
                            </div>
                        </div>

                        {/* Available Terms (Checkboxes) */}
                        {availableTerms.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px', display: 'block' }}>
                                    Select terms to include in this bill:
                                </label>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '12px' }}>
                                    {availableTerms.map((term, idx) => {
                                        const isSelected = (values.optionalFields?.termsAndConditions || []).some(t => t.text === term.text);
                                        return (
                                            <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleTermSelection(term.text)}
                                                    style={{ marginTop: '2px', flexShrink: 0 }}
                                                />
                                                <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{term.text}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Selected Terms Preview */}
                        {(values.optionalFields?.termsAndConditions || []).length > 0 && (
                            <div>
                                <label style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px', display: 'block' }}>
                                    Selected terms for this bill:
                                </label>
                                <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '12px' }}>
                                    {(values.optionalFields?.termsAndConditions || []).map((term, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '4px 0',
                                            borderBottom: idx < (values.optionalFields?.termsAndConditions || []).length - 1 ? '1px solid #e0e0e0' : 'none'
                                        }}>
                                            <span style={{ fontSize: '0.9rem' }}>{term.text}</span>
                                            <button
                                                type='button'
                                                className='btn-delete-icon'
                                                onClick={() => toggleTermSelection(term.text)}
                                                title="Remove term"
                                                style={{ marginLeft: '8px' }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note & Photos Section */}
                    <div className='billing-form-section'>
                        <h6>Note & Photos</h6>

                        {/* Note */}
                        <label className='billing-form-label'>Note
                            <textarea
                                className='billing-form-input'
                                value={values.note}
                                onChange={(e) => setValues(v => ({ ...v, note: e.target.value }))}
                                placeholder="Add any additional notes..."
                                rows="3"
                            />
                        </label>

                        {/* Photos */}
                        <label className='billing-form-label'>
                            Upload Photos
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className='billing-form-input'
                                onChange={handlePhotoFilesChange}
                            />
                        </label>

                        {/* Photo Previews */}
                        {photoPreviews.length > 0 && (
                            <div className="row" style={{ marginTop: '12px' }}>
                                {photoPreviews.map((photo) => (
                                    <div key={photo.id} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6 mb-3">
                                        <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                            <img
                                                src={photo.url}
                                                alt={photo.name}
                                                style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(photo.id)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    background: 'rgba(255, 0, 0, 0.8)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                                title="Remove photo"
                                            >
                                                ×
                                            </button>
                                            <div style={{ padding: '4px', fontSize: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', textAlign: 'center' }}>
                                                {photo.name.length > 15 ? photo.name.substring(0, 12) + '...' : photo.name}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Payment Details - Always visible at bottom */}
            <div className='billing-form-section' style={{ marginTop: 24, borderTop: '2px solid #e0e0e0', paddingTop: 16 }}>
                <h5 style={{ margin: '0 0 16px 0', color: '#232526' }}>Payment Details</h5>

                {/* Method - Always shown */}
                <div className='row'>
                    <div className='col-md-6'>
                        <label className='billing-form-label'>Payment Method
                            <select className='billing-form-input' value={values.method} onChange={(e) => handlePaymentMethodChange(e.target.value)}>
                                <option value='unpaid'>Unpaid</option>
                                <option value='cash'>Cash</option>
                                <option value='online'>Online</option>
                            </select>
                        </label>
                    </div>
                    <div className='col-md-6'>
                        <div className='billing-form-label'>Calculation Summary
                            <div style={{
                                padding: '12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                backgroundColor: '#f8f9fa',
                                fontSize: '0.9rem'
                            }}>
                                <div>Products: ₹{calculateTotals().productTotal.toFixed(2)}</div>
                                <div>Charges: +₹{calculateTotals().additionalTotal.toFixed(2)}</div>
                                <div>Discounts: -₹{calculateTotals().discountTotal.toFixed(2)}</div>
                                <div style={{ fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '4px', marginTop: '4px' }}>
                                    Total: ₹{calculateTotals().totalAmount.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conditional Date and Balance fields */}
                <div className='row'>
                    {values.method === 'unpaid' ? (
                        <>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Due Date *
                                    <input
                                        type='date'
                                        className={`billing-form-input ${invalidFields.has('due-date') ? 'invalid-field' : ''}`}
                                        value={values.dueDate}
                                        onChange={(e) => setValues(v => ({ ...v, dueDate: e.target.value }))}
                                        onFocus={() => handleFieldFocus('due-date')}
                                        onBlur={() => handleFieldBlur('due-date', values.dueDate, true)}
                                        required
                                    />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Balance Due
                                    <input type='number' min='0' className='billing-form-input' value={values.balanceDue} onChange={(e) => setValues(v => ({ ...v, balanceDue: e.target.value }))} placeholder="0" />
                                </label>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Payment Date *
                                    <input
                                        type='date'
                                        className={`billing-form-input ${invalidFields.has('payment-date') ? 'invalid-field' : ''}`}
                                        value={values.date}
                                        onChange={(e) => setValues(v => ({ ...v, date: e.target.value }))}
                                        onFocus={() => handleFieldFocus('payment-date')}
                                        onBlur={() => handleFieldBlur('payment-date', values.date, true)}
                                        required
                                    />
                                </label>
                            </div>
                            <div className='col-md-6'>
                                <label className='billing-form-label'>Total Amount
                                    <input type='number' min='0' className='billing-form-input' value={values.totalAmount} onChange={(e) => setValues(v => ({ ...v, totalAmount: e.target.value }))} placeholder="0" />
                                </label>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && <div className='billing-form-error' style={{ marginTop: 8, color: '#d32f2f', fontSize: 14 }}>{error}</div>}
            <div className='billing-form-actions' style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type='button' className='btn-cancel' onClick={onCancel}>Cancel</button>
                <button type='submit' className='btn-submit' disabled={submitting}>
                    {submitting ? 'Processing…' : (mode === 'create' ? 'Preview Bill' : 'Save Changes')}
                </button>
            </div>
        </form>
    );
}
