/**
 * ============================================================================
 * شركة المستودع | Warehouse - ملف التحكم والتفاعل الرئيسي (App Controller)
 * ============================================================================
 */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });
} else {
    initApp();
}

function initApp() {
    try { initMobileNav(); } catch (e) { console.error('initMobileNav error:', e); }
    try { initNewsProductsCarousel(); } catch (e) { console.error('initNewsProductsCarousel error:', e); }
    try { initFeaturedProducts(); } catch (e) { console.error('initFeaturedProducts error:', e); }
    try { initCatalogPage(); } catch (e) { console.error('initCatalogPage error:', e); }
    try { initQuickViewModal(); } catch (e) { console.error('initQuickViewModal error:', e); }
    try { highlightActiveNavLink(); } catch (e) { console.error('highlightActiveNavLink error:', e); }
    try { initCardCarousels(); } catch (e) { console.error('initCardCarousels error:', e); }
}

/**
 * 1. التحكم في القائمة الجانبية للموبايل
 */
function initMobileNav() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const drawer = document.getElementById('mobileNavDrawer');
    const closeBtn = document.getElementById('mobileNavClose');
    const backdrop = document.getElementById('mobileNavBackdrop');

    if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', () => {
            drawer.classList.add('open');
            if (backdrop) backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    const closeMobileMenu = () => {
        if (drawer) drawer.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
    if (backdrop) backdrop.addEventListener('click', closeMobileMenu);
}

/**
 * 2. تمييز الرابط النشط في شريط التنقل
 */
function highlightActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.endsWith(href) || (href === 'index.html' && (currentPath.endsWith('/') || currentPath === '')))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * 3. إنشاء قالب بطاقة المنتج (Product Card Template) مع دعم الشرائح الدوارة للأصناف متعددة الأنواع
 */
function createProductCardHTML(product) {
    let initialPrice = product.price;
    let oldPriceHtml = product.oldPrice ? `<span class="old-price">${product.oldPrice.toFixed(2)} ${STORE_CONFIG.currency}</span>` : '';
    const badgeHtml = product.badge ? `<div class="product-badge-overlay">${product.badge}</div>` : '';
    const minQty = product.minQty || 1;

    let sizeChipsHtml = '';
    if (product.sizeOptions && product.sizeOptions.length > 0) {
        initialPrice = product.sizeOptions[0].price;
        if (product.sizeOptions[0].oldPrice) {
            oldPriceHtml = `<span class="old-price">${product.sizeOptions[0].oldPrice.toFixed(2)} ${STORE_CONFIG.currency}</span>`;
        }
        sizeChipsHtml = `
            <div class="product-size-chips" data-product-id="${product.id}">
                <span class="size-chips-label">📏 اختر الحجم المطلوب:</span>
                <div class="size-chips-list">
                    ${product.sizeOptions.map((opt, sIdx) => `
                        <button type="button" 
                                class="size-chip-btn ${sIdx === 0 ? 'active' : ''}" 
                                onclick="event.stopPropagation(); selectCardProductSize(this, ${product.id}, ${sIdx})"
                                title="اختيار حجم ${opt.size} بسعر ${opt.price.toFixed(2)} ${STORE_CONFIG.currency}">
                            <span class="size-chip-name">${opt.size}</span>
                            <span class="size-chip-price">${opt.price.toFixed(2)} ${STORE_CONFIG.currency}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const hasMultipleImages = Array.isArray(product.images) && product.images.length > 1;
    const variants = product.variants || [];
    const imagesCount = hasMultipleImages ? product.images.length : 1;
    const typesCount = product.typesCount || (variants.length > imagesCount ? variants.length : imagesCount);
    const typesBadgeText = product.availableTypesText || (typesCount > 10 ? `${typesCount} نوع متوفر` : `${typesCount} أنواع متوفرة`);

    let imageBoxContent = '';
    if (hasMultipleImages) {
        imageBoxContent = `
            <div class="card-carousel-track">
                ${product.images.map((img, idx) => `
                    <img src="${img}" alt="${product.name} - ${variants[idx] || `نوع ${idx + 1}`}" 
                         class="card-carousel-img ${idx === 0 ? 'active loaded' : 'loaded'}" 
                         data-index="${idx}" 
                         data-variant-name="${variants[idx] ? variants[idx].split('(')[0].trim() : `نوع ${idx + 1}`}"
                         loading="eager" 
                         decoding="async" 
                         onload="this.classList.add('loaded')" 
                         onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/i,'.png');}else{this.onerror=null;this.src='assets/images/logo.png';}">
                `).join('')}
            </div>

            <button type="button" class="card-carousel-nav card-carousel-prev" onclick="event.stopPropagation(); changeCardSlideRelative(this, -1)" aria-label="النوع السابق" title="النوع السابق">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="card-carousel-nav card-carousel-next" onclick="event.stopPropagation(); changeCardSlideRelative(this, 1)" aria-label="النوع التالي" title="النوع التالي">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <div class="card-carousel-dots">
                ${product.images.map((_, idx) => `
                    <span class="card-dot ${idx === 0 ? 'active' : ''}" onclick="event.stopPropagation(); setCardSlideIndex(this, ${idx})" title="${variants[idx] || `نوع ${idx + 1}`}"></span>
                `).join('')}
            </div>

            <div class="card-carousel-type-tag">
                <span>🔄</span> ${typesBadgeText}
            </div>

            <div class="card-carousel-variant-pill">
                ${variants[0] ? variants[0].split('(')[0].trim() : `1 / ${product.images.length}`}
            </div>
        `;
    } else {
        imageBoxContent = `
            <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" onload="this.classList.add('loaded')" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/i,'.png');}else{this.onerror=null;this.src='assets/images/logo.png';}">
        `;
    }

    return `
        <div class="product-card" data-id="${product.id}" data-selected-size-index="0">
            <div class="product-image-box ${hasMultipleImages ? 'has-carousel' : ''}" 
                 onclick="openProductQuickView(${product.id})" 
                 title="معاينة سريعة واختيار التفاصيل">
                ${imageBoxContent}
                ${badgeHtml}
            </div>
            <div class="product-body">
                <h3 class="product-title" title="${product.name}">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                
                <div class="product-meta-row">
                    <span><strong>العبوة:</strong> ${product.unit}</span>
                    <span><strong>أقل كمية للطلب:</strong> <mark style="background: rgba(30, 58, 138, 0.08); color: var(--color-primary); padding: 2px 6px; border-radius: 4px; font-weight: bold;">${product.minOrder}</mark></span>
                </div>

                ${sizeChipsHtml}

                <div class="product-price-section">
                    <div class="current-price">
                        ${initialPrice.toFixed(2)} <span>${STORE_CONFIG.currency}</span> <span class="price-unit-tag">/ ${product.unit.includes('قطعة') ? 'للقطعة' : (product.unit.includes('طقم') ? 'للطقم' : (product.unit.includes('باكيت') ? 'للباكيت' : (product.unit.includes('علبة') ? 'للعلبة' : (product.unit.includes('دستة') ? 'للدستة' : product.unit))))}</span>
                    </div>
                    ${oldPriceHtml}
                </div>

                <div class="product-bulk-discount">
                    <svg class="bulk-discount-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                    <span>(يقل السعر في الكميات الكبيرة )</span>
                </div>

                <div class="product-actions">
                    <button class="btn btn-primary btn-sm add-to-cart-btn" onclick="handleCardAddToCart(this, ${product.id})" title="إضافة للطلب بأقل كمية (${minQty})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        أضف للطلب (${minQty})
                    </button>
                    <button class="btn btn-outline btn-sm btn-icon" onclick="openProductQuickView(${product.id})" title="معاينة سريعة واختيار الكمية">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// التحكم في اختيار الحجم في بطاقة المنتج وتحديث السعر
window.selectCardProductSize = function(btn, productId, sizeIdx) {
    const card = btn.closest('.product-card');
    if (!card) return;
    card.dataset.selectedSizeIndex = sizeIdx;

    const chips = card.querySelectorAll('.size-chip-btn');
    chips.forEach((c, idx) => {
        if (idx === sizeIdx) c.classList.add('active');
        else c.classList.remove('active');
    });

    const product = (typeof PRODUCTS_DATA !== 'undefined') ? PRODUCTS_DATA.find(p => p.id === Number(productId)) : null;
    if (!product || !product.sizeOptions || !product.sizeOptions[sizeIdx]) return;
    const opt = product.sizeOptions[sizeIdx];

    const priceSec = card.querySelector('.product-price-section');
    if (priceSec) {
        const currentPriceEl = priceSec.querySelector('.current-price');
        if (currentPriceEl) {
            const unitTag = currentPriceEl.querySelector('.price-unit-tag')?.outerHTML || '';
            currentPriceEl.innerHTML = `${opt.price.toFixed(2)} <span>${STORE_CONFIG.currency}</span> ${unitTag}`;
        }
        let oldPriceEl = priceSec.querySelector('.old-price');
        if (opt.oldPrice) {
            if (oldPriceEl) {
                oldPriceEl.textContent = `${opt.oldPrice.toFixed(2)} ${STORE_CONFIG.currency}`;
            } else {
                priceSec.insertAdjacentHTML('beforeend', `<span class="old-price">${opt.oldPrice.toFixed(2)} ${STORE_CONFIG.currency}</span>`);
            }
        } else if (oldPriceEl) {
            oldPriceEl.remove();
        }
    }
};

// إضافة المنتج للطلب من البطاقة مع مراعاة الحجم المختار
window.handleCardAddToCart = function(btn, productId) {
    const card = btn.closest('.product-card');
    const product = (typeof PRODUCTS_DATA !== 'undefined') ? PRODUCTS_DATA.find(p => p.id === Number(productId)) : null;
    if (!product) return;
    const minQty = product.minQty || 1;
    if (product.sizeOptions && product.sizeOptions.length > 0) {
        const sizeIdx = parseInt(card?.dataset?.selectedSizeIndex || '0');
        const selectedOption = product.sizeOptions[sizeIdx] || product.sizeOptions[0];
        cartManager.addToCart(productId, minQty, selectedOption);
    } else {
        cartManager.addToCart(productId, minQty);
    }
};

// التحكم والتنقل في شرائح بطاقات المنتجات
window.changeCardSlideRelative = function(btnOrBox, delta) {
    if (!btnOrBox) return;
    const box = (btnOrBox.classList && btnOrBox.classList.contains('product-image-box')) 
        ? btnOrBox 
        : (btnOrBox.closest ? btnOrBox.closest('.product-image-box') : null);
    if (!box) return;
    const imgs = box.querySelectorAll('.card-carousel-img');
    if (!imgs.length) return;
    let currentIdx = 0;
    imgs.forEach((img, idx) => {
        if (img.classList.contains('active')) currentIdx = idx;
    });
    const newIdx = (currentIdx + delta + imgs.length) % imgs.length;
    setCardSlideOnBox(box, newIdx);
};

window.setCardSlideIndex = function(dotEl, targetIdx) {
    if (!dotEl) return;
    const box = (dotEl.classList && dotEl.classList.contains('product-image-box')) 
        ? dotEl 
        : (dotEl.closest ? dotEl.closest('.product-image-box') : null);
    if (!box) return;
    setCardSlideOnBox(box, targetIdx);
};

function setCardSlideOnBox(box, targetIdx) {
    const imgs = box.querySelectorAll('.card-carousel-img');
    if (!imgs.length) return;
    const newIdx = (targetIdx + imgs.length) % imgs.length;
    imgs.forEach((img, idx) => {
        if (idx === newIdx) {
            img.classList.add('active');
            img.classList.add('loaded');
        } else {
            img.classList.remove('active');
        }
    });
    const dots = box.querySelectorAll('.card-dot');
    dots.forEach((dot, idx) => {
        if (idx === newIdx) dot.classList.add('active');
        else dot.classList.remove('active');
    });
    const pill = box.querySelector('.card-carousel-variant-pill');
    if (pill) {
        const variantText = imgs[newIdx]?.dataset?.variantName;
        if (variantText) {
            pill.textContent = variantText;
        } else {
            pill.textContent = `${newIdx + 1} / ${imgs.length}`;
        }
    }
}

let cardCarouselGlobalTimer = null;
function initCardCarousels() {
    if (cardCarouselGlobalTimer) {
        clearInterval(cardCarouselGlobalTimer);
        cardCarouselGlobalTimer = null;
    }
    cardCarouselGlobalTimer = setInterval(() => {
        if (document.hidden) return;
        const boxes = document.querySelectorAll('.product-image-box.has-carousel');
        boxes.forEach(box => {
            // التخطي مؤقتاً فقط إذا كان مؤشر الفأرة يحوم مباشرة فوق البطاقة
            if (box.matches(':hover')) {
                return;
            }
            changeCardSlideRelative(box, 1);
        });
    }, 2800);
}

/**
 * 4. تهيئة المنتجات المميزة في الصفحة الرئيسية
 */
function initFeaturedProducts() {
    const featuredGrid = document.getElementById('featuredProductsGrid');
    if (!featuredGrid) return;

    const featured = getFeaturedProducts();
    let html = '';
    featured.forEach(product => {
        html += createProductCardHTML(product);
    });
    featuredGrid.innerHTML = html;
    checkCachedImages(featuredGrid);
    initCardCarousels();
}

function checkCachedImages(container) {
    if (!container) return;
    requestAnimationFrame(() => {
        const imgs = container.querySelectorAll('.product-image-box img');
        imgs.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
                img.classList.add('loaded');
            }
        });
    });
}

/**
 * 5. تهيئة صفحة المنتجات الكاملة (البحث المباشر والفرز)
 */
function initCatalogPage() {
    const catalogGrid = document.getElementById('catalogProductsGrid');
    if (!catalogGrid) return;

    const searchInput = document.getElementById('catalogSearchInput');
    const sortSelect = document.getElementById('catalogSortSelect');
    const countDisplay = document.getElementById('resultsCountDisplay');

    let currentSearch = '';
    let currentSort = 'default';

    // دالة تطبيق الفلاتر وإعادة الرسم
    function applyFilters() {
        const filtered = filterProducts(currentSearch, currentSort);

        if (filtered.length === 0) {
            catalogGrid.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    <h3>لم نتمكن من العثور على منتجات مطابقة</h3>
                    <p>جرب استخدام كلمات بحث أخرى (مثال: مساج، بخار، جل، زيت، قفازات، مناديل...)</p>
                    <button class="btn btn-outline btn-sm" id="resetFiltersBtn">إعادة ضبط البحث</button>
                </div>
            `;
            const resetBtn = document.getElementById('resetFiltersBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (searchInput) searchInput.value = '';
                    currentSearch = '';
                    currentSort = 'default';
                    if (sortSelect) sortSelect.value = 'default';
                    applyFilters();
                });
            }
        } else {
            let html = '';
            filtered.forEach(p => {
                html += createProductCardHTML(p);
            });
            catalogGrid.innerHTML = html;
            checkCachedImages(catalogGrid);
            initCardCarousels();
        }

        if (countDisplay) {
            countDisplay.textContent = `تم العثور على ${filtered.length} منتج`;
        }
    }

    // أحداث البحث اللحظي
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            applyFilters();
        });
    }

    // أحداث الفرز
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
        });
    }

    // الرسم الأولي
    applyFilters();
}

/**
 * 6. المعاينة السريعة للمنتج (Quick View Modal) مع التحكم في الحد الأدنى للطلب ودعم الشرائح الدوارة
 */
function initQuickViewModal() {
    window.qvCurrentIndex = 0;
    window.qvAllImages = [];
    window.qvVariants = [];

    window.setQvSlide = (idx) => {
        if (!window.qvAllImages || !window.qvAllImages.length) return;
        window.qvCurrentIndex = (idx + window.qvAllImages.length) % window.qvAllImages.length;
        const mainImg = document.getElementById('qvMainImg');
        if (mainImg) {
            mainImg.src = window.qvAllImages[window.qvCurrentIndex];
        }
        const thumbs = document.querySelectorAll('.qv-thumb');
        thumbs.forEach((t, i) => {
            t.style.borderColor = (i === window.qvCurrentIndex) ? 'var(--color-primary)' : 'transparent';
        });
        const chips = document.querySelectorAll('.qv-variant-chip-btn');
        chips.forEach((c, i) => {
            if (i === window.qvCurrentIndex) {
                c.style.borderColor = 'var(--color-primary)';
                c.style.background = 'rgba(30, 58, 138, 0.08)';
                c.style.color = 'var(--color-primary)';
            } else {
                c.style.borderColor = '#e2e8f0';
                c.style.background = '#ffffff';
                c.style.color = 'var(--text-secondary)';
            }
        });
    };

    window.qvSlideNav = (delta) => {
        window.setQvSlide((window.qvCurrentIndex || 0) + delta);
    };

    window.openProductQuickView = (productId) => {
        const product = PRODUCTS_DATA.find(p => p.id === Number(productId));
        if (!product) return;

        const modal = document.getElementById('quickViewModal');
        const content = document.getElementById('quickViewModalContent');

        if (modal && content) {
            let qvInitialPrice = product.price;
            let qvInitialOldPrice = product.oldPrice;
            const minQty = product.minQty || 1;
            
            const allImages = (product.images && product.images.length > 0) ? product.images : [product.image];
            const variants = product.variants || [];

            window.qvCurrentIndex = 0;
            window.qvAllImages = allImages;
            window.qvVariants = variants;

            let thumbsHtml = '';
            let qvArrowsHtml = '';
            if (allImages.length > 1) {
                qvArrowsHtml = `
                    <button type="button" class="qv-arrow-btn" onclick="qvSlideNav(-1)" style="right: 8px;" aria-label="السابق" title="النوع السابق">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    <button type="button" class="qv-arrow-btn" onclick="qvSlideNav(1)" style="left: 8px;" aria-label="التالي" title="النوع التالي">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                `;

                thumbsHtml = `
                    <div style="display: flex; gap: 8px; justify-content: center; margin-top: 12px; flex-wrap: wrap;">
                        ${allImages.map((img, idx) => `
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
                                <img src="${img}" alt="صورة ${idx + 1}" loading="lazy" decoding="async" 
                                     onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/i,'.png');}" 
                                     onclick="setQvSlide(${idx})" 
                                     class="qv-thumb" 
                                     style="width: 52px; height: 52px; object-fit: contain; background: #ffffff; border-radius: var(--radius-sm); cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--color-primary)' : 'transparent'}; box-shadow: var(--shadow-sm); padding: 2px; transition: all 0.2s;">
                                ${variants[idx] ? `<span style="font-size: 0.68rem; color: var(--color-text-muted); font-weight: 600; max-width: 65px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${variants[idx].split('(')[0].trim()}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            let variantsChipsHtml = '';
            if (variants.length > 0) {
                variantsChipsHtml = `
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">
                            الأنواع والمجموعات المتوفرة (${product.availableTypesText || (product.typesCount ? `${product.typesCount} نوع متوفر` : `${variants.length} أنواع`)}):
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${variants.map((v, idx) => `
                                <button type="button" class="qv-variant-chip-btn" onclick="setQvSlide(${idx})" style="font-size: 0.78rem; font-weight: 600; padding: 5px 12px; border-radius: 20px; border: 1.5px solid ${idx === 0 ? 'var(--color-primary)' : '#e2e8f0'}; background: ${idx === 0 ? 'rgba(30, 58, 138, 0.08)' : '#ffffff'}; color: ${idx === 0 ? 'var(--color-primary)' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.2s;">
                                    ✨ ${v}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            let sizeOptionsHtml = '';
            if (product.sizeOptions && product.sizeOptions.length > 0) {
                window.qvSelectedSizeIndex = 0;
                qvInitialPrice = product.sizeOptions[0].price;
                qvInitialOldPrice = product.sizeOptions[0].oldPrice;
                sizeOptionsHtml = `
                    <div class="qv-sizes-section">
                        <div style="font-size: 0.92rem; font-weight: 800; color: var(--color-primary); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <span>📏 اختر الحجم المطلوب:</span>
                            <span id="qvSelectedSizeBadge" style="font-size: 0.8rem; background: var(--color-primary); color: #ffffff; padding: 2px 10px; border-radius: 12px; font-weight: 700;">${product.sizeOptions[0].size} (${product.sizeOptions[0].price.toFixed(2)} ${STORE_CONFIG.currency})</span>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${product.sizeOptions.map((opt, sIdx) => `
                                <button type="button" 
                                        class="qv-size-chip-btn ${sIdx === 0 ? 'active' : ''}" 
                                        onclick="selectQvSize(${product.id}, ${sIdx})">
                                    <span style="font-size: 0.95rem; font-weight: 800;">${opt.size}</span>
                                    <span class="qv-size-price-tag" style="font-size: 0.85rem; font-weight: 700; ${sIdx === 0 ? 'color: #fef08a;' : 'color: var(--color-accent-hover);'}">${opt.price.toFixed(2)} ${STORE_CONFIG.currency}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            const qvOldPriceHtml = qvInitialOldPrice 
                ? `<span id="qvOldPriceDisplay" class="old-price" style="margin-right: 10px;">${qvInitialOldPrice.toFixed(2)} ${STORE_CONFIG.currency}</span>` 
                : `<span id="qvOldPriceDisplay" class="old-price" style="margin-right: 10px; display: none;"></span>`;

            content.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; align-items: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                        <div style="background: var(--bg-surface-alt); border-radius: var(--radius-lg); overflow: hidden; padding: 10px; display: flex; align-items: center; justify-content: center; width: 100%; min-height: 280px; position: relative;">
                            <img id="qvMainImg" src="${product.image}" alt="${product.name}" decoding="async" onload="this.classList.add('loaded')" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/i,'.png');}else{this.onerror=null;this.src='assets/images/logo.png';}" style="max-width: 100%; max-height: 320px; object-fit: contain; border-radius: var(--radius-md); transition: opacity 0.25s ease;">
                            ${qvArrowsHtml}
                        </div>
                        ${thumbsHtml}
                    </div>
                    <div>
                        <h2 style="font-size: 1.35rem; color: var(--color-primary); margin-bottom: 12px; line-height: 1.5;">${product.name}</h2>
                        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 16px;">${product.description}</p>
                        
                        ${variantsChipsHtml}

                        ${sizeOptionsHtml}

                        <div style="background: var(--bg-surface-alt); padding: 14px; border-radius: var(--radius-md); margin-bottom: 20px; border-right: 4px solid var(--color-accent);">
                            <div style="font-size: 0.9rem; margin-bottom: 6px;"><strong>العبوة:</strong> ${product.unit}</div>
                            <div style="font-size: 0.95rem; color: var(--color-primary); font-weight: bold;">
                                ⚡ أقل كمية للطلب بالجملة: ${product.minOrder} (${minQty} ${product.unit})
                            </div>
                        </div>

                        <div style="display: flex; align-items: baseline; margin-bottom: 16px;">
                            <span id="qvPriceDisplay" style="font-size: 1.7rem; font-weight: 800; color: var(--color-primary);">${qvInitialPrice.toFixed(2)}</span>
                            <span style="font-size: 1rem; color: var(--color-accent-hover); font-weight: 600; margin-right: 6px;">${STORE_CONFIG.currency} (سعر ${product.unit.includes('قطعة') ? 'القطعة' : (product.unit.includes('طقم') ? 'الطقم' : (product.unit.includes('باكيت') ? 'الباكيت' : (product.unit.includes('علبة') ? 'العلبة' : (product.unit.includes('دستة') ? 'الدستة' : product.unit))))})</span>
                            ${qvOldPriceHtml}
                        </div>

                        <div class="product-bulk-discount qv-bulk-discount">
                            <svg class="bulk-discount-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                            <span>(يقل السعر في الكميات الكبيرة )</span>
                        </div>

                        <div style="margin-bottom: 12px; font-size: 0.85rem; color: var(--text-muted);">
                            * يمكنك زيادة الكمية عن الحد الأدنى (${minQty})، ولكن لا يمكن طلب أقل من ذلك.
                        </div>

                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #ffffff; padding: 2px 6px;">
                                <button type="button" onclick="handleQvQtyDecrease(${minQty})" style="font-weight: bold; padding: 8px 12px; font-size: 1.1rem; cursor: pointer;" title="إنقاص">-</button>
                                <input type="number" id="qvQty" value="${minQty}" min="${minQty}" onchange="handleQvQtyChange(${minQty})" onblur="handleQvQtyChange(${minQty})" style="width: 55px; text-align: center; font-weight: bold; font-size: 1.1rem; border: none; outline: none;">
                                <button type="button" onclick="handleQvQtyIncrease()" style="font-weight: bold; padding: 8px 12px; font-size: 1.1rem; cursor: pointer;" title="زيادة">+</button>
                            </div>
                            <button class="btn btn-primary" onclick="handleQvAddToCart(${product.id}, ${minQty})" style="flex-grow: 1; padding: 12px 20px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                أضف للطلب
                            </button>
                        </div>
                    </div>
                </div>
            `;
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.selectQvSize = (productId, sIdx) => {
        window.qvSelectedSizeIndex = sIdx;
        const product = (typeof PRODUCTS_DATA !== 'undefined') ? PRODUCTS_DATA.find(p => p.id === Number(productId)) : null;
        if (!product || !product.sizeOptions || !product.sizeOptions[sIdx]) return;
        const opt = product.sizeOptions[sIdx];

        const btns = document.querySelectorAll('.qv-size-chip-btn');
        btns.forEach((b, idx) => {
            const priceTag = b.querySelector('.qv-size-price-tag');
            if (idx === sIdx) {
                b.classList.add('active');
                b.style.borderColor = 'var(--color-primary)';
                b.style.background = 'var(--color-primary)';
                b.style.color = '#ffffff';
                if (priceTag) priceTag.style.color = '#fef08a';
            } else {
                b.classList.remove('active');
                b.style.borderColor = '#cbd5e1';
                b.style.background = '#ffffff';
                b.style.color = 'var(--color-primary)';
                if (priceTag) priceTag.style.color = 'var(--color-accent-hover)';
            }
        });

        const badge = document.getElementById('qvSelectedSizeBadge');
        if (badge) {
            badge.textContent = `${opt.size} (${opt.price.toFixed(2)} ${STORE_CONFIG.currency})`;
        }

        const priceDisplay = document.getElementById('qvPriceDisplay');
        if (priceDisplay) {
            priceDisplay.textContent = opt.price.toFixed(2);
        }
        const oldPriceDisplay = document.getElementById('qvOldPriceDisplay');
        if (oldPriceDisplay) {
            if (opt.oldPrice) {
                oldPriceDisplay.textContent = `${opt.oldPrice.toFixed(2)} ${STORE_CONFIG.currency}`;
                oldPriceDisplay.style.display = 'inline';
            } else {
                oldPriceDisplay.style.display = 'none';
            }
        }
    };

    window.handleQvQtyIncrease = () => {
        const input = document.getElementById('qvQty');
        if (input) {
            input.value = (parseInt(input.value) || 1) + 1;
        }
    };

    window.handleQvQtyDecrease = (minQty) => {
        const input = document.getElementById('qvQty');
        if (input) {
            const current = parseInt(input.value) || minQty;
            if (current > minQty) {
                input.value = current - 1;
            } else {
                cartManager.showToast(`⚠️ أقل كمية يمكن شراؤها من هذا المنتج هي ${minQty}`, "warning");
            }
        }
    };

    window.handleQvQtyChange = (minQty) => {
        const input = document.getElementById('qvQty');
        if (input) {
            const current = parseInt(input.value);
            if (isNaN(current) || current < minQty) {
                input.value = minQty;
                cartManager.showToast(`⚠️ تم ضبط الكمية تلقائيًا على الحد الأدنى (${minQty})`, "warning");
            }
        }
    };

    window.handleQvAddToCart = (productId, minQty) => {
        const input = document.getElementById('qvQty');
        let qty = parseInt(input ? input.value : minQty);
        if (isNaN(qty) || qty < minQty) {
            qty = minQty;
        }
        const product = (typeof PRODUCTS_DATA !== 'undefined') ? PRODUCTS_DATA.find(p => p.id === Number(productId)) : null;
        let sizeOption = null;
        if (product && product.sizeOptions && product.sizeOptions.length > 0) {
            const sIdx = (window.qvSelectedSizeIndex !== undefined) ? window.qvSelectedSizeIndex : 0;
            sizeOption = product.sizeOptions[sIdx] || product.sizeOptions[0];
        }
        cartManager.addToCart(productId, qty, sizeOption);
        closeQuickViewModal();
    };

    window.closeQuickViewModal = () => {
        const modal = document.getElementById('quickViewModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    const modal = document.getElementById('quickViewModal');
    const closeBtn = document.getElementById('quickViewModalClose');
    const backdrop = document.getElementById('quickViewModalBackdrop');

    if (closeBtn) closeBtn.addEventListener('click', closeQuickViewModal);
    if (backdrop) backdrop.addEventListener('click', closeQuickViewModal);
}

/**
 * 7. التحكم في الشرائح الدوارة لآخر الأخبار وأحدث المنتجات (News & Products Carousel)
 */
window.changeShowcaseSlide = function(productId, imgUrl, idx) {
    const target = document.getElementById('slideImg_' + productId);
    if (target && target.src !== imgUrl && !target.src.endsWith(imgUrl)) {
        target.style.opacity = '0.5';
        setTimeout(() => {
            target.src = imgUrl;
            target.style.opacity = '1';
        }, 100);
    }
    const slide = target ? target.closest('.carousel-slide-product') : null;
    if (slide) {
        slide.dataset.currentVariantIndex = idx;
        const thumbs = slide.querySelectorAll('.showcase-thumb-btn');
        thumbs.forEach((b, i) => {
            if (i === idx) b.classList.add('active');
            else b.classList.remove('active');
        });
        const chips = slide.querySelectorAll('.showcase-variants-chips button');
        chips.forEach((c, i) => {
            if (i === idx) {
                c.style.borderColor = 'var(--color-primary)';
                c.style.background = 'rgba(30, 58, 138, 0.12)';
            } else {
                c.style.borderColor = 'rgba(30, 58, 138, 0.15)';
                c.style.background = 'rgba(30, 58, 138, 0.06)';
            }
        });
    }
};

function initNewsProductsCarousel() {
    const track = document.getElementById('carouselTrack');
    const wrapper = document.getElementById('carouselWrapper');
    if (!track || !wrapper) return;

    const counter = document.getElementById('carouselCounter');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    const progressFill = document.getElementById('carouselProgressFill');
    const filterButtons = document.querySelectorAll('.carousel-filter-btn');

    let currentFilter = 'products';
    let currentIndex = 0;
    let currentSlides = [];
    let isPaused = false;
    const slideDuration = 5000; // 5 ثوانٍ لكل شريحة
    let progressStartTime = null;
    let progressElapsed = 0;
    let animFrameId = null;
    let showcaseVariantTimer = null;

    // قالب شريحة الخبر
    function createNewsSlideHTML(news) {
        const pointsHtml = (news.points && news.points.length > 0) ? news.points.map(p => `
            <div class="news-slide-point">
                <span class="news-slide-point-icon">✓</span>
                <span>${p}</span>
            </div>
        `).join('') : '';

        return `
            <div class="carousel-slide carousel-slide-news" data-type="news" data-id="${news.id}">
                <div class="news-slide-content">
                    <div class="news-slide-meta">
                        <span class="news-badge">${news.badge}</span>
                        <span class="news-tag">${news.tag}</span>
                        <span class="news-tag">${news.date}</span>
                    </div>
                    <h3 class="news-slide-title">${news.title}</h3>
                    <p class="news-slide-desc">${news.summary}</p>
                    <div class="news-slide-points">
                        ${pointsHtml}
                    </div>
                    <div class="news-slide-actions">
                        <a href="${news.ctaLink}" class="btn btn-primary btn-md">
                            ${news.ctaText}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                        <a href="${STORE_CONFIG.whatsappUrl}" target="_blank" class="btn btn-whatsapp btn-md">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            استفسار سريع واتساب
                        </a>
                    </div>
                </div>
                <div class="news-slide-visual">
                    <div class="news-visual-card">
                        <div class="news-visual-icon">${news.icon}</div>
                        <div class="news-visual-highlight">${news.title.split(' ')[0]} ${news.title.split(' ')[1] || ''}</div>
                        <div class="news-visual-subtext">تحديث مباشر من إدارة شركة المستودع</div>
                        <div class="news-visual-floating-badge">
                            <span>⚡</span> توريد فوري بالجملة
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // قالب شريحة المنتج
    function createProductSlideHTML(product) {
        const minQty = product.minQty || 1;
        const discountPercent = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
        const discountBadgeHtml = discountPercent > 0 ? `<span class="product-slide-discount-pill">خصم ${discountPercent}%</span>` : '';
        const oldPriceHtml = product.oldPrice ? `<span class="product-slide-old-price">${product.oldPrice.toFixed(2)} ${STORE_CONFIG.currency}</span>` : '';

        const hasMultiple = Array.isArray(product.images) && product.images.length > 1;
        const variants = product.variants || [];
        const slideImagesCount = hasMultiple ? product.images.length : 1;
        const slideTypesCount = product.typesCount || (variants.length > slideImagesCount ? variants.length : slideImagesCount);
        const slideTypesText = product.availableTypesText || (slideTypesCount > 10 ? `${slideTypesCount} نوع متوفر` : `${slideTypesCount} أنواع متوفرة`);

        return `
            <div class="carousel-slide carousel-slide-product" data-type="product" data-id="${product.id}">
                <div class="product-slide-image-col">
                    <div class="product-slide-tag-badge">
                        <span>✨</span> ${hasMultiple ? slideTypesText : 'وصل حديثاً'}
                    </div>
                    <div class="product-slide-img-wrapper" style="position: relative;">
                        <img id="slideImg_${product.id}" src="${product.image}" alt="${product.name}" class="product-slide-img loaded" loading="eager" decoding="async" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/i,'.png');}else{this.onerror=null;this.src='assets/images/logo.png';}">
                        ${hasMultiple ? `
                            <div class="showcase-mini-thumbs" style="display: flex; gap: 8px; justify-content: center; margin-top: 12px; position: relative; z-index: 3;">
                                ${product.images.map((img, idx) => `
                                    <button type="button" class="showcase-thumb-btn ${idx === 0 ? 'active' : ''}" 
                                            onclick="changeShowcaseSlide(${product.id}, '${img}', ${idx})" 
                                            title="${variants[idx] || `نوع ${idx + 1}`}">
                                        <img src="${img}" alt="نوع ${idx + 1}" style="width: 38px; height: 38px; object-fit: contain;">
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="product-slide-info-col">
                    <div class="product-slide-top-meta">
                        <span class="product-arrival-badge">🔥 منتج جديد بالكتالوج</span>
                        ${product.badge ? `<span class="badge badge-gold">${product.badge}</span>` : ''}
                    </div>
                    <h3 class="product-slide-title">${product.name}</h3>
                    <p class="product-slide-desc">${product.description}</p>
                    
                    ${variants.length > 0 ? `
                        <div class="showcase-variants-chips" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
                            ${variants.map((v, idx) => `
                                <button type="button" onclick="changeShowcaseSlide(${product.id}, '${product.images[idx]}', ${idx})" style="font-size: 0.76rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; background: rgba(30, 58, 138, 0.06); color: var(--color-primary); border: 1px solid rgba(30, 58, 138, 0.15); cursor: pointer; transition: all 0.2s;">
                                    ✨ ${v.split('(')[0].trim()}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${(product.sizeOptions && product.sizeOptions.length > 0) ? `
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
                            ${product.sizeOptions.map(opt => `
                                <span style="font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: rgba(30, 58, 138, 0.08); color: var(--color-primary); border: 1px solid rgba(30, 58, 138, 0.15);">
                                    📏 ${opt.size}: <strong>${opt.price.toFixed(2)}</strong> ${STORE_CONFIG.currency}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="product-slide-spec-row">
                        <div class="product-slide-spec-item">
                            <strong>العبوة:</strong>
                            <span>${product.unit}</span>
                        </div>
                        <div class="product-slide-spec-item">
                            <strong>أقل كمية للطلب:</strong>
                            <mark style="background: rgba(30, 58, 138, 0.08); color: var(--color-primary); padding: 2px 8px; border-radius: 4px; font-weight: bold;">${product.minOrder}</mark>
                        </div>
                    </div>

                    <div class="product-slide-price-box">
                        <div class="product-slide-current-price">
                            ${product.price.toFixed(2)} <span>${STORE_CONFIG.currency}</span>
                        </div>
                        ${oldPriceHtml}
                        ${discountBadgeHtml}
                    </div>

                    <div class="product-slide-wholesale-note">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                        <span>(يقل السعر للكميات الكبيرة وجملة الجملة)</span>
                    </div>

                    <div class="product-slide-actions">
                        <button class="btn btn-primary btn-md add-to-cart-btn" onclick="cartManager.addToCart(${product.id})" title="إضافة للطلب بأقل كمية (${minQty})">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            أضف للطلب (${minQty})
                        </button>
                        <button class="btn btn-outline btn-md" onclick="openProductQuickView(${product.id})" title="معاينة سريعة واختيار الكمية">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            معاينة سريعة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // بناء الشرائح ورسمها
    function buildSlides(filter = 'all') {
        currentSlides = getCarouselSlides(filter);
        if (!currentSlides || currentSlides.length === 0) {
            track.innerHTML = '<div style="padding: 40px; text-align: center;">لا توجد عناصر لعرضها حالياً</div>';
            return;
        }

        let html = '';
        currentSlides.forEach(item => {
            if (item.type === 'news') {
                html += createNewsSlideHTML(item);
            } else {
                html += createProductSlideHTML(item);
            }
        });
        track.innerHTML = html;

        // بناء نقاط الترقيم
        if (indicatorsContainer) {
            let dotsHtml = '';
            for (let i = 0; i < currentSlides.length; i++) {
                dotsHtml += `<button type="button" class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="الشريحة ${i + 1}"></button>`;
            }
            indicatorsContainer.innerHTML = dotsHtml;

            indicatorsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index);
                    goToSlide(idx);
                });
            });
        }

        currentIndex = 0;
        updateSlidePosition(false);
        resetTimer();
        checkCachedImages(track);
        startShowcaseVariantTimer();
    }

    // الانتقال لشريحة محددة
    function goToSlide(index) {
        if (!currentSlides || currentSlides.length === 0) return;

        if (index < 0) {
            currentIndex = currentSlides.length - 1;
        } else if (index >= currentSlides.length) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }

        updateSlidePosition(true);
        resetTimer();
        startShowcaseVariantTimer();
    }

    // تحديث موضع المسار والنقاط والعداد
    function updateSlidePosition(smooth = true) {
        track.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        const allSlides = track.querySelectorAll('.carousel-slide');
        allSlides.forEach((slide, idx) => {
            if (idx === currentIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        if (indicatorsContainer) {
            const allDots = indicatorsContainer.querySelectorAll('.carousel-dot');
            allDots.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        if (counter) {
            const currentEl = counter.querySelector('.carousel-current');
            const totalEl = counter.querySelector('.carousel-total');
            if (currentEl) currentEl.textContent = currentIndex + 1;
            if (totalEl) totalEl.textContent = currentSlides.length;
        }
    }

    // التدوير التلقائي لأنواع وصور المنتج النشط في الشريحة الرئيسية
    function rotateActiveShowcaseVariants() {
        if (document.hidden) return;
        const activeSlide = track.querySelector('.carousel-slide.active');
        if (!activeSlide || activeSlide.dataset.type !== 'product') return;

        const thumbsContainer = activeSlide.querySelector('.showcase-mini-thumbs');
        const chipsContainer = activeSlide.querySelector('.showcase-variants-chips');
        if ((thumbsContainer && thumbsContainer.matches(':hover')) || (chipsContainer && chipsContainer.matches(':hover'))) {
            return;
        }

        const productId = Number(activeSlide.dataset.id);
        const product = (typeof PRODUCTS_DATA !== 'undefined') ? PRODUCTS_DATA.find(p => p.id === productId) : null;
        if (!product || !Array.isArray(product.images) || product.images.length <= 1) return;

        let currentVarIdx = parseInt(activeSlide.dataset.currentVariantIndex || '0', 10);
        if (isNaN(currentVarIdx)) currentVarIdx = 0;
        const nextVarIdx = (currentVarIdx + 1) % product.images.length;
        changeShowcaseSlide(productId, product.images[nextVarIdx], nextVarIdx);
    }

    function startShowcaseVariantTimer() {
        if (showcaseVariantTimer) {
            clearInterval(showcaseVariantTimer);
            showcaseVariantTimer = null;
        }
        showcaseVariantTimer = setInterval(rotateActiveShowcaseVariants, 2400);
    }

    // التوقيت والتحريك التلقائي لشريط التقدم
    function startTimer() {
        cancelAnimationFrame(animFrameId);
        progressStartTime = performance.now() - progressElapsed;

        function step(now) {
            if (!isPaused) {
                progressElapsed = now - progressStartTime;
                const percent = Math.min((progressElapsed / slideDuration) * 100, 100);
                if (progressFill) {
                    progressFill.style.width = `${percent}%`;
                }

                if (progressElapsed >= slideDuration) {
                    goToSlide(currentIndex + 1);
                    return;
                }
            } else {
                progressStartTime = now - progressElapsed;
            }
            animFrameId = requestAnimationFrame(step);
        }

        animFrameId = requestAnimationFrame(step);
    }

    function resetTimer() {
        progressElapsed = 0;
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        startTimer();
    }

    // أزرار السابق والتالي
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
        });
    }

    // تبويبات التصفية
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter || 'products';
            buildSlides(currentFilter);
        });
    });

    // إيقاف واستئناف عند مرور الفأرة
    wrapper.addEventListener('mouseenter', () => {
        isPaused = true;
    });

    wrapper.addEventListener('mouseleave', () => {
        isPaused = false;
    });

    // دعم السحب باللمس للأجهزة الذكية (Touch Swipe)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDiffX = 0;

    wrapper.addEventListener('touchstart', (e) => {
        isPaused = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchDiffX = 0;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        touchDiffX = e.touches[0].clientX - touchStartX;
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
        isPaused = false;
        // عند السحب في RTL: السحب لليسار يعني التالي، والسحب لليمين يعني السابق
        if (touchDiffX < -45) {
            goToSlide(currentIndex + 1);
        } else if (touchDiffX > 45) {
            goToSlide(currentIndex - 1);
        }
    });

    // دعم أسهم لوحة المفاتيح
    wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentIndex + 1);
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentIndex - 1);
        }
    });

    // التهيئة الأولى
    buildSlides('products');
}