/* ================================================
   FITTING CLUB - MAIN JAVASCRIPT
   ================================================ */

// WhatsApp Configuration (Replace with your real number!)
const whatsappNumber = "923187319091";

// -----------------------------
// CATEGORY RENDERING (sitewide)
// -----------------------------
function initCategoriesRender() {
    if (!window.categoryData) return;
    try {
        renderNavCategories(window.categoryData);
        renderMobileCategories(window.categoryData);
        renderFooterCategories(window.categoryData);
        renderHomepageCategories(window.categoryData);
    } catch (e) {
        console.error('Error rendering categories', e);
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-group', product.group || 'sportswear');
    card.setAttribute('data-item', product.item || '');
    if (product.subgroup) card.setAttribute('data-subgroup', product.subgroup);

    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.thumbnail ? [product.thumbnail] : []);
    // Always default to images[0] (image 1)
    const defaultImage = images[0] || product.thumbnail || '';
    if (images[0]) card.setAttribute('data-image-1', images[0]);
    if (images[1]) card.setAttribute('data-image-2', images[1]);

    const teaser = (() => {
        if (typeof product.description !== 'string') return '';
        const skipTokens = /^(seo title|product description|key features|specifications|image alt text)$/i;
        const lines = product.description
            .split(/\n+/)
            .map(line => line.trim())
            .filter(Boolean)
            .filter(line => !skipTokens.test(line));

        const candidate = lines.find(line => !/kit\s*\d+\s*[–-]/i.test(line) && line.length > 25) || lines[0] || '';
        return candidate.length > 160 ? candidate.slice(0, 157).trimEnd() + '...' : candidate;
    })();
    const previewDescription = typeof product.description === 'string' ? product.description : '';

    card.setAttribute('data-preview-src', defaultImage);
    card.setAttribute('data-preview-title', product.name || 'Product');
    card.setAttribute('data-preview-description', previewDescription);

    const isSwappable = images.length >= 2;
    const dotsMarkup = isSwappable
        ? `<div class="img-swap-dots" aria-hidden="true">${images.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`).join('')}</div>`
        : '';
    const imgBadge = isSwappable
        ? `<div class="img-swap-badge" aria-hidden="true"><span class="img-current">1</span>/${images.length}</div>`
        : '';
    const imgHint = isSwappable
        ? `<div class="img-swap-hint" aria-hidden="true">Click to view</div>`
        : '';

    const imageMarkup = defaultImage
        ? `<img src="${defaultImage}" alt="${product.name || 'Product'}" loading="lazy" width="600" height="600" sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw">${imgBadge}${dotsMarkup}${imgHint}`
        : '';

    card.innerHTML = `
        <div class="product-image-wrapper ${isSwappable ? 'is-swappable' : ''}">
            ${imageMarkup}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name || 'Product'}</h3>
            <p>${teaser}</p>
            <button class="btn btn-primary" data-product="${product.name || 'Product'}">Enquire</button>
        </div>
    `;

    if (isSwappable) {
        const imageWrapper = card.querySelector('.product-image-wrapper');
        const img = imageWrapper?.querySelector('img');
        const badgeCurrent = imageWrapper?.querySelector('.img-current');
        const dots = imageWrapper?.querySelectorAll('.img-swap-dots .dot');

        if (imageWrapper && img) {
            imageWrapper.style.cursor = 'pointer';
            let currentIdx = 0;

            imageWrapper.addEventListener('click', (e) => {
                if (e.target.closest('[data-product]')) return;
                e.stopPropagation();
                e.preventDefault();

                currentIdx = (currentIdx + 1) % images.length;
                const nextSrc = images[currentIdx];

                if (badgeCurrent) badgeCurrent.textContent = String(currentIdx + 1);
                if (dots && dots.length) {
                    dots.forEach((dot, idx) => {
                        dot.classList.toggle('active', idx === currentIdx);
                    });
                }

                card.setAttribute('data-preview-src', nextSrc);

                img.style.transition = 'opacity 0.25s ease, transform 0.35s ease';
                img.style.opacity = '0.15';
                img.style.transform = 'scale(0.96)';
                setTimeout(() => {
                    img.setAttribute('src', nextSrc);
                    img.style.opacity = '1';
                    img.style.transform = 'scale(1)';
                }, 140);
            });
        }
    }

    return card;
}

function renderImportedProducts() {
    const importedProducts = Array.isArray(window.productsData)
        ? window.productsData.filter(product => product && Array.isArray(product.images) && product.images.length > 0)
        : [];
    console.log('Loaded products:', importedProducts.length, importedProducts);
    if (importedProducts.length === 0) return;

    const grid = document.getElementById('productsGrid');
    if (!grid) {
        console.error('productsGrid not found');
        return;
    }
    console.log('Found productsGrid:', grid);

    const importedItems = new Set(importedProducts.map(product => product.item).filter(Boolean));
    const placeholderCards = Array.from(grid.querySelectorAll('.product-card')).filter(card => importedItems.has(card.getAttribute('data-item')));
    placeholderCards.forEach(card => card.remove());

    const frag = document.createDocumentFragment();
    importedProducts.sort((a, b) => {
        const aOrder = Number(a.kitNumber || 0);
        const bOrder = Number(b.kitNumber || 0);
        return aOrder - bOrder;
    }).forEach(product => {
        frag.appendChild(createProductCard(product));
    });
    grid.insertBefore(frag, grid.firstChild);
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featured-products-carousel');
    if (!grid) return;

    const featuredProducts = Array.isArray(window.productsData)
        ? window.productsData.filter(product => product && product.featured === true)
        : [];

    grid.innerHTML = '';
    
    const frag = document.createDocumentFragment();
    featuredProducts.forEach(product => {
        frag.appendChild(createProductCard(product));
    });
    grid.appendChild(frag);
}

function buildProductUrl(groupSlug, itemSlug, subgroupSlug) {
    const params = new URLSearchParams();
    if (groupSlug) params.set('group', groupSlug);
    if (subgroupSlug) params.set('subgroup', subgroupSlug);
    if (itemSlug) params.set('item', itemSlug);
    return 'products.html?' + params.toString();
}

function renderNavCategories(data) {
    const container = document.getElementById('nav-categories');
    if (!container) return;
    container.innerHTML = '';

    // Create columns grid: each top-level group becomes a column
    data.forEach(group => {
        const col = document.createElement('div');
        col.className = 'dropdown-column';
        const h = document.createElement('h4');
        h.textContent = group.group.toUpperCase();
        col.appendChild(h);

        const ul = document.createElement('ul');

        if (group.items && Array.isArray(group.items)) {
            group.items.forEach(item => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = buildProductUrl(group.slug, item.slug);
                a.textContent = item.name;
                li.appendChild(a);
                ul.appendChild(li);
            });
        } else if (group.subGroups && Array.isArray(group.subGroups)) {
            // For groups like Gymwear render subgroup headers with their items
            group.subGroups.forEach(sg => {
                const subHeader = document.createElement('div');
                subHeader.className = 'dropdown-subheader';
                subHeader.textContent = sg.subGroup;
                col.appendChild(subHeader);

                const subUl = document.createElement('ul');
                sg.items.forEach(item => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = buildProductUrl(group.slug, item.slug, sg.slug);
                    a.textContent = item.name;
                    li.appendChild(a);
                    subUl.appendChild(li);
                });
                col.appendChild(subUl);
            });
        }

        if (ul.children.length > 0) col.appendChild(ul);
        container.appendChild(col);
    });
}

function renderMobileCategories(data) {
    const container = document.getElementById('mobile-categories');
    if (!container) return;
    container.innerHTML = '';

    data.forEach(group => {
        const item = document.createElement('div');
        item.className = 'mobile-accordion-item';

        const btn = document.createElement('button');
        btn.className = 'mobile-accordion-header';
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = `<span>${group.group.toUpperCase()}</span><svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        item.appendChild(btn);

        const body = document.createElement('div');
        body.className = 'mobile-accordion-body';

        if (group.items && Array.isArray(group.items)) {
            const ul = document.createElement('ul');
            ul.className = 'mobile-sub-list';
            group.items.forEach(it => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = buildProductUrl(group.slug, it.slug);
                a.textContent = it.name;
                li.appendChild(a);
                ul.appendChild(li);
            });
            body.appendChild(ul);
        } else if (group.subGroups && Array.isArray(group.subGroups)) {
            // third-tier accordion inside the group's body
            group.subGroups.forEach(sg => {
                const nestedItem = document.createElement('div');
                nestedItem.className = 'mobile-accordion-item';

                const nestedBtn = document.createElement('button');
                nestedBtn.className = 'mobile-accordion-header';
                nestedBtn.type = 'button';
                nestedBtn.setAttribute('aria-expanded', 'false');
                nestedBtn.innerHTML = `<span>${sg.subGroup}</span><svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                nestedItem.appendChild(nestedBtn);

                const nestedBody = document.createElement('div');
                nestedBody.className = 'mobile-accordion-body';
                const ul = document.createElement('ul');
                ul.className = 'mobile-sub-list';
                sg.items.forEach(it => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = buildProductUrl(group.slug, it.slug, sg.slug);
                    a.textContent = it.name;
                    li.appendChild(a);
                    ul.appendChild(li);
                });
                nestedBody.appendChild(ul);
                nestedItem.appendChild(nestedBody);
                body.appendChild(nestedItem);
            });
        }

        item.appendChild(body);
        container.appendChild(item);
    });


    // No inline binding here — initMobileMenu uses delegated handling for headers
}

function renderFooterCategories(data) {
    const container = document.getElementById('footer-categories');
    if (!container) return;
    container.innerHTML = '';

    const ul = document.createElement('ul');
    ul.className = 'footer-category-list';
    data.forEach(group => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = buildProductUrl(group.slug);
        a.textContent = group.group;
        li.appendChild(a);
        ul.appendChild(li);
    });
    container.appendChild(ul);
}

function renderHomepageCategories(data) {
    const container = document.getElementById('homepage-categories');
    if (!container) return;
    container.innerHTML = '';

    // Create grid of category cards. For Gymwear show two cards for subgroups.
    const grid = document.createElement('div');
    grid.className = 'categories-grid';

    data.forEach(group => {
        if (group.slug === 'gymwear' && group.subGroups) {
            group.subGroups.forEach(sg => {
                const card = document.createElement('a');
                card.className = 'category-card';
                card.href = buildProductUrl(group.slug, null, sg.slug);
                card.innerHTML = `
                    <div class="category-image-wrap">
                        <img src="assets/images/category-${sg.slug}.png" alt="${sg.subGroup}" loading="lazy">
                    </div>
                    <div class="card-glare"></div>
                    <div class="category-overlay">
                        <h3>${sg.subGroup}</h3>
                        <span class="category-arrow">→</span>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            // For small groups like Boxing/Karate we still render a card
            const card = document.createElement('a');
            card.className = 'category-card';
            card.href = buildProductUrl(group.slug);
            card.innerHTML = `
                <div class="category-image-wrap">
                    <img src="assets/images/category-${group.slug}.png" alt="${group.group}" loading="lazy">
                </div>
                <div class="card-glare"></div>
                <div class="category-overlay">
                    <h3>${group.group}</h3>
                    <span class="category-arrow">→</span>
                </div>
            `;
            grid.appendChild(card);
        }
    });

    container.appendChild(grid);
}


// ================================================
// INITIALIZE EVERYTHING ON DOM LOAD
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Hide preloader immediately if it exists and we're in reduced motion mode
    const preloader = document.querySelector('.preloader');
    if (prefersReducedMotion && preloader) {
        preloader.style.display = 'none';
    }
    
    // Always initialize core functionality, regardless of motion preference
    initNavbar();
    // Render categories-driven UI before dropdown/mobile/filter init
    initCategoriesRender();
    renderImportedProducts();
    renderFeaturedProducts();
    initDropdown();
    initMobileMenu();
    initWhatsAppButtons();
    initTestimonialSlider();
    initFooterAccordion();
    initProductFilter();
    initContactForm();
    initGalleryLightbox();
    initProductPreview();
    
    if (!prefersReducedMotion) {
        initLenis();
        initPreloader();
        initHeroAnimation();
        initHeroSlideshow();
        initHeroParallax();
        initSplitText();
        initSectionTitleMasks();
        initMagneticButtons();
        initCardTiltAndGlare();
        initImageSequence();
        initCounters();
        initScrollAnimations();
        initProcessSection();
    } else {
        // Reduced motion still needs hero slideshow
        initHeroSlideshow();
    }
});

// ================================================
// LENIS SMOOTH SCROLL
// ================================================
let lenis;
function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync with GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        ScrollTrigger.scrollerProxy(document.body, {
            scrollTop(value) {
                if (arguments.length) {
                    lenis.scroll = value;
                }
                return lenis.scroll;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            }
        });

        lenis.on('scroll', ScrollTrigger.update);
        ScrollTrigger.defaults({ scroller: document.body });
    }
}

// ================================================
// PRELOADER
// ================================================
function initPreloader() {
    const preloader = document.querySelector('.preloader');
    const preloaderLogo = document.querySelector('.preloader-logo');
    const progressBar = document.querySelector('.preloader-progress-bar');
    
    if (!preloader) return;
    
    const tl = gsap.timeline();
    
    // Animate logo in
    tl.to(preloaderLogo, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    })
    // Animate progress bar
    .to(progressBar, {
        width: '100%',
        duration: 1.5,
        ease: 'power2.inOut'
    }, '-=0.4')
    // Hide preloader
    .to(preloader, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => {
            preloader.style.display = 'none';
            // Start hero animations
            startHeroAnimations();
        }
    });
}

// ================================================
// NAVBAR
// ================================================
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const navbarLogo = document.querySelector('.navbar-logo');
    const logoLight = navbarLogo?.querySelector('.logo-light');
    const logoDark = navbarLogo?.querySelector('.logo-dark');
    
    // Dynamic scroll threshold
    let scrollThreshold = 50;
    const hero = document.querySelector('.hero');
    const pageHeader = document.querySelector('.page-header');
    const banner = hero || pageHeader;
    
    if (banner && navbar) {
        scrollThreshold = banner.offsetHeight - navbar.offsetHeight;
        scrollThreshold = Math.max(scrollThreshold, 50);
    }
    
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Logo entrance animation
    if (navbarLogo && !prefersReducedMotion) {
        // Check if preloader exists
        const preloader = document.querySelector('.preloader');
        const startDelay = preloader ? 2.5 : 0; // Start after preloader if present

        gsap.from(navbarLogo, {
            opacity: 0,
            scale: 0.85,
            y: -8,
            duration: 0.7,
            delay: startDelay,
            ease: 'power3.out',
            onComplete: () => {
                // Start anti-gravity float after entrance
                startLogoFloat();
            }
        });
    } else if (navbarLogo) {
        // If reduced motion, just start float if possible
        startLogoFloat();
    }
    
    // Anti-gravity float animation
    let floatTween;
    function startLogoFloat() {
        if (!navbarLogo || prefersReducedMotion) return;
        
        floatTween = gsap.to(navbarLogo, {
            y: '+=3',
            duration: 2,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });
    }
    
    // Logo hover/tap scale animation
    if (navbarLogo) {
        navbarLogo.addEventListener('mouseenter', () => {
            if (floatTween) floatTween.pause();
            gsap.to(navbarLogo, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
        });
        
        navbarLogo.addEventListener('mouseleave', () => {
            gsap.to(navbarLogo, { scale: 1, duration: 0.3, ease: 'power2.out', onComplete: () => {
                if (floatTween) floatTween.resume();
            }});
        });
        
        navbarLogo.addEventListener('touchstart', () => {
            if (floatTween) floatTween.pause();
            gsap.to(navbarLogo, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
        }, { passive: true });
        
        navbarLogo.addEventListener('touchend', () => {
            gsap.to(navbarLogo, { scale: 1, duration: 0.3, ease: 'power2.out', onComplete: () => {
                if (floatTween) floatTween.resume();
            }});
        }, { passive: true });
    }
    
    // Scroll handler
    function handleScroll() {
        if (!navbar) return;
        
        const isScrolled = window.scrollY > scrollThreshold;
        navbar.classList.toggle('scrolled', isScrolled);
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
}

// ================================================
// DESKTOP DROPDOWN
// ================================================
function initDropdown() {
    const dropdownParents = document.querySelectorAll('.dropdown-parent');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    dropdownParents.forEach(parent => {
        const dropdown = parent.querySelector('.dropdown');
        let leaveTimeout;
        
        function openDropdown() {
            clearTimeout(leaveTimeout);
            parent.classList.add('dropdown-open');
            
            if (dropdown && !prefersReducedMotion) {
                gsap.fromTo(dropdown, 
                    { opacity: 0, y: -10 },
                    { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
                );
            }
        }
        
        function closeDropdown() {
            leaveTimeout = setTimeout(() => {
                parent.classList.remove('dropdown-open');
            }, 200);
        }
        
        parent.addEventListener('mouseenter', openDropdown);
        parent.addEventListener('mouseleave', closeDropdown);
        
        // Keyboard support
        const link = parent.querySelector('a');
        link?.addEventListener('focus', openDropdown);
        link?.addEventListener('blur', closeDropdown);
    });
}

// ================================================
// HERO ANIMATIONS
// ================================================
function initHeroAnimation() {
    // Will be called after preloader completes
}

function startHeroAnimations() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    
    const tl = gsap.timeline();
    
    if (heroTitle) {
        const chars = heroTitle.querySelectorAll('.char');
        tl.to(chars, {
            y: 0,
            rotateX: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.03,
            ease: 'power3.out'
        });
    }
    
    if (heroSubtitle) {
        tl.to(heroSubtitle, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
        }, '-=0.3');
    }
    
    if (heroButtons.length > 0) {
        tl.from(heroButtons, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out'
        }, '-=0.3');
    }
}

// ================================================
// HERO SLIDESHOW
// ================================================
function initHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    function showNextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Change slide every 4 seconds
    setInterval(showNextSlide, 4000);
}

// ================================================
// HERO PARALLAX
// ================================================
function initHeroParallax() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    const parallaxBack = document.querySelector('.hero-parallax-back');
    const parallaxMid = document.querySelector('.hero-parallax-mid');
    const hero = document.querySelector('.hero');
    
    if (!hero) return;
    
    ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
            const progress = self.progress;
            if (parallaxBack) {
                gsap.to(parallaxBack, {
                    y: progress * 150,
                    ease: 'none'
                });
            }
            if (parallaxMid) {
                gsap.to(parallaxMid, {
                    y: progress * 75,
                    ease: 'none'
                });
            }
        }
    });
}

// ================================================
// SPLIT TEXT INTO CHARACTERS
// ================================================
function initSplitText() {
    const elements = document.querySelectorAll('[data-split]');
    
    elements.forEach(el => {
        const text = el.textContent;
        el.innerHTML = '';
        
        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.transitionDelay = i * 0.02 + 's';
            el.appendChild(span);
        });
    });
}

// ================================================
// SECTION TITLE MASK REVEAL
// ================================================
function initSectionTitleMasks() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    const masks = document.querySelectorAll('.section-title-mask');
    
    masks.forEach(mask => {
        const title = mask.querySelector('.section-title');
        if (!title) return;
        
        gsap.fromTo(title, 
            { y: '100%' },
            {
                y: '0%',
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: mask,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    });
}

// ================================================
// MAGNETIC BUTTONS
// ================================================
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });
}

// ================================================
// CARD TILT AND GLARE
// ================================================
function initCardTiltAndGlare() {
    const cards = document.querySelectorAll('.category-card, .product-card');
    
    cards.forEach(card => {
        const glare = card.querySelector('.card-glare');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            // Tilt effect
            card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';
            card.style.transition = 'transform 0.1s ease';
            
            // Glare effect
            if (glare) {
                glare.style.opacity = '1';
                glare.style.transform = 'translate(' + (x - rect.width / 2) + 'px, ' + (y - rect.height / 2) + 'px) rotate(45deg)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.5s ease';
            
            if (glare) {
                glare.style.opacity = '0';
            }
        });
    });
}

// ================================================
// SCROLL-LINKED IMAGE SEQUENCE
// ================================================
function initImageSequence() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    const video = document.getElementById('productSequenceVideo');
    const caption = document.getElementById('sequenceCaption');
    if (!video) return;

    const captions = [
        'Premium Craftsmanship',
        'Precision Stitching',
        'Quality Control',
        'Final Touches',
        'Ready for Action'
    ];

    let pendingProgress = 0;

    function updateCaption(progress) {
        if (!caption) return;
        const captionIndex = Math.floor(progress * (captions.length - 1));
        caption.textContent = captions[captionIndex] || captions[0];
    }

    function syncVideo(progress) {
        if (!video.duration || !isFinite(video.duration)) {
            pendingProgress = progress;
            return;
        }

        const seekTime = Math.min(Math.max(progress * video.duration, 0), Math.max(video.duration - 0.05, 0));
        try {
            video.currentTime = seekTime;
        } catch (error) {
            pendingProgress = progress;
        }
    }

    function startPlayback() {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    }

    video.addEventListener('loadedmetadata', () => {
        startPlayback();
        syncVideo(pendingProgress);
        updateCaption(pendingProgress);
    });

    startPlayback();
    
    // GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    ScrollTrigger.create({
        trigger: '.image-sequence-section',
        start: 'top top',
        end: 'bottom bottom',
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;
            updateCaption(progress);
            syncVideo(progress);
        }
    });
}

// ================================================
// COUNTER ANIMATION
// ================================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target') || counter.textContent);
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + (element.textContent.includes('+') ? '+' : element.textContent.includes('%') ? '%' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + (element.textContent.includes('+') ? '+' : element.textContent.includes('%') ? '%' : '');
        }
    }, 30);
}

// ================================================
// WHATSAPP BUTTONS
// ================================================
function initWhatsAppButtons() {
    // Product Enquire Buttons
    document.querySelectorAll('[data-product]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productName = button.getAttribute('data-product');
            const message = "Hi, I'm interested in " + productName + " from Fitting Club. Please share more details.";
            openWhatsApp(message);
        });
    });
}

function openWhatsApp(message) {
    const url = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);
    window.open(url, '_blank');
}

// ================================================
// MOBILE MENU & ACCORDION
// ================================================
function initMobileMenu() {
    // Prevent double-initialization
    if (window.__mobileMenuInitialized) return;
    window.__mobileMenuInitialized = true;

    const toggle = document.querySelector('.mobile-menu-toggle');
    const closeBtn = document.querySelector('.mobile-menu-close');
    const menu = document.querySelector('.mobile-menu');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    const lineTop = document.querySelector('.line-top');
    const lineMid = document.querySelector('.line-mid');
    const lineBot = document.querySelector('.line-bot');
    
    if (!toggle || !menu) return;
    
    let isOpen = false;
    
    function animateHamburger(active) {
        if (typeof gsap !== 'undefined' && lineTop && lineMid && lineBot) {
            if (active) {
                gsap.to(lineTop, { y: 6, rotate: 45, transformOrigin: 'center', duration: 0.3, ease: 'power2.out' });
                gsap.to(lineMid, { opacity: 0, scaleX: 0, duration: 0.2, ease: 'power2.out' });
                gsap.to(lineBot, { y: -6, rotate: -45, transformOrigin: 'center', duration: 0.3, ease: 'power2.out' });
            } else {
                gsap.to(lineTop, { y: 0, rotate: 0, duration: 0.3, ease: 'power2.out' });
                gsap.to(lineMid, { opacity: 1, scaleX: 1, duration: 0.2, ease: 'power2.out' });
                gsap.to(lineBot, { y: 0, rotate: 0, duration: 0.3, ease: 'power2.out' });
            }
        }
    }
    
    function animateMenuEntrance() {
        if (typeof gsap === 'undefined') return;
        const logo = menu.querySelector('.mobile-menu-logo');
        const links = menu.querySelectorAll('.mobile-nav-link');
        const accordions = menu.querySelectorAll('.mobile-accordion-item');
        const waBtn = menu.querySelector('.mobile-wa-btn');
        const social = menu.querySelector('.mobile-social-row');
        
        const animTargets = [logo, ...links, ...accordions, waBtn, social].filter(Boolean);
        
        gsap.fromTo(animTargets, 
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
        );
    }
    
    function toggleMenu(forceClose = false) {
        isOpen = forceClose ? false : !isOpen;
        
        toggle.setAttribute('aria-expanded', isOpen);
        toggle.classList.toggle('is-active', isOpen);
        menu.classList.toggle('active', isOpen);
        if (backdrop) backdrop.classList.toggle('active', isOpen);
        
        document.body.style.overflow = isOpen ? 'hidden' : '';
        
        animateHamburger(isOpen);
        
        if (isOpen) {
            // Normalize mobile-category state to ensure all panels start closed
            const mcat = document.getElementById('mobile-categories');
            if (mcat) {
                const items = mcat.querySelectorAll('.mobile-accordion-item');
                items.forEach(it => {
                    it.classList.remove('is-open');
                    const hdr = it.querySelector('.mobile-accordion-header');
                    if (hdr) hdr.setAttribute('aria-expanded', 'false');
                    const bd = it.querySelector('.mobile-accordion-body');
                    if (bd) {
                        bd.style.maxHeight = '0px';
                        bd.style.transform = '';
                        bd.style.opacity = '';
                        bd.style.height = '';
                    }
                });
            }
            animateMenuEntrance();
        }
    }
    
    toggle.addEventListener('click', () => toggleMenu());
    if (backdrop) backdrop.addEventListener('click', () => toggleMenu(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleMenu(true));
    
    // Close menu on clicking any navigation link
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(true));
    });
    
    // Mobile Accordion Logic — single-open behavior per container
    function handleAccordionToggle(headerEl) {
        if (!headerEl) return;
        const item = headerEl.closest('.mobile-accordion-item');
        if (!item) return;

        const container = item.parentElement;

        // Determine current state
        const isOpen = item.classList.contains('is-open');

        // Close sibling items within the same container (single-open behavior per container)
        const siblings = Array.from(container.children).filter(ch => ch.classList && ch.classList.contains('mobile-accordion-item'));
        siblings.forEach(sib => {
            if (sib === item) return;
            sib.classList.remove('is-open');
            const sibHeader = sib.querySelector('.mobile-accordion-header');
            if (sibHeader) sibHeader.setAttribute('aria-expanded', 'false');
            const sibBody = sib.querySelector('.mobile-accordion-body');
            if (sibBody) sibBody.style.maxHeight = '0px';
        });

        // Toggle the clicked item: if it was open, close it; otherwise open it
        const willOpen = !isOpen;
        item.classList.toggle('is-open', willOpen);
        headerEl.classList.toggle('active', willOpen);
        headerEl.setAttribute('aria-expanded', willOpen ? 'true' : 'false');

        // Manage panel max-height explicitly to avoid leftover inline GSAP styles
        const body = item.querySelector('.mobile-accordion-body');
        if (body) {
            if (willOpen) {
                // Set to exact scrollHeight so the transition expands fully
                body.style.maxHeight = body.scrollHeight + 'px';

                // After transition completes, remove max-height so content can grow naturally
                const onEnd = (e) => {
                    if (e.target !== body || e.propertyName !== 'max-height') return;
                    body.style.maxHeight = 'none';
                    body.removeEventListener('transitionend', onEnd);
                };
                body.addEventListener('transitionend', onEnd);

                // allow scrollIntoView after the expand transition begins
                setTimeout(() => {
                    // ensure the body is fully visible inside the mobile menu
                    const menuEl = document.querySelector('.mobile-menu');
                    if (menuEl && typeof body.scrollIntoView === 'function') {
                        body.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                }, 160);
            } else {
                // Closing: if maxHeight is 'none', set it back to scrollHeight first
                if (body.style.maxHeight === 'none' || !body.style.maxHeight) {
                    body.style.maxHeight = body.scrollHeight + 'px';
                    // force reflow so transition to 0 will animate
                    // eslint-disable-next-line no-unused-expressions
                    body.offsetHeight;
                }
                body.style.maxHeight = '0px';
                body.style.transform = '';
                body.style.opacity = '';
                body.style.height = '';
            }
        }
    }

    // Click delegation attached to the mobile menu element
    menu.addEventListener('click', (e) => {
        const headerEl = e.target.closest('.mobile-accordion-header');
        if (!headerEl) return;
        // Only handle headers that are within this menu instance
        if (!menu.contains(headerEl)) return;
        handleAccordionToggle(headerEl);
    });

    // Keyboard support: Enter or Space toggles focused header
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const active = document.activeElement;
        if (!active) return;
        if (!active.classList.contains('mobile-accordion-header')) return;
        e.preventDefault();
        handleAccordionToggle(active);
    });
}

// ================================================
// TESTIMONIAL SLIDER WITH TOUCH SWIPE
// ================================================
function initTestimonialSlider() {
    const sliderContainer = document.querySelector('.testimonials-slider') || document.querySelector('.testimonial-container');
    const slides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.querySelector('.testimonial-dots');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    let dots = [];
    let timer = null;
    
    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'testimonial-dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
        dot.addEventListener('click', () => goToSlide(index));
        if (dotsContainer) dotsContainer.appendChild(dot);
        dots.push(dot);
    });
    
    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) slide.classList.add('active');
        });
        updateDots();
    }
    
    function goToSlide(index) {
        currentSlide = (index + slides.length) % slides.length;
        showSlide(currentSlide);
    }
    
    function startAutoSlide() {
        stopAutoSlide();
        timer = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 5000);
    }
    
    function stopAutoSlide() {
        if (timer) clearInterval(timer);
    }
    
    // Touch Swipe support
    if (sliderContainer) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        sliderContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        }, { passive: true });
        
        sliderContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoSlide();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 40;
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swiped Left -> next slide
                goToSlide(currentSlide + 1);
            } else if (touchEndX - touchStartX > swipeThreshold) {
                // Swiped Right -> prev slide
                goToSlide(currentSlide - 1);
            }
        }
    }
    
    showSlide(0);
    startAutoSlide();
}

// ================================================
// GALLERY LIGHTBOX (ABOUT PAGE)
// ================================================
function initGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    if (galleryItems.length === 0) return;
    
    // Create lightbox modal DOM
    const lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.id = 'galleryLightbox';
    lightbox.innerHTML = `
        <button class="gallery-lightbox-close" aria-label="Close preview">&times;</button>
        <img src="" alt="Gallery Preview">
    `;
    document.body.appendChild(lightbox);
    
    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.gallery-lightbox-close');
    
    galleryItems.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || 'Gallery Preview';
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}

// ================================================
// PRODUCT PREVIEW MODAL
// ================================================
function initProductPreview() {
    const productCards = document.querySelectorAll('.product-card[data-preview-src]');
    if (productCards.length === 0) return;

    const preview = document.createElement('div');
    preview.className = 'product-preview-lightbox';
    preview.id = 'productPreviewLightbox';
    preview.innerHTML = `
        <button class="product-preview-close" aria-label="Close preview">&times;</button>
        <div class="product-preview-panel" role="dialog" aria-modal="true" aria-label="Product preview">
            <img class="product-preview-image" alt="Product preview">
            <div class="product-preview-content">
                <h2 class="product-preview-title"></h2>
                <div class="product-preview-body"></div>
            </div>
        </div>
    `;
    document.body.appendChild(preview);

    const previewImage = preview.querySelector('.product-preview-image');
    const previewTitle = preview.querySelector('.product-preview-title');
    const previewBody = preview.querySelector('.product-preview-body');
    const closeBtn = preview.querySelector('.product-preview-close');

    const closePreview = () => {
        preview.classList.remove('active');
        document.body.style.overflow = '';
    };

    const openPreview = (card) => {
        const src = card.getAttribute('data-preview-src');
        const title = card.getAttribute('data-preview-title') || card.querySelector('.product-name')?.textContent || 'Product Preview';
        const description = card.getAttribute('data-preview-description') || '';

        previewImage.src = src;
        previewImage.alt = title;
        previewTitle.textContent = title;

        const lines = description.split('\n').map(line => line.trim());
        const sections = [];
        let currentSection = null;

        lines.forEach(line => {
            if (!line) return;
            if (line === 'Key Features' || line === 'Specifications') {
                currentSection = { title: line, items: [] };
                sections.push(currentSection);
                return;
            }

            if (currentSection && currentSection.title === 'Key Features' && line) {
                currentSection.items.push(line);
                return;
            }

            if (currentSection && currentSection.title === 'Specifications') {
                currentSection.items.push(line);
                return;
            }

            sections.push({ paragraph: line });
        });

        previewBody.innerHTML = sections.map(section => {
            if (section.paragraph) {
                return `<p>${section.paragraph}</p>`;
            }

            if (section.title === 'Key Features') {
                return `<h3>${section.title}</h3><ul>${section.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            }

            if (section.title === 'Specifications') {
                return `<h3>${section.title}</h3><ul>${section.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            }

            return '';
        }).join('');

        preview.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    productCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const clickedButton = e.target.closest('[data-product]');
            if (clickedButton) return;
            openPreview(card);
        });
    });

    closeBtn.addEventListener('click', closePreview);
    preview.addEventListener('click', (e) => {
        if (e.target === preview) closePreview();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePreview();
    });
}

// ================================================
// PRODUCT FILTER (GROUP + CATEGORY)
// ================================================
function initProductFilter() {
    const groupContainer = document.getElementById('groupFilters');
    const subContainer = document.getElementById('subFilters');
    const productCards = Array.from(document.querySelectorAll('.product-card'));

    console.log('initProductFilter - groupContainer:', groupContainer, 'subContainer:', subContainer, 'productCards count:', productCards.length);

    if (!groupContainer || !subContainer || productCards.length === 0) {
        console.error('initProductFilter exiting - missing elements');
        return;
    }

    let activeGroup = null; // default: show all groups
    let activeSubgroup = null; // for gymwear
    let activeItem = 'all';

    function createButton(label, attrs = {}) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.type = 'button';
        btn.textContent = label;
        Object.keys(attrs).forEach(k => btn.setAttribute(k, attrs[k]));
        return btn;
    }

    function renderGroupButtons() {
        groupContainer.innerHTML = '';
        // Add "All" button first
        const allBtn = createButton('ALL', { 'data-group': 'all' });
        if (activeGroup === null) allBtn.classList.add('active');
        allBtn.addEventListener('click', () => {
            activeGroup = null;
            activeSubgroup = null;
            activeItem = 'all';
            groupContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            renderSubFilters();
            applyFilters(true);
        });
        groupContainer.appendChild(allBtn);

        window.categoryData.forEach((g, i) => {
            const btn = createButton(g.group.toUpperCase(), { 'data-group': g.slug });
            if (g.slug === activeGroup) btn.classList.add('active');
            btn.addEventListener('click', () => {
                activeGroup = g.slug;
                activeSubgroup = null;
                activeItem = 'all';
                // Update active state
                groupContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderSubFilters();
                applyFilters(true);
            });
            groupContainer.appendChild(btn);
        });
    }

    function renderSubFilters() {
        subContainer.innerHTML = '';
        // If "All" groups selected, show all items from all groups
        if (activeGroup === null) {
            const row = document.createElement('div');
            row.className = 'filter-scroll';
            const allBtn = createButton('All Items', { 'data-item': 'all' });
            allBtn.classList.add('active');
            allBtn.addEventListener('click', () => {
                activeItem = 'all';
                activeSubgroup = null;
                row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
                applyFilters();
            });
            row.appendChild(allBtn);

            // Collect all items from all groups
            window.categoryData.forEach(g => {
                if (g.items && Array.isArray(g.items)) {
                    g.items.forEach(it => {
                        const btn = createButton(it.name, { 'data-item': it.slug });
                        btn.addEventListener('click', () => {
                            activeItem = it.slug;
                            activeSubgroup = null;
                            activeGroup = null;
                            row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            // remove tier3 if exists
                            const existing = document.getElementById('tier3Filters');
                            if (existing) existing.remove();
                            applyFilters();
                        });
                        row.appendChild(btn);
                    });
                }
                if (g.subGroups && Array.isArray(g.subGroups)) {
                    g.subGroups.forEach(sg => {
                        if (sg.items && Array.isArray(sg.items)) {
                            sg.items.forEach(it => {
                                const btn = createButton(it.name, { 'data-item': it.slug });
                                btn.addEventListener('click', () => {
                                    activeItem = it.slug;
                                    activeSubgroup = sg.slug;
                                    activeGroup = g.slug;
                                    row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                                    btn.classList.add('active');
                                    applyFilters();
                                });
                                row.appendChild(btn);
                            });
                        }
                    });
                }
            });
            subContainer.appendChild(row);
            return;
        }

        const group = window.categoryData.find(c => c.slug === activeGroup);
        if (!group) return;

        // Tier 2: for gymwear show subgroup pills, otherwise show items
        const row = document.createElement('div');
        row.className = 'filter-scroll';

        const allBtn = createButton('All', { 'data-item': 'all' });
        allBtn.classList.add('active');
        allBtn.addEventListener('click', () => {
            activeItem = 'all';
            activeSubgroup = null;
            row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            // remove tier3 if exists
            const existing = document.getElementById('tier3Filters');
            if (existing) existing.remove();
            applyFilters();
        });
        row.appendChild(allBtn);

        if (group.subGroups && Array.isArray(group.subGroups)) {
            // render subgroup pills
            group.subGroups.forEach(sg => {
                const btn = createButton(sg.subGroup, { 'data-subgroup': sg.slug });
                btn.addEventListener('click', () => {
                    // select subgroup
                    activeSubgroup = sg.slug;
                    activeItem = 'all';
                    row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderTier3ForGym(sg);
                    applyFilters();
                });
                row.appendChild(btn);
            });
            subContainer.appendChild(row);
        } else if (group.items && Array.isArray(group.items)) {
            // render items directly
            group.items.forEach(it => {
                const btn = createButton(it.name, { 'data-item': it.slug });
                btn.addEventListener('click', () => {
                    activeItem = it.slug;
                    activeSubgroup = null;
                    // remove tier3 if exists
                    const existing = document.getElementById('tier3Filters');
                    if (existing) existing.remove();
                    row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyFilters();
                });
                row.appendChild(btn);
            });
            subContainer.appendChild(row);
        }
    }

    // Tier 3 for Gymwear subgroup items
    function renderTier3ForGym(subgroup) {
        // remove existing tier3 if any
        const existing = document.getElementById('tier3Filters');
        if (existing) existing.remove();

        const sg = window.categoryData.find(c => c.slug === activeGroup)?.subGroups?.find(s => s.slug === subgroup);
        if (!sg) return;

        const tier3 = document.createElement('div');
        tier3.id = 'tier3Filters';
        tier3.className = 'filter-scroll';

        const allBtn = createButton('All', { 'data-item': 'all' });
        allBtn.classList.add('active');
        allBtn.addEventListener('click', () => {
            activeItem = 'all';
            tier3.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            applyFilters();
        });
        tier3.appendChild(allBtn);

        sg.items.forEach(it => {
            const btn = createButton(it.name, { 'data-item': it.slug });
            btn.addEventListener('click', () => {
                activeItem = it.slug;
                tier3.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyFilters();
            });
            tier3.appendChild(btn);
        });

        subContainer.appendChild(tier3);
    }

    function applyFilters(scrollToGrid = false) {
        productCards.forEach(card => {
            const cardGroup = card.getAttribute('data-group');
            const cardSubgroup = card.getAttribute('data-subgroup');
            const cardItem = card.getAttribute('data-item') || '';

            let show = true;
            // If activeGroup is null, show all groups
            if (activeGroup !== null) show = cardGroup === activeGroup;
            if (show && activeSubgroup) show = cardSubgroup === activeSubgroup;
            if (show && activeItem && activeItem !== 'all') show = cardItem === activeItem;

            if (show) {
                card.style.display = 'flex';
                // Reset opacity and transform so cards shown by filtering are never stuck at opacity: 0 from initial entrance GSAP state
                if (typeof gsap !== 'undefined') {
                    gsap.set(card, { opacity: 1, y: 0, clearProps: 'transform' });
                } else {
                    card.style.opacity = '1';
                }
            } else {
                card.style.display = 'none';
            }
        });

        console.log('applyFilters - activeGroup:', activeGroup, 'activeItem:', activeItem, 'showing cards:', productCards.filter(c => c.style.display !== 'none').length);

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }

        if (scrollToGrid) {
            const grid = document.getElementById('productsGrid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Read URL params to preselect
    (function checkURLParams() {
        const params = new URLSearchParams(window.location.search);
        const g = params.get('group');
        const sg = params.get('subgroup');
        const it = params.get('item');
        const cat = params.get('category'); // legacy support: category slug

        // Map legacy category param to group/item
        if (cat && !g && !it) {
            const categoryMap = {
                'basketball': ['sportswear', 'basketball-uniforms'],
                'soccer': ['sportswear', 'football-soccer-kits'],
                'football': ['sportswear', 'football-soccer-kits'],
                'volleyball': ['sportswear', 'volleyball-uniforms'],
                'american-football': ['sportswear', 'american-football-uniforms'],
                'baseball': ['sportswear', 'baseball-uniforms'],
                'gym-wear': ['gymwear', null],
                'martial-arts': ['martial-arts', null],
                'karate': ['karate', 'karate-uniform'],
            };
            if (categoryMap[cat]) {
                activeGroup = categoryMap[cat][0];
                activeItem = categoryMap[cat][1] || 'all';
            }
        }

        if (g) activeGroup = g;
        if (it) activeItem = it;
        if (sg) activeSubgroup = sg;

        renderGroupButtons();
        renderSubFilters();

        if (activeGroup && activeSubgroup) {
            renderTier3ForGym(activeSubgroup);
        }

        // Apply active classes to buttons after rendering
        if (activeGroup === null) {
            // "ALL" is active in group row
            const allGroupBtn = groupContainer.querySelector('[data-group="all"]');
            if (allGroupBtn) allGroupBtn.classList.add('active');
        }

        // Mark active item button
        const allItemBtns = subContainer.querySelectorAll('[data-item]');
        allItemBtns.forEach(btn => {
            if ((activeItem === 'all' && btn.getAttribute('data-item') === 'all') ||
                (btn.getAttribute('data-item') === activeItem)) {
                btn.classList.add('active');
            } else if (btn.getAttribute('data-item') === 'all' && activeItem !== 'all') {
                btn.classList.remove('active');
            }
        });

        const allSubgroupBtns = subContainer.querySelectorAll('[data-subgroup]');
        allSubgroupBtns.forEach(btn => {
            if (btn.getAttribute('data-subgroup') === activeSubgroup) {
                btn.classList.add('active');
            }
        });

        // Apply final selection
        applyFilters(true);
    })();
}

// ================================================
// FOOTER ACCORDION
// ================================================
function initFooterAccordion() {
    const accordionToggles = document.querySelectorAll('.footer-accordion-toggle');
    
    accordionToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const footerCol = toggle.closest('.footer-col');
            footerCol.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', footerCol.classList.contains('is-open'));
        });
    });
}

// ================================================
// CONTACT FORM
// ================================================
function initContactForm() {
    const form = document.querySelector('.contact-form');
    
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = form.querySelector('#name').value;
        const phone = form.querySelector('#phone').value;
        const email = form.querySelector('#email').value;
        const productInterest = form.querySelector('#product-interest').value;
        const message = form.querySelector('#message').value;
        
        const fullMessage = `
New Inquiry from Fitting Club Website:

Name: ${name}
Phone: ${phone}
Email: ${email}
Product Interest: ${productInterest}
Message: ${message}
        `.trim();
        
        openWhatsApp(fullMessage);
    });
}

// ================================================
// SCROLL ANIMATIONS
// ================================================
function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);
    
    // Animate sections
    gsap.utils.toArray('.section').forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'power2.out'
        });
    });
    
    // Animate category cards
    gsap.utils.toArray('.category-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power2.out'
        });
    });
    
    // Animate product cards
    gsap.utils.toArray('.product-card').forEach((card, i) => {
        if (window.getComputedStyle(card).display === 'none') {
            gsap.set(card, { opacity: 1, y: 0 });
            return;
        }
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power2.out'
        });
    });
}

// ================================================
// PROCESS SECTION
// ================================================
function initProcessSection() {
    const processSteps = document.querySelectorAll('.process-step');
    const processLineProgress = document.querySelector('.process-line-progress');
    const processCards = document.querySelectorAll('.process-card');
    const processVideos = document.querySelectorAll('.process-video');
    
    if (processSteps.length === 0) return;
    
    // Hide image placeholders when images load
    document.querySelectorAll('.process-image-wrapper img').forEach(img => {
        img.addEventListener('load', () => {
            const placeholder = img.previousElementSibling;
            if (placeholder && placeholder.classList.contains('process-image-placeholder')) {
                placeholder.style.opacity = '0';
                placeholder.style.transition = 'opacity 0.5s ease';
                setTimeout(() => placeholder.remove(), 500);
            }
        });
        
        // In case image is already loaded
        if (img.complete) {
            const placeholder = img.previousElementSibling;
            if (placeholder && placeholder.classList.contains('process-image-placeholder')) {
                placeholder.style.opacity = '0';
                setTimeout(() => placeholder.remove(), 500);
            }
        }
    });
    
    // Tilt on hover effect (already handled by initCardTiltAndGlare, but just in case)
    processCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';
            card.style.transition = 'transform 0.1s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.5s ease';
        });
    });

    const syncProcessVideo = (video, shouldPlay) => {
        if (!video) return;

        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } else {
            video.pause();
        }
    };
    
    // Scroll reveal and line progress
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                syncProcessVideo(entry.target.querySelector('.process-video'), true);
                
                // Update line progress
                if (processLineProgress) {
                    const stepIndex = Array.from(processSteps).indexOf(entry.target);
                    const progress = ((stepIndex + 0.5) / processSteps.length) * 100;
                    processLineProgress.style.height = progress + '%';
                }
            } else {
                syncProcessVideo(entry.target.querySelector('.process-video'), false);
            }
        });
    }, { threshold: 0.3 });
    
    processSteps.forEach(step => observer.observe(step));
    
    // Initial line progress check
    if (processLineProgress && processSteps.length > 0) {
        const checkInitialProgress = () => {
            let visibleCount = 0;
            processSteps.forEach((step, i) => {
                const rect = step.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.7) {
                    visibleCount = i + 1;
                    step.classList.add('visible');
                }
            });
            if (visibleCount > 0) {
                processLineProgress.style.height = ((visibleCount - 0.5) / processSteps.length) * 100 + '%';

            processVideos.forEach(video => {
                video.addEventListener('loadedmetadata', () => {
                    syncProcessVideo(video, video.closest('.process-step')?.classList.contains('visible') ?? false);
                });
            });
            }
        };
        checkInitialProgress();
    }
}
