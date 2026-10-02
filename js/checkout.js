/**
 * ============================================================================
 * شركة المستودع | Warehouse - نظام إتمام الطلب وتوليد الفاتورة والواتساب
 * ============================================================================
 */

class CheckoutManager {
    constructor() {
        this.currentInvoice = null;
        this.bindEvents();
    }

    // فتح نافذة إدخال بيانات العميل
    openCheckoutModal() {
        if (cartManager.cart.length === 0) {
            cartManager.showToast("يرجى إضافة منتجات إلى السلة أولاً", "error");
            return;
        }

        cartManager.closeCartDrawer();
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    // إغلاق نافذة إدخال البيانات
    closeCheckoutModal() {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // توليد رقم فاتورة تسلسلي فريد
    generateInvoiceNumber() {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `WH-2026-${randomNum}`;
    }

    // تنسيق التاريخ والوقت باللغة العربية
    getFormattedDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        };
        return now.toLocaleDateString('ar-LY', options);
    }

    // معالجة نموذج الطلب وتوليد الفاتورة
    processCheckout(e) {
        if (e) e.preventDefault();

        const nameInput = document.getElementById('customerName');
        const phoneInput = document.getElementById('customerPhone');
        const storeInput = document.getElementById('customerStore');
        const addressInput = document.getElementById('customerAddress');
        const notesInput = document.getElementById('customerNotes');

        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const storeName = storeInput ? storeInput.value.trim() : '';
        const address = addressInput ? addressInput.value.trim() : '';
        const notes = notesInput ? notesInput.value.trim() : '';

        // التحقق من الحقول الإلزامية
        if (!name || !phone || !storeName || !address) {
            cartManager.showToast("يرجى ملء جميع الحقول المطلوبة بالبيانات الصحيحة", "error");
            return;
        }

        // إنشاء كائن الفاتورة
        this.currentInvoice = {
            invoiceNumber: this.generateInvoiceNumber(),
            date: this.getFormattedDate(),
            customer: {
                name,
                phone,
                storeName,
                address,
                notes: notes || "لا توجد ملاحظات إضافية"
            },
            items: [...cartManager.cart],
            total: cartManager.getTotal()
        };

        // إغلاق نموذج الإدخال وفتح معاينة الفاتورة
        this.closeCheckoutModal();
        this.renderInvoicePreview();
        this.openInvoiceModal();
    }

    // فتح نافذة معاينة الفاتورة
    openInvoiceModal() {
        const modal = document.getElementById('invoicePreviewModal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    // إغلاق نافذة معاينة الفاتورة
    closeInvoiceModal() {
        const modal = document.getElementById('invoicePreviewModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // عرض تفاصيل الفاتورة في النافذة مع صورة كل صنف بجانبه
    renderInvoicePreview() {
        const inv = this.currentInvoice;
        if (!inv) return;

        const container = document.getElementById('invoiceDetailsContent');
        if (!container) return;

        const currency = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.currency) ? STORE_CONFIG.currency : 'د.ل';

        let itemsRows = '';
        inv.items.forEach((item, index) => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            const subtotal = (itemPrice * itemQty).toFixed(2);
            const itemImg = item.image || 'assets/images/logo.png';
            const itemUnit = item.unit || 'قطعة';

            itemsRows += `
                <tr>
                    <td style="text-align: center; width: 35px; font-weight: bold; color: var(--text-muted);">${index + 1}</td>
                    <td style="width: 70px; text-align: center; padding: 6px;">
                        <img src="${itemImg}" alt="${item.name}" class="invoice-item-img" loading="lazy" decoding="async" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\.webp$/i,'.png');}else{this.onerror=null;this.src='assets/images/logo.png';}">
                    </td>
                    <td>
                        <div class="invoice-item-name">${item.name}</div>
                        <div class="invoice-item-specs">
                            <span>العبوة: ${itemUnit}</span>
                            <span class="invoice-min-tag">الحد الأدنى: ${item.minQty || 1}</span>
                            ${item.size ? `<span class="invoice-size-tag" style="background: rgba(30, 58, 138, 0.1); color: var(--color-primary); padding: 1px 6px; border-radius: 4px; font-weight: bold;">الحجم: ${item.size}</span>` : ''}
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: 600; white-space: nowrap;">${itemPrice.toFixed(2)} ${currency}</td>
                    <td style="text-align: center; font-weight: 800; font-size: 1.05rem; color: var(--color-primary);">${itemQty}</td>
                    <td style="text-align: left; font-weight: 800; font-size: 1rem; color: var(--color-secondary); white-space: nowrap;">${subtotal} ${currency}</td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div class="invoice-preview-container">
                <div class="invoice-header-row">
                    <div class="invoice-brand" style="display: flex; align-items: center; gap: 15px;">
                        <img src="assets/images/logo.png" alt="شركة المستودع" style="height: 55px; width: auto; object-fit: contain;">
                        <div>
                            <h2>${STORE_CONFIG.storeName} | ${STORE_CONFIG.storeNameEn}</h2>
                            <p>${STORE_CONFIG.tagline}</p>
                            <p style="margin-top: 4px; font-size: 0.85rem; color: var(--color-accent-hover);">هاتف المبيعات: ${STORE_CONFIG.phone}</p>
                        </div>
                    </div>
                    <div class="invoice-meta-box">
                        <div class="invoice-number-tag">فاتورة: ${inv.invoiceNumber}</div>
                        <div class="invoice-date">التاريخ: ${inv.date}</div>
                    </div>
                </div>

                <div class="invoice-client-card">
                    <div class="client-info-item">
                        <strong>اسم العميل:</strong> ${inv.customer.name}
                    </div>
                    <div class="client-info-item">
                        <strong>اسم المتجر / النشاط:</strong> ${inv.customer.storeName}
                    </div>
                    <div class="client-info-item">
                        <strong>رقم الهاتف:</strong> ${inv.customer.phone}
                    </div>
                    <div class="client-info-item">
                        <strong>العنوان والمدينة:</strong> ${inv.customer.address}
                    </div>
                    <div class="client-info-item" style="grid-column: 1 / -1;">
                        <strong>ملاحظات الطلب:</strong> ${inv.customer.notes}
                    </div>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th style="text-align: center; width: 35px;">#</th>
                            <th style="text-align: center; width: 70px;">الصورة</th>
                            <th>المنتج والمواصفات</th>
                            <th style="text-align: center; width: 95px;">سعر الوحدة</th>
                            <th style="text-align: center; width: 65px;">الكمية</th>
                            <th style="text-align: left; width: 100px;">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div class="invoice-total-card">
                    <span>إجمالي قيمة الطلب بالجملة (${cartManager.getCount()} قطعة/عبوة):</span>
                    <span>${inv.total.toFixed(2)} ${currency}</span>
                </div>

                <div class="invoice-footer-stamp">
                    <div style="font-size: 0.85rem; color: var(--text-muted);">
                        * هذه الفاتورة صادرة إلكترونياً من منصة شركة المستودع لتجارة الجملة وجملة الجملة.
                    </div>
                    <div class="stamp-badge">
                        <span>✓ فاتورة معتمدة ومجهزة للتوريد</span>
                    </div>
                </div>
            </div>
        `;
    }

    // بناء نص رسالة الواتساب بتنسيق Markdown أنيق واحترافي
    buildWhatsAppMessage(inv) {
        const currency = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.currency) ? STORE_CONFIG.currency : 'د.ل';

        let itemsListText = '';
        inv.items.forEach((item, index) => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            const subtotal = (itemPrice * itemQty).toFixed(2);
            const itemUnit = item.unit ? ` (${item.unit})` : '';

            // اختصار اسم المنتج الطويل بذكاء مع الحفاظ التام على الحجم المختار
            let name = (item.name || '').trim();
            if (name.length > 55) {
                if (item.size) {
                    const base = name.split('(')[0].trim();
                    const shortBase = base.length > 36 ? base.substring(0, 34) + '...' : base;
                    name = `${shortBase} [الحجم: ${item.size}]`;
                } else {
                    name = name.substring(0, 52) + '...';
                }
            } else if (item.size && !name.includes(item.size)) {
                name = `${name} [الحجم: ${item.size}]`;
            }
            itemsListText += `${index + 1}. *${name}*\n   الكمية: ${itemQty}${itemUnit} | الإجمالي: ${subtotal} ${currency}\n`;
        });

        return `*طلب شراء جديد - شركة المستودع* 📦\n` +
               `--------------------------------\n` +
               `📄 *رقم الفاتورة:* ${inv.invoiceNumber}\n` +
               `📅 *التاريخ:* ${inv.date}\n\n` +
               `👤 *بيانات العميل:*` +
               `\n• *الاسم:* ${inv.customer.name}` +
               `\n• *المتجر / النشاط:* ${inv.customer.storeName}` +
               `\n• *الهاتف:* ${inv.customer.phone}` +
               `\n• *العنوان:* ${inv.customer.address}\n\n` +
               `🛒 *تفاصيل الطلبية:*` +
               `\n${itemsListText}` +
               `--------------------------------\n` +
               `💰 *إجمالي الفاتورة:* *${inv.total.toFixed(2)} ${currency}*\n` +
               `📝 *ملاحظات:* ${inv.customer.notes || 'لا توجد'}\n` +
               `--------------------------------\n` +
               `يرجى تأكيد استلام الطلب وتجهيزه للشحن والتسليم 🚚✨`;
    }

    // توليد رابط الواتساب المعتمد بدون أخطاء
    getWhatsAppUrl(message) {
        const rawPhone = (typeof STORE_CONFIG !== 'undefined' && STORE_CONFIG.whatsappNumber) ? STORE_CONFIG.whatsappNumber : '218910055702';
        const cleanPhone = String(rawPhone).replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    }

    // نسخ نص الفاتورة كاملاً للحافظة
    async copyInvoiceText(showToast = true) {
        const inv = this.currentInvoice;
        if (!inv) return false;

        const message = this.buildWhatsAppMessage(inv);
        let copied = false;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(message);
                copied = true;
            }
        } catch (e) {
            // سيتم استخدام البديل أدناه
        }

        if (!copied) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = message;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                textarea.style.top = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                copied = document.execCommand('copy');
                document.body.removeChild(textarea);
            } catch (err) {
                console.warn("Could not copy invoice text:", err);
            }
        }

        if (showToast) {
            if (copied) {
                cartManager.showToast("تم نسخ نص الفاتورة بالكامل للحافظة! 📋", "success");
            } else {
                cartManager.showToast("تعذر نسخ النص تلقائياً، يرجى النسخ اليدوي", "warning");
            }
        }
        return copied;
    }

    // عرض بطاقة نجاح وتأكيد الإرسال داخل نافذة الفاتورة
    showWhatsAppSuccessCard(whatsappUrl) {
        const existingBanner = document.getElementById('whatsappSuccessBanner');
        if (existingBanner) existingBanner.remove();

        const container = document.querySelector('.invoice-preview-container');
        if (!container) return;

        const banner = document.createElement('div');
        banner.id = 'whatsappSuccessBanner';
        banner.className = 'whatsapp-success-banner';
        banner.innerHTML = `
            <div class="whatsapp-success-header">
                <span class="whatsapp-success-icon">✅</span>
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #166534; font-size: 1.05rem; font-weight: 800;">تم تجهيز الفاتورة وإرسالها إلى WhatsApp!</h4>
                    <p style="margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.5;">
                        تم نسخ تفاصيل الطلب تلقائياً للحافظة. إذا لم تفتح نافذة المحادثة تلقائياً، اضغط على الزر الأخضر أدناه:
                    </p>
                </div>
            </div>
            <div class="whatsapp-success-actions">
                <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" id="directWhatsAppLinkBtn" style="padding: 8px 16px;">
                    فتح محادثة WhatsApp الآن 💬
                </a>
                <button type="button" class="btn btn-outline btn-sm" id="copyInvoiceTextActionBtn" title="نسخ تفاصيل الفاتورة كنص">
                    نسخ نص الفاتورة 📋
                </button>
                <button type="button" class="btn btn-outline btn-sm" id="downloadInvoiceImgActionBtn" title="تحميل صورة الفاتورة">
                    تحميل صورة الفاتورة (PNG) 📥
                </button>
                <button type="button" class="btn btn-primary btn-sm" id="finishAndClearCartBtn" style="margin-right: auto;" title="إفراغ السلة بعد إرسال الطلب">
                    إنهاء الطلب وتفريغ السلة ✓
                </button>
            </div>
        `;

        container.prepend(banner);

        const modalBody = document.getElementById('invoiceDetailsContent');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }

    // إرسال الفاتورة المضمون إلى WhatsApp بدون حظر المتصفحات
    async sendOrderToWhatsApp() {
        const inv = this.currentInvoice;
        if (!inv) {
            cartManager.showToast("حدث خطأ في قراءة بيانات الفاتورة", "error");
            return;
        }

        const sendBtn = document.getElementById('sendWhatsAppOrderBtn');
        const originalBtnHtml = sendBtn ? sendBtn.innerHTML : '';
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = `
                <span style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-left:6px; vertical-align:middle;"></span>
                جاري التوجيه إلى WhatsApp...
            `;
        }

        try {
            const rawMessage = this.buildWhatsAppMessage(inv);
            const whatsappUrl = this.getWhatsAppUrl(rawMessage);

            // 1. نسخ نص الطلب للحافظة فوراً لتسهيل اللصق
            await this.copyInvoiceText(false);

            // 2. فتح الواتساب بشكل متزامن مباشر (Synchronous) لمنع حظر النافذة نهائياً (Popup Blocker)
            let windowOpened = false;
            try {
                const newWin = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                if (newWin && !newWin.closed && typeof newWin.closed !== 'undefined') {
                    windowOpened = true;
                }
            } catch (wErr) {
                console.warn("Popup blocked or not permitted:", wErr);
            }

            // على الهواتف الذكية أو في حال حظر النافذة المنبثقة
            const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (!windowOpened && isMobile) {
                window.location.href = whatsappUrl;
                windowOpened = true;
            }

            // 3. عرض شريط تأكيد الإرسال داخل المعاينة مع خيارات المتابعة
            this.showWhatsAppSuccessCard(whatsappUrl);

            // 4. إشعار العميل بالنجاح
            cartManager.showToast("تم فتح محادثة WhatsApp وتجهيز تفاصيل طلبك بنجاح! 🚀", "success");

            // 5. محاولة تنزيل صورة الفاتورة في الخلفية إذا أمكن بدون التأثير على تجربة المستخدم
            setTimeout(() => {
                this.downloadInvoiceImage(false).catch(() => {});
            }, 800);

        } catch (err) {
            console.error("Error in sendOrderToWhatsApp:", err);
            const rawMessage = this.buildWhatsAppMessage(inv);
            const fallbackUrl = this.getWhatsAppUrl(rawMessage);
            this.showWhatsAppSuccessCard(fallbackUrl);
            cartManager.showToast("يمكنك الضغط على زر فتح محادثة WhatsApp للمتابعة 💬", "info");
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalBtnHtml;
            }
        }
    }

    // توليد صورة الفاتورة المطبوعة بدقة فائقة عبر html2canvas
    async generateInvoiceImage() {
        const invoiceElement = document.querySelector('.invoice-preview-container');
        if (!invoiceElement) return null;

        if (typeof html2canvas === 'undefined') {
            console.error('html2canvas library is not loaded');
            return null;
        }

        try {
            invoiceElement.classList.add('rendering-invoice-image');

            // التقاط صورة الكانفاس للفاتورة بدقة استوديو بدون تلوث أمني
            const canvas = await html2canvas(invoiceElement, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 8000
            });

            invoiceElement.classList.remove('rendering-invoice-image');
            return canvas;
        } catch (error) {
            if (invoiceElement) invoiceElement.classList.remove('rendering-invoice-image');
            console.error('Error generating invoice image:', error);
            return null;
        }
    }

    // تحميل صورة الفاتورة المطبوعة كملف PNG
    async downloadInvoiceImage(showToast = true) {
        const inv = this.currentInvoice;
        if (!inv) return false;

        if (showToast) cartManager.showToast("جاري تجهيز صورة الفاتورة للتحميل... ⏳", "info");
        try {
            const canvas = await this.generateInvoiceImage();
            if (canvas) {
                const link = document.createElement('a');
                link.download = `فاتورة-طلب-${inv.invoiceNumber}.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                if (showToast) cartManager.showToast("تم تحميل صورة الفاتورة المطبوعة بنجاح! 📥", "success");
                return true;
            }
        } catch (err) {
            console.warn("Could not export canvas to image:", err);
            if (showToast) cartManager.showToast("تعذر استخراج الصورة، يمكنك استخدام زر الطباعة 🖨️", "warning");
        }
        return false;
    }

    // نسخ صورة الفاتورة إلى الحافظة
    async copyInvoiceImage() {
        const inv = this.currentInvoice;
        if (!inv) return;

        try {
            const canvas = await this.generateInvoiceImage();
            if (canvas) {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                if (blob && navigator.clipboard && window.ClipboardItem) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    cartManager.showToast("تم نسخ صورة الفاتورة إلى الحافظة! يمكنك لصقها (Ctrl+V) في محادثة الواتساب 📋✨", "success");
                    return;
                }
            }
        } catch (err) {
            console.error("Error copying invoice image:", err);
        }
        // الرجوع للتحميل في حال تعذر النسخ المباشر للصورة
        this.downloadInvoiceImage(true);
    }

    // طباعة الفاتورة
    printInvoice() {
        window.print();
    }

    // ربط الأحداث
    bindEvents() {
        document.addEventListener('click', (e) => {
            // زر إتمام الطلب من السلة
            if (e.target.closest('#checkoutBtn') || e.target.closest('.start-checkout-btn')) {
                e.preventDefault();
                this.openCheckoutModal();
                return;
            }

            // إغلاق نافذة Checkout
            if (e.target.closest('#checkoutModalClose') || e.target.closest('#cancelCheckoutBtn')) {
                this.closeCheckoutModal();
                return;
            }

            // إغلاق نافذة Invoice
            if (e.target.closest('#invoiceModalClose') || e.target.closest('#closeInvoiceBtn')) {
                this.closeInvoiceModal();
                return;
            }

            // زر إرسال للواتساب
            if (e.target.closest('#sendWhatsAppOrderBtn')) {
                e.preventDefault();
                this.sendOrderToWhatsApp();
                return;
            }

            // زر تحميل صورة الفاتورة PNG
            if (e.target.closest('#downloadInvoiceImageBtn') || e.target.closest('#downloadInvoiceImgActionBtn')) {
                e.preventDefault();
                this.downloadInvoiceImage(true);
                return;
            }

            // زر نسخ نص الفاتورة
            if (e.target.closest('#copyInvoiceTextBtn') || e.target.closest('#copyInvoiceTextActionBtn')) {
                e.preventDefault();
                this.copyInvoiceText(true);
                return;
            }

            // زر نسخ صورة الفاتورة للحافظة
            if (e.target.closest('#copyInvoiceImageBtn')) {
                e.preventDefault();
                this.copyInvoiceImage();
                return;
            }

            // زر إنهاء الطلب وتفريغ السلة بعد التأكيد
            if (e.target.closest('#finishAndClearCartBtn')) {
                e.preventDefault();
                cartManager.clearCart();
                this.closeInvoiceModal();
                cartManager.showToast("تم إنهاء الطلب وإفراغ السلة بنجاح! شكراً لتعاملك مع شركة المستودع 🎉", "success");
                return;
            }

            // زر الطباعة
            if (e.target.closest('#printInvoiceBtn')) {
                e.preventDefault();
                this.printInvoice();
                return;
            }
        });

        // إرسال نموذج العميل
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.processCheckout(e));
        }
    }
}

// تهيئة مدير إتمام الطلب
const checkoutManager = new CheckoutManager();
