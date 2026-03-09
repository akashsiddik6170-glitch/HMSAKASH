// AOS Initialization
AOS.init({ duration: 800, once: true });

// ========== CONFIG ==========
const GET_URL = 'https://script.google.com/macros/s/AKfycbxG1vf0XHx8xhWpDjcoXDr7yypk-_yDZLODgrPaqAvwQKfsG0RzVCCk6z299jSjxU3d/exec';
const POST_URL = 'https://script.google.com/macros/s/AKfycbxF5Eq2S9x5lJ0h1dClYQ3teh7ebCrPd0g88MpB0Jv306yyFFlhHgSQe7RTRGPkU4l4/exec';
const PER_PAGE = 40;

let products = [];
let currentPage = 0;
let cart = [];
let lastOrderData = null;

// ========== DOM ELEMENTS ==========
const preloader = document.getElementById('preloader');
const productGrid = document.getElementById('productSection');
const nextBtn = document.getElementById('nextButton');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterChips = document.querySelectorAll('.filter-chip');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutModal = document.getElementById('checkoutModal');
const detailsModal = document.getElementById('detailsModal');
const detailContent = document.getElementById('detailContent');
const popupCartList = document.getElementById('popupCartList');
const popupSubtotal = document.getElementById('popupSubtotal');
const popupDelivery = document.getElementById('popupDeliveryCharge');
const popupFinal = document.getElementById('popupFinalTotal');
const productsInput = document.getElementById('productsInput');
const totalInput = document.getElementById('totalInput');
const orderIdInput = document.getElementById('orderIdInput');
const phoneRawInput = document.getElementById('phoneRawInput');
const orderIdDisplay = document.getElementById('orderIdDisplay');
const msgBox = document.getElementById('msg');
const openCheckout = document.getElementById('headerCart');
const closeCheckout = document.getElementById('closeCheckoutModal');
const closeDetails = document.getElementById('closeDetailsModal');
const pdfReceiptDiv = document.getElementById('pdf-receipt');

// Receipt Modal Elements
const receiptModal = document.getElementById('receiptModal');
const closeReceiptModal = document.getElementById('closeReceiptModal');
const receiptContent = document.getElementById('receiptContent');
const downloadPDFBtn = document.getElementById('downloadPDFBtn');
const printReceiptBtn = document.getElementById('printReceiptBtn');

// Submit button
const submitOrderBtn = document.getElementById('submitOrderBtn');

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Hide preloader
setTimeout(() => preloader.classList.add('hidden'), 1500);

// ========== INITIALIZE ==========
function initializeApp() {
    fetch(GET_URL)
        .then(res => res.json())
        .then(data => {
            products = data;
            if (products.length) renderProducts(0);
            else productGrid.innerHTML = '<div class="no-results">কোন পণ্য পাওয়া যায়নি</div>';
        })
        .catch(err => {
            console.error(err);
            productGrid.innerHTML = '<div class="no-results">পণ্য লোড করতে সমস্যা হয়েছে</div>';
        });
}

// Start the app
initializeApp();

// ========== GENERATE NUMERIC ORDER ID (8-digit) ==========
function generateOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 90 + 10).toString();
    return (timestamp + random).slice(-8);
}

// ========== RENDER PRODUCTS (with stock) ==========
function renderProducts(start) {
    const end = Math.min(start + PER_PAGE, products.length);
    const batch = products.slice(start, end);

    if (start === 0) productGrid.innerHTML = '';

    batch.forEach(p => {
        const globalIdx = products.findIndex(item => item.name === p.name);
        const isFree = p.deliveryCharge === 0;
        const isInStock = p.stock > 0;
        
        const stockBadge = isInStock ? 
            `<div class="product-badge ${Math.random() > 0.5 ? 'featured' : ''}">${isFree ? 'ফ্রি ডেলিভারি' : 'চার্জ প্রযোজ্য'}</div>` :
            `<div class="product-badge" style="background: var(--danger);">স্টক আউট</div>`;

        const actionButtons = isInStock ? `
            <div class="product-actions">
                <button class="product-btn btn-add" data-index="${globalIdx}"><i class="fas fa-cart-plus"></i> <span>কার্ট</span></button>
                <button class="product-btn btn-buy" data-index="${globalIdx}"><i class="fas fa-bolt"></i> <span>কিনুন</span></button>
            </div>
        ` : `
            <div class="product-actions">
                <button class="product-btn" style="background: var(--neutral-300); color: var(--neutral-600); width: 100%;" disabled>
                    <i class="fas fa-ban"></i> <span>স্টক শেষ</span>
                </button>
            </div>
        `;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.index = globalIdx;
        card.dataset.name = p.name.toLowerCase();
        card.dataset.delivery = isFree ? 'free' : 'paid';
        
        let imageUrl = p.image;
        if (imageUrl && imageUrl.includes('drive.google.com')) {
            const fileId = imageUrl.match(/[-\w]{25,}/);
            if (fileId) {
                imageUrl = `https://drive.google.com/uc?export=view&id=${fileId[0]}`;
            }
        }
        
        card.innerHTML = `
            ${stockBadge}
            <div class="product-image-wrapper">
                <img src="${imageUrl || 'https://via.placeholder.com/300x300?text=Image+Not+Found'}" class="product-image" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Image+Not+Found';">
                <div class="product-overlay">
                    <button class="overlay-btn quick-view" data-index="${globalIdx}"><i class="fa-regular fa-eye"></i></button>
                </div>
            </div>
            <div class="product-details">
                <div class="product-category"></div>
                <h3 class="product-name">${p.name}</h3>
                <div class="product-price-wrapper">
                    <span class="product-price">BDT ${p.price}</span>
                    <span class="product-original-price">BDT ${Math.round(p.price * 1.15)}</span>
                </div>
                <div class="product-delivery ${isFree ? 'free' : 'paid'}">
                    <i class="fa-regular fa-truck"></i> ${isFree ? 'ফ্রি ডেলিভারি' : `BDT ${p.deliveryCharge}`}
                </div>
                ${actionButtons}
            </div>
        `;
        productGrid.appendChild(card);
    });

    attachEvents();
    nextBtn.style.display = (end < products.length) ? 'inline-block' : 'none';
    currentPage = Math.ceil(end / PER_PAGE);
}

// ========== ATTACH EVENTS ==========
function attachEvents() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const idx = card.dataset.index;
            if (idx) showDetails(products[idx]);
        });
    });

    document.querySelectorAll('.quick-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = btn.dataset.index;
            showDetails(products[idx]);
        });
    });

    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = btn.dataset.index;
            const p = products[idx];
            if (p.stock <= 0) {
                alert('❌ স্টক শেষ');
                return;
            }
            addToCart(p.name, p.price, p.deliveryCharge, p.image);
        });
    });

    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = btn.dataset.index;
            const p = products[idx];
            if (p.stock <= 0) {
                alert('❌ স্টক শেষ');
                return;
            }
            buyNow(p.name, p.price, p.deliveryCharge, p.image);
        });
    });
}

// ========== SHOW DETAILS (with stock) ==========
function showDetails(p) {
    const isFree = p.deliveryCharge === 0;
    const isInStock = p.stock > 0;
    
    const stockInfo = isInStock ? 
        `<div style="background: #E6F7E6; color: #0A5C0A; padding: 5px 12px; border-radius: var(--radius-full); display: inline-block; margin-bottom: 10px;">
            <i class="fa-regular fa-check-circle"></i> স্টকে আছে (${p.stock} টি)
        </div>` :
        `<div style="background: #FFE6E6; color: #B91C1C; padding: 5px 12px; border-radius: var(--radius-full); display: inline-block; margin-bottom: 10px;">
            <i class="fa-regular fa-circle-exclamation"></i> স্টক শেষ
        </div>`;
    
    const actionButtons = isInStock ? `
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="product-btn btn-add" id="detailAdd" style="flex: 1;">কার্টে যোগ করুন</button>
            <button class="product-btn btn-buy" id="detailBuy" style="flex: 1;">এখনই কিনুন</button>
        </div>
    ` : `
        <div style="text-align: center;">
            <button class="product-btn" style="background: var(--neutral-300); color: var(--neutral-600); width: 100%; padding: 14px;" disabled>
                <i class="fa-regular fa-ban"></i> পণ্যটির স্টক শেষ
            </button>
        </div>
    `;

    detailContent.innerHTML = `
        <h2 style="font-size: 1.6rem; margin-bottom: 15px;">${p.name}</h2>
        <img src="${p.image || 'https://via.placeholder.com/300x300?text=Image+Not+Found'}" style="width: 100%; max-height: 250px; object-fit: contain; border-radius: var(--radius-lg); margin-bottom: 15px;" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Image+Not+Found';">
        ${stockInfo}
        <div style="font-size: 1.8rem; color: var(--accent); font-weight: 700; margin-bottom: 10px;">BDT ${p.price}</div>
        <div style="background: var(--neutral-100); padding: 10px 15px; border-radius: var(--radius-full); display: inline-block; margin-bottom: 15px;">
            <i class="fa-regular fa-truck"></i> ${isFree ? 'ফ্রি ডেলিভারি' : `ডেলিভারি চার্জ BDT ${p.deliveryCharge}`}
        </div>
        <div style="background: var(--neutral-100); padding: 15px; border-radius: var(--radius-lg); margin-bottom: 20px;">
            <p>${p.description || 'বিস্তারিত বিবরণ পাওয়া যাচ্ছে না।'}</p>
        </div>
        ${actionButtons}
    `;
    detailsModal.style.display = 'flex';
    
    if (isInStock) {
        document.getElementById('detailAdd').onclick = () => addToCart(p.name, p.price, p.deliveryCharge, p.image);
        document.getElementById('detailBuy').onclick = () => buyNow(p.name, p.price, p.deliveryCharge, p.image);
    }
}

// ========== CART FUNCTIONS ==========
function addToCart(name, price, delivery, image) {
    const product = products.find(p => p.name === name);
    if (product && product.stock <= 0) {
        alert('❌ এই পণ্যটির স্টক শেষ হয়েছে');
        return;
    }
    
    const existing = cart.find(i => i.name === name);
    if (existing) {
        if (product && product.stock < existing.qty + 1) {
            alert('❌ স্টক শেষ');
            return;
        }
        existing.qty++;
    } else {
        cart.push({ name, price, delivery, qty: 1, image });
    }
    updateCartUI();
    detailsModal.style.display = 'none';
    alert('✅ কার্টে যোগ করা হয়েছে');
}

function buyNow(name, price, delivery, image) {
    const product = products.find(p => p.name === name);
    if (product && product.stock <= 0) {
        alert('❌ এই পণ্যটির স্টক শেষ হয়েছে');
        return;
    }
    
    cart.length = 0;
    cart.push({ name, price, delivery, qty: 1, image });
    updateCartUI();
    renderCartPopup();
    detailsModal.style.display = 'none';
    checkoutModal.style.display = 'flex';
}

function updateCartUI() {
    let sub = 0, cnt = 0, high = 0;
    cart.forEach(i => {
        sub += i.price * i.qty;
        cnt += i.qty;
        if (i.delivery > high) high = i.delivery;
    });
    const total = sub + high;
    cartCount.innerText = cnt;
    cartTotal.innerText = `BDT ${total}`;
}

function updateCartItemQuantity(index, newQty) {
    if (newQty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].qty = newQty;
    }
    updateCartUI();
    renderCartPopup();
}

function renderCartPopup() {
    popupCartList.innerHTML = '';
    let sub = 0, high = 0;
    
    cart.forEach((item, idx) => {
        sub += item.price * item.qty;
        if (item.delivery > high) high = item.delivery;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        
        let imageUrl = item.image || 'https://via.placeholder.com/50x50?text=No+Image';
        if (imageUrl && imageUrl.includes('drive.google.com')) {
            const fileId = imageUrl.match(/[-\w]{25,}/);
            if (fileId) {
                imageUrl = `https://drive.google.com/uc?export=view&id=${fileId[0]}`;
            }
        }
        
        div.innerHTML = `
            <img src="${imageUrl}" class="cart-item-image" alt="${item.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/50x50?text=No+Image';">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">BDT ${item.price}</div>
            </div>
            <div class="cart-item-actions">
                <button class="cart-item-qty-btn" data-index="${idx}" data-action="decrease">-</button>
                <span class="cart-item-qty">${item.qty}</span>
                <button class="cart-item-qty-btn" data-index="${idx}" data-action="increase">+</button>
                <button class="cart-item-remove" data-index="${idx}">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        popupCartList.appendChild(div);
    });

    // Quantity buttons event listeners
    document.querySelectorAll('.cart-item-qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const action = btn.dataset.action;
            const product = products.find(p => p.name === cart[index].name);
            
            if (action === 'increase') {
                if (product && product.stock < cart[index].qty + 1) {
                    alert('❌ স্টক শেষ');
                    return;
                }
                updateCartItemQuantity(index, cart[index].qty + 1);
            } else if (action === 'decrease') {
                updateCartItemQuantity(index, cart[index].qty - 1);
            }
        });
    });

    // Remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            cart.splice(index, 1);
            updateCartUI();
            renderCartPopup();
            
            if (cart.length === 0) {
                const submitBtn = document.getElementById('submitOrderBtn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.style.background = 'var(--neutral-400)';
                    submitBtn.style.cursor = 'not-allowed';
                    submitBtn.innerText = 'প্রথমে পণ্য নির্বাচন করুন';
                }
            }
        });
    });

    const final = sub + high;
    popupSubtotal.innerText = `BDT ${sub}`;
    popupDelivery.innerText = `BDT ${high}`;
    popupFinal.innerText = `BDT ${final}`;
    
    const orderId = generateOrderId();
    orderIdInput.value = orderId;
    
    const detailedProducts = cart.map(item => ({
        name: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
        deliveryCharge: item.delivery
    }));
    
    productsInput.value = JSON.stringify(detailedProducts);
    totalInput.value = final;
    
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
        if (cart.length === 0) {
            submitBtn.disabled = true;
            submitBtn.style.background = 'var(--neutral-400)';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.innerText = 'প্রথমে পণ্য নির্বাচন করুন';
        } else {
            submitBtn.disabled = false;
            submitBtn.style.background = 'var(--accent)';
            submitBtn.style.cursor = 'pointer';
            submitBtn.innerText = 'অর্ডার কনফার্ম করুন';
        }
    }
}

// ========== RECEIPT GENERATION FUNCTIONS ==========
function generateReceiptHTML(orderData) {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('bn-BD');
    
    let productsHTML = '';
    let subtotal = 0;
    let maxDelivery = 0;
    
    orderData.products.forEach(item => {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;
        if (item.deliveryCharge > maxDelivery) maxDelivery = item.deliveryCharge;
        
        productsHTML += `
            <tr>
                <td style="word-break: break-word;">${item.name}</td>
                <td>${item.quantity}</td>
                <td>BDT ${item.unitPrice}</td>
                <td>BDT ${itemTotal}</td>
            </tr>
        `;
    });
    
    const total = subtotal + maxDelivery;
    
    const emailHTML = orderData.customerEmail ? `
        <p><i class="fa-regular fa-envelope"></i> ইমেইল: ${orderData.customerEmail}</p>
    ` : '';
    
    return `
        <div class="receipt-container">
            <div class="receipt-header">
                <img src="https://res.cloudinary.com/doirlqqmx/image/upload/v1753706940/file_00000000365061f68e458716aa2787c3_pnwqym.png" alt="Angor Bazar" class="receipt-logo">
                <h2 class="receipt-title">আঙ্গর বাজার</h2>
                <div class="receipt-subtitle">অর্ডার রসিদ</div>
            </div>
            
            <div class="receipt-order-info">
                <div class="receipt-order-info-item">
                    <div class="receipt-order-info-label">অর্ডার নম্বর</div>
                    <div class="receipt-order-info-value">#${orderData.orderId}</div>
                </div>
                <div class="receipt-order-info-item">
                    <div class="receipt-order-info-label">তারিখ</div>
                    <div class="receipt-order-info-value">${formattedDate}</div>
                </div>
                <div class="receipt-order-info-item">
                    <div class="receipt-order-info-label">সময়</div>
                    <div class="receipt-order-info-value">${formattedTime}</div>
                </div>
            </div>
            
            <div class="receipt-customer-details">
                <h4><i class="fa-regular fa-user"></i> গ্রাহকের তথ্য</h4>
                <p><i class="fa-regular fa-user"></i> নাম: ${orderData.customerName}</p>
                ${emailHTML}
                <p><i class="fa-regular fa-phone"></i> মোবাইল: ${orderData.customerPhone}</p>
                <p><i class="fa-regular fa-location-dot"></i> ঠিকানা: ${orderData.customerAddress}</p>
            </div>
            
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>পণ্যের নাম</th>
                        <th>পরিমাণ</th>
                        <th>ইউনিট মূল্য</th>
                        <th>মোট</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                </tbody>
            </table>
            
            <div class="receipt-summary">
                <div class="receipt-summary-row">
                    <span>সাবটোটাল:</span>
                    <span>BDT ${subtotal}</span>
                </div>
                <div class="receipt-summary-row">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>BDT ${maxDelivery}</span>
                </div>
                <div class="receipt-summary-row total">
                    <span>সর্বমোট:</span>
                    <span>BDT ${total}</span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p class="highlight">ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য</p>
                <p>পেমেন্ট: ক্যাশ অন ডেলিভারি</p>
                <p>যেকোনো সমস্যায় যোগাযোগ করুন: 01626813764</p>
                <p style="margin-top: 10px; font-size: 0.7rem;">এটি একটি কম্পিউটার কর্তৃক তৈরি রসিদ, স্বাক্ষরের প্রয়োজন নেই</p>
            </div>
        </div>
    `;
}

async function downloadPDFReceipt(orderData) {
    if (!orderData) {
        alert('❌ কোনো অর্ডার তথ্য পাওয়া যায়নি');
        return;
    }
    
    try {
        msgBox.innerText = 'PDF তৈরি হচ্ছে... দয়া করে অপেক্ষা করুন';
        
        const receiptHTML = generateReceiptHTML(orderData);
        
        pdfReceiptDiv.innerHTML = receiptHTML;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(pdfReceiptDiv.firstElementChild, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true,
            useCORS: true
        });
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width * 0.75, canvas.height * 0.75]
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
        
        pdf.save(`AngorBazar_Order_${orderData.orderId}.pdf`);
        
        pdfReceiptDiv.innerHTML = '';
        
        msgBox.innerText = '✅ PDF ডাউনলোড সম্পন্ন হয়েছে';
        setTimeout(() => { msgBox.innerText = ''; }, 3000);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        msgBox.innerText = '❌ PDF তৈরি করতে সমস্যা হয়েছে';
        setTimeout(() => { msgBox.innerText = ''; }, 3000);
    }
}

function showReceiptModal(orderData) {
    const receiptHTML = generateReceiptHTML(orderData);
    receiptContent.innerHTML = receiptHTML;
    receiptModal.style.display = 'flex';
    
    downloadPDFBtn.onclick = () => downloadPDFReceipt(orderData);
    
    printReceiptBtn.onclick = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>অর্ডার রসিদ #${orderData.orderId}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Hind Siliguri', sans-serif; padding: 20px; margin: 0; }
                        .receipt-container { max-width: 800px; margin: 0 auto; }
                        ${document.querySelector('style').innerHTML}
                    </style>
                </head>
                <body>
                    ${receiptHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
}

// Close receipt modal
if (closeReceiptModal) {
    closeReceiptModal.onclick = () => {
        receiptModal.style.display = 'none';
    };
}

window.onclick = (e) => {
    if (e.target === receiptModal) {
        receiptModal.style.display = 'none';
    }
    if (e.target === checkoutModal) {
        checkoutModal.style.display = 'none';
        orderIdDisplay.style.display = 'none';
    }
    if (e.target === detailsModal) detailsModal.style.display = 'none';
};

// ========== SEARCH FUNCTIONALITY ==========
function filterProducts() {
    const query = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;
    
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.dataset.name || '';
        const matchesSearch = name.includes(query);
        
        if (matchesSearch) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    let noResults = document.querySelector('.no-results-dynamic');
    if (visibleCount === 0 && products.length > 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'no-results no-results-dynamic';
            noResults.innerText = 'কোন পণ্য পাওয়া যায়নি';
            productGrid.appendChild(noResults);
        }
    } else {
        if (noResults) noResults.remove();
    }
}

if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
}

if (searchBtn) {
    searchBtn.addEventListener('click', filterProducts);
}

filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterProducts();
    });
});

// ========== NEXT BUTTON ==========
if (nextBtn) {
    nextBtn.onclick = () => {
        const start = currentPage * PER_PAGE;
        renderProducts(start);
    };
}

// ========== MODAL CONTROLS ==========
if (openCheckout) {
    openCheckout.onclick = () => {
        if (!cart.length) { 
            alert('🛒 আপনার কার্ট খালি। প্রথমে পণ্য নির্বাচন করুন'); 
            return; 
        }
        renderCartPopup();
        checkoutModal.style.display = 'flex';
    };
}

if (closeCheckout) {
    closeCheckout.onclick = () => {
        checkoutModal.style.display = 'none';
        orderIdDisplay.style.display = 'none';
    };
}

if (closeDetails) {
    closeDetails.onclick = () => detailsModal.style.display = 'none';
}

// ========== ORDER FORM WITH CART VALIDATION ==========
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.onsubmit = function(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('❌ আপনার কার্ট খালি। প্রথমে পণ্য নির্বাচন করুন');
            return;
        }
        
        const phoneInput = this.querySelector('input[name="phone"]');
        const phoneValue = phoneInput.value;
        const nameInput = this.querySelector('input[name="name"]');
        const emailInput = this.querySelector('input[name="email"]');
        const addressInput = this.querySelector('textarea[name="address"]');
        const emailValue = emailInput.value;
        
        if (emailValue && !validateEmail(emailValue)) {
            alert('❌ সঠিক ইমেইল ঠিকানা দিন');
            return;
        }
        
        phoneRawInput.value = phoneValue;
        
        if (!phoneValue.match(/^01[3-9]\d{8}$/)) {
            alert('❌ সঠিক মোবাইল নাম্বার দিন (যেমন: 01712345678)');
            return;
        }
        
        const btn = this.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerText = 'সাবমিট হচ্ছে...';
        
        const form = new FormData(this);
        form.set('phone', phoneValue);
        
        lastOrderData = {
            orderId: orderIdInput.value,
            customerName: nameInput.value,
            customerEmail: emailValue,
            customerPhone: phoneValue,
            customerAddress: addressInput.value,
            products: JSON.parse(productsInput.value || '[]')
        };
        
        fetch(POST_URL, { 
            method: 'POST', 
            body: form
        })
            .then(response => response.text())
            .then(data => {
                console.log('Success:', data);
                
                checkoutModal.style.display = 'none';
                showReceiptModal(lastOrderData);
                
                cart.length = 0;
                updateCartUI();
                
                btn.disabled = false;
                btn.innerText = 'অর্ডার কনফার্ম করুন';
                
                this.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                
                checkoutModal.style.display = 'none';
                showReceiptModal(lastOrderData);
                
                cart.length = 0;
                updateCartUI();
                
                btn.disabled = false;
                btn.innerText = 'অর্ডার কনফার্ম করুন';
                
                this.reset();
            });
    };
}