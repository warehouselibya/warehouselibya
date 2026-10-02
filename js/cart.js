/**
 * ============================================================================
 * شركة المستودع | Warehouse - نظام إدارة سلة المشتريات (Cart System)
 * ============================================================================
 * يضمن هذا النظام تطبيق الحد الأدنى للطلب (minQty) لكل منتج عند الإضافة والتعديل
 */

class CartManager {
    constructor() {
        this.storageKey = 'warehouse_cart_items';
        this.cart = this.loadCart();
        this.init();
    }

    init() {
        this.updateBadge();
        this.bindEvents();
    }

    // استرجاع السلة من التخزين المحلي مع التحقق من الحد الأدنى للكميات
    loadCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return [];
            
            const items = JSON.parse(saved);
            if (!Array.isArray(items)) return [];

            // مزامنة الحد الأدنى وتحديث أي كمية أقل من الحد الأدنى
            return items.map(item => {
                let prodId = Number(item.productId || item.id);
                if (isNaN(prodId) && typeof item.id === 'string' && item.id.includes('-')) {
                    prodId = Number(item.id.split('-')[0]);
                }
                const product = typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA.find(p => p.id === prodId) : null;
                const minQty = product && product.minQty ? product.minQty : (item.minQty || 1);
                const unit = product && product.unit ? product.unit : (item.unit || "قطعة");
                const price = (typeof item.price === 'number') ? item.price : (product && product.price ? product.price : item.price);
                const image = item.image || (product && product.image ? product.image : '');
                const name = item.name || (product && product.name ? product.name : '');

                return {
                    ...item,
                    productId: prodId || item.id,
                    name,
                    price,
                    unit,
                    image,
                    minQty,
                    quantity: Math.max(minQty, Number(item.quantity) || minQty)
                };
            });
        } catch (e) {
            console.error("Error reading cart from localStorage:", e);
            return [];
        }
    }

    // حفظ السلة في التخزين المحلي
    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
            this.updateBadge();
            this.renderCartDrawer();
        } catch (e) {
            console.error("Error saving cart to localStorage:", e);
        }
    }

    // إضافة منتج إلى السلة مع تطبيق الحد الأدنى للطلب ودعم خيارات الأحجام
    addToCart(productId, quantity = null, sizeOption = null) {
        const product = PRODUCTS_DATA.find(p => p.id === Number(productId));
        if (!product) {
            this.showToast("عذرًا، المنتج غير متوفر حاليًا", "error");
            return;
        }

        const minQty = product.minQty || 1;
        const opt = sizeOption || (product.sizeOptions ? product.sizeOptions[0] : null);
        const itemId = opt ? opt.id : product.id;
        const itemPrice = opt ? opt.price : product.price;
        const itemName = opt ? `${product.name.split('(')[0].trim()} (${opt.size})` : product.name;

        const existingItem = this.cart.find(item => String(item.id) === String(itemId));

        if (existingItem) {
            // إذا كان المنتج موجوداً بالفعل في السلة، يتم زيادة الكمية
            const addAmount = quantity !== null ? Math.max(1, Number(quantity)) : 1;
            existingItem.quantity += addAmount;
            this.showToast(`تمت زيادة كمية "${existingItem.name}" إلى ${existingItem.quantity} ${product.unit} ✨`);
        } else {
            // إذا كان المنتج جديداً في السلة، يبدأ من الحد الأدنى على الأقل
            const initialQty = quantity !== null ? Math.max(minQty, Number(quantity)) : minQty;
            this.cart.push({
                id: itemId,
                productId: product.id,
                name: itemName,
                price: itemPrice,
                unit: product.unit,
                image: product.image,
                minQty: minQty,
                quantity: initialQty,
                size: opt ? opt.size : null
            });
            this.showToast(`تمت إضافة "${itemName}" بالحد الأدنى (${initialQty} ${product.unit}) إلى السلة بنجاح ✨`);
        }

        this.saveCart();
        this.animateBadge();
    }

    // تحديث كمية منتج مع منع النزول عن الحد الأدنى
    updateQuantity(productId, newQty) {
        const item = this.cart.find(i => String(i.id) === String(productId));
        if (!item) return;

        const minQty = item.minQty || 1;
        const targetQty = Number(newQty);

        if (isNaN(targetQty) || targetQty < minQty) {
            item.quantity = minQty;
            this.showToast(`⚠️ أقل كمية للطلب من "${item.name}" هي ${minQty} ${item.unit}. لا يمكن طلب أقل من ذلك.`, "warning");
            this.saveCart();
        } else {
            item.quantity = targetQty;
            this.saveCart();
        }
    }

    // زيادة الكمية بواحد
    increaseQty(productId) {
        const item = this.cart.find(i => String(i.id) === String(productId));
        if (item) {
            this.updateQuantity(productId, item.quantity + 1);
        }
    }

    // إنقاص الكمية بواحد مع منع النزول عن الحد الأدنى
    decreaseQty(productId) {
        const item = this.cart.find(i => String(i.id) === String(productId));
        if (!item) return;

        const minQty = item.minQty || 1;

        if (item.quantity > minQty) {
            this.updateQuantity(productId, item.quantity - 1);
        } else {
            this.showToast(`⚠️ أقل كمية للطلب من هذا المنتج هي ${minQty} ${item.unit}. لحذف المنتج اضغط على زر الحذف (🗑️)`, "warning");
        }
    }

    // حذف منتج من السلة
    removeFromCart(productId) {
        const itemIndex = this.cart.findIndex(i => String(i.id) === String(productId));
        if (itemIndex > -1) {
            const removedItem = this.cart[itemIndex];
            this.cart.splice(itemIndex, 1);
            this.saveCart();
            this.showToast(`تم حذف "${removedItem.name}" من السلة`, "info");
        }
    }

    // إفراغ السلة بالكامل
    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    // إجمالي عدد العناصر
    getCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    // إجمالي المبلغ بالدينار
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // تحديث الشارة في الهيدر والزر العائم والقائمة
    updateBadge() {
        const count = this.getCount();
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });

        // تحديث أي شارة في القائمة الجانبية
        const inlineBadges = document.querySelectorAll('.cart-badge-inline');
        inlineBadges.forEach(b => {
            b.textContent = count > 0 ? `(${count})` : '';
            b.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }

    // حركة اهتزاز الشارة عند الإضافة
    animateBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.classList.add('bump');
            setTimeout(() => badge.classList.remove('bump'), 300);
        });
    }

    // عرض عناصر السلة في الدرج الجانبي
    renderCartDrawer() {
        const cartBody = document.getElementById('cartDrawerBody');
        const cartFooter = document.getElementById('cartDrawerFooter');
        const cartTotalDisplay = document.getElementById('cartDrawerTotal');
        const cartCountDisplay = document.getElementById('cartDrawerCount');

        if (!cartBody) return;

        if (this.cart.length === 0) {
            cartBody.innerHTML = `
                <div class="cart-empty-view">
                    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 16px;">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h4 style="font-size: 1.15rem; color: var(--color-primary); margin-bottom: 8px;">سلة المشتريات فارغة</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">لم تقم بإضافة أي منتجات بالجملة بعد</p>
                    <a href="products.html" class="btn btn-primary btn-sm" onclick="cartManager.closeCartDrawer()">تصفح المنتجات الآن</a>
                </div>
            `;
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        }

        if (cartFooter) cartFooter.style.display = 'block';

        const currency = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.currency) ? STORE_CONFIG.currency : 'د.ل';

        let html = '';
        this.cart.forEach(item => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            const subtotal = (itemPrice * itemQty).toFixed(2);
            const isAtMin = itemQty <= (item.minQty || 1);
            const itemImg = item.image || 'assets/images/logo.png';
            const itemUnit = item.unit || 'قطعة';
            
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${itemImg}" alt="${item.name}" class="cart-item-img" loading="lazy" decoding="async" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\.webp$/i,'.png');}else{this.onerror=null;this.src='assets/images/logo.png';}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">سعر الوحدة: ${itemPrice.toFixed(2)} ${currency}</div>
                        <div style="font-size: 0.8rem; color: var(--color-primary); font-weight: 600; margin: 2px 0;">
                            ⚡ الحد الأدنى للطلب: ${item.minQty || 1} ${itemUnit}
                        </div>
                        <div class="cart-item-subtotal">الإجمالي: ${subtotal} ${currency}</div>
                        <div class="cart-qty-controls">
                            <button class="qty-btn ${isAtMin ? 'qty-btn-disabled' : ''}" onclick="cartManager.decreaseQty(${item.id})" title="${isAtMin ? 'الحد الأدنى للطلب' : 'إنقاص'}">-</button>
                            <span class="qty-value">${itemQty}</span>
                            <button class="qty-btn" onclick="cartManager.increaseQty(${item.id})" title="زيادة">+</button>
                        </div>
                    </div>
                    <button class="cart-item-delete" onclick="cartManager.removeFromCart(${item.id})" title="حذف من السلة">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        });

        cartBody.innerHTML = html;

        if (cartTotalDisplay) {
            cartTotalDisplay.textContent = `${this.getTotal().toFixed(2)} ${currency}`;
        }
        if (cartCountDisplay) {
            cartCountDisplay.textContent = `(${this.getCount()} قطعة/عبوة)`;
        }
    }

    // فتح درج السلة
    openCartDrawer() {
        const drawer = document.getElementById('cartDrawer');
        const backdrop = document.getElementById('cartBackdrop') || document.getElementById('cartDrawerBackdrop');
        if (drawer) {
            this.renderCartDrawer();
            drawer.classList.add('open');
            if (backdrop) backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // إغلاق درج السلة
    closeCartDrawer() {
        const drawer = document.getElementById('cartDrawer');
        const backdrop = document.getElementById('cartBackdrop') || document.getElementById('cartDrawerBackdrop');
        if (drawer) {
            drawer.classList.remove('open');
            if (backdrop) backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ربط الأحداث العامة
    bindEvents() {
        // تفويض الأحداث للنقر على أي زر فتح للسلة في الصفحة
        document.addEventListener('click', (e) => {
            const openBtn = e.target.closest('.cart-toggle-btn, .open-cart-btn, #openCartBtn, .floating-cart-btn, .mobile-cart-link');
            if (openBtn) {
                e.preventDefault();
                this.openCartDrawer();
                return;
            }

            const closeBtn = e.target.closest('#cartDrawerClose, #cartDrawerCloseBtn, .cart-drawer-close, .close-cart-btn');
            if (closeBtn) {
                e.preventDefault();
                this.closeCartDrawer();
                return;
            }

            if (e.target.id === 'cartBackdrop' || e.target.id === 'cartDrawerBackdrop') {
                this.closeCartDrawer();
                return;
            }
        });

        // إغلاق السلة عند الضغط على زر Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCartDrawer();
            }
        });
    }

    // إظهار إشعار عائم (Toast Notification) مع زر استعراض السلة مباشرة
    showToast(message, type = "success") {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} toast-message`;
        
        let iconSvg = '';
        if (type === 'warning') {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        }

        const viewCartBtn = (type === 'success' && this.cart.length > 0)
            ? `<button class="toast-cart-btn" onclick="cartManager.openCartDrawer();" title="عرض السلة">عرض السلة 🛒</button>`
            : '';

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex-grow: 1;">
                ${iconSvg}
                <span>${message}</span>
            </div>
            ${viewCartBtn}
        `;

        toastContainer.appendChild(toast);

        // إخفاء وحذف بعد 4 ثوانٍ
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
}

// إنشاء نسخة عامة واحدة لمدير السلة
const cartManager = new CartManager();