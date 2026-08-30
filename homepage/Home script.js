// OpenDots - Stunning Homepage JavaScript

const CHAR_SPEED   = 28;   // faster = lower number
const LINE_PAUSE   = 500;  // gap between the two lines
const START_DELAY  = 600;  // wait before typing begins
document.addEventListener('DOMContentLoaded', function() {
    
   
    // SMOOTH SCROLLING
   
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') {
                e.preventDefault();
                return;
            }
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
   
    // NAVBAR SCROLL EFFECT
   
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
   
    // INTERSECTION OBSERVER FOR ANIMATIONS
   
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animation
    const animatedElements = document.querySelectorAll('.feature-card, .use-case-card, .tech-category');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px)';
        element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(element);
    });
    
   
    // DYNAMIC GRADIENT ORB MOVEMENT
   
    const orbs = document.querySelectorAll('.gradient-orb');
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
        
        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * 50 * speed;
            const y = (mouseY - 0.5) * 50 * speed;
            
            orb.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
    
   
    // FLOATING CARDS PARALLAX
   
    const floatingCards = document.querySelectorAll('.floating-card');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        floatingCards.forEach((card, index) => {
            const speed = (index + 1) * 0.1;
            const yPos = -(scrolled * speed);
            card.style.transform = `translateY(${yPos}px)`;
        });
    });
    
   
    // ANIMATED NUMBERS (Stats Counter)
   
    const stats = document.querySelectorAll('.stat-number');
    let hasAnimated = false;
    
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                animateStats();
            }
        });
    }, { threshold: 0.5 });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
    
    function animateStats() {
        stats.forEach(stat => {
            const text = stat.textContent;
            // Only animate if it's a number
            if (!isNaN(text.replace('%', ''))) {
                const target = parseInt(text);
                let current = 0;
                const increment = target / 50;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.textContent = text;
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(current) + (text.includes('%') ? '%' : '');
                    }
                }, 30);
            }
        });
    }
    
   
    // BUTTON RIPPLE EFFECT
   
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
   
    // FEATURE CARDS TILT EFFECT
   
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
   
    // PROGRESS BAR ANIMATION
   
    const progressBars = document.querySelectorAll('.progress-fill');
    
    progressBars.forEach(bar => {
        const animate = () => {
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.transition = 'width 2s ease-in-out';
                bar.style.width = '70%';
            }, 100);
        };
        
        animate();
        setInterval(animate, 3000);
    });
    
   
    // TECH TAGS WAVE ANIMATION
   
    const techTags = document.querySelectorAll('.tech-tag');
    
    techTags.forEach((tag, index) => {
        setTimeout(() => {
            tag.style.opacity = '0';
            tag.style.transform = 'translateY(10px)';
            tag.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                tag.style.opacity = '1';
                tag.style.transform = 'translateY(0)';
            }, 50);
        }, index * 50);
    });
    
   
    // LAZY LOADING OPTIMIZATION
   
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => imageObserver.observe(img));
    }
    
   
    // PERFORMANCE MONITORING
   
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Preload critical resources
            const criticalLinks = document.querySelectorAll('a[href="index.html"]');
            criticalLinks.forEach(link => {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'prefetch';
                preloadLink.href = link.getAttribute('href');
                document.head.appendChild(preloadLink);
            });
        });
    }
    
   
    // EASTER EGGS
   
    console.log('%c🚀 OpenDots', 'font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #000 0%, #666 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
    console.log('%c✨ Stunning Black & White Design', 'font-size: 16px; color: #666;');
    console.log('%c🎨 Featuring: Gradients • Glassmorphism • Animations', 'font-size: 14px; color: #999;');
    console.log('%c💻 GitHub: https://github.com/multiverseweb/OpenDots', 'font-size: 14px; color: #000; font-weight: bold;');
    console.log('%c🤝 Interested in contributing? We\'d love to have you!', 'font-size: 14px; color: #22c55e; font-weight: bold;');
    
    // Konami Code Easter Egg
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.key);
        konamiCode = konamiCode.slice(-konamiSequence.length);
        
        if (konamiCode.join('') === konamiSequence.join('')) {
            console.log('%c🎮 KONAMI CODE ACTIVATED! 🎮', 'font-size: 24px; color: #000; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);');
            console.log('%c🌟 You found the secret! Thanks for exploring!', 'font-size: 16px; color: #666;');
            
            // Add fun visual effect
            document.body.style.animation = 'rainbow 2s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 2000);
        }
    });
    
    // Rainbow animation for easter egg
    const rainbowStyle = document.createElement('style');
    rainbowStyle.textContent = `
        @keyframes rainbow {
            0%, 100% { filter: hue-rotate(0deg); }
            50% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(rainbowStyle);
    
   
    // ACCESSIBILITY ENHANCEMENTS
   
    // Add keyboard navigation for cards
    const interactiveCards = document.querySelectorAll('.feature-card, .use-case-card, .tech-category');
    
    interactiveCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                card.click();
            }
        });
    });
    
   
    // PAGE LOAD PERFORMANCE
   
    window.addEventListener('load', () => {
        // Remove loading class if exists
        document.body.classList.remove('loading');
        
        // Log performance metrics
        if ('performance' in window) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`%c⚡ Page loaded in ${pageLoadTime}ms`, 'color: #22c55e; font-weight: bold;');
        }
    });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}


// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debounce, throttle };
}