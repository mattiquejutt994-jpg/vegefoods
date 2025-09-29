// Basic interactivity for Vegefoods
(function(){
    // Theme: init + toggle
    const applyTheme = (mode)=>{
        document.documentElement.setAttribute('data-theme', mode);
        try{ localStorage.setItem('vege-theme', mode); }catch(e){}
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = mode==='dark' ? '☀️ Light' : '🌙 Dark';
    };
    const saved = (()=>{ try{ return localStorage.getItem('vege-theme'); }catch(e){ return null; } })();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    // Inject toggle button into header-actions
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('theme-toggle')){
        const btn = document.createElement('button');
        btn.className = 'theme-toggle';
        btn.id = 'theme-toggle';
        btn.type = 'button';
        btn.addEventListener('click', ()=>{
            const current = document.documentElement.getAttribute('data-theme')==='dark' ? 'dark' : 'light';
            applyTheme(current==='dark' ? 'light' : 'dark');
        });
        headerActions.insertBefore(btn, headerActions.firstChild);
        // sync label
        btn.textContent = document.documentElement.getAttribute('data-theme')==='dark' ? '☀️ Light' : '🌙 Dark';
    }
    const nav = document.getElementById('primary-nav');
    const burger = document.getElementById('hamburger');
    const header = document.querySelector('.site-header');
    if (burger && nav) {
        burger.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            burger.setAttribute('aria-expanded', String(isOpen));
        });
    }

    // Header shadow on scroll
    if (header){
        const set = () => {
            if (window.scrollY > 4) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        };
        set();
        window.addEventListener('scroll', set, { passive:true });
    }

    // Simple scroll reveal animations
    const observer = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
            if (e.isIntersecting){
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

    // Removed random background on feature cards per user request

    const featured = document.getElementById('featured-products');
    if (featured) {
        const products = [
            { id:'apple', name:'Fresh Apples', price:4.99, img:'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&q=60' },
            { id:'carrot', name:'Organic Carrots', price:2.49, img:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=60' },
            { id:'spinach', name:'Baby Spinach', price:3.29, img:'https://images.unsplash.com/photo-1607301405390-0a22c71da3ab?w=800&q=60' },
            { id:'orange', name:'Navel Oranges', price:5.10, img:'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=60' }
        ];
        featured.innerHTML = products.map(p => `
            <article class="product reveal" data-id="${p.id}">
              <div class="media" aria-hidden="true"><img src="${p.img}" alt="${p.name}"/></div>
              <h3>${p.name}</h3>
              <div class="price">$${p.price.toFixed(2)}</div>
              <div class="actions">
                <button class="btn" data-action="details">Details</button>
                <button class="btn primary" data-action="add">Add to Cart</button>
              </div>
            </article>
        `).join('');

        featured.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            const card = target.closest('.product');
            if (!card) return;
            const id = card.getAttribute('data-id');
            if (!id) return;
            if (target.matches('[data-action="add"]')) {
                    addToCart(id, 1); // Call the AJAX function to add the item to the cart
            } else if (target.matches('[data-action="details"]')) {
                window.location.href = 'product.html?id=' + encodeURIComponent(id);
            }
        });
    }
    // Toast container injection
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer){
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Global toast utility
    window.showToast = function(message, type){
        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'success');
        toast.innerHTML = '<span class="icon">' + (type==='error' ? '⚠️' : '✅') + '</span>' +
                          '<span class="msg">' + message + '</span>' +
                          '<button class="close" aria-label="Close">✕</button>';
        toast.querySelector('.close').addEventListener('click', ()=> remove());
        toastContainer.appendChild(toast);
        requestAnimationFrame(()=> toast.classList.add('show'));
        const timeout = setTimeout(remove, 2500);
        function remove(){
            clearTimeout(timeout);
            toast.classList.remove('show');
            setTimeout(()=> toast.remove(), 250);
        }
        return remove;
    };

})();

// Add to Cart handler using local VegeCart and toast
function addToCart(productId, quantity){
    try{
        if (window.VegeCart){
            window.VegeCart.addItem({ id: String(productId), qty: quantity || 1, name: String(productId) });
            if (window.showToast) window.showToast('Added to cart successfully', 'success');
        } else {
            if (window.showToast) window.showToast('Cart not initialized', 'error');
        }
    }catch(e){
        if (window.showToast) window.showToast('Failed to add to cart', 'error');
        else alert('Failed to add to cart');
    }
}

// Global hook: whenever VegeCart.addItem is called, also show toast
(function(){
    let hooked = false;
    function hook(){
        if (hooked) return true;
        const cart = window.VegeCart;
        if (!cart || !cart.addItem) return false;
        const originalAdd = cart.addItem.bind(cart);
        cart.addItem = function(item){
            const result = originalAdd(item);
            if (window.showToast) window.showToast('Added to cart successfully', 'success');
            return result;
        };
        hooked = true;
        return true;
    }
    // Try immediately
    if (!hook()){
        // Poll briefly until cart.js initializes VegeCart
        const start = Date.now();
        const timer = setInterval(()=>{
            if (hook() || Date.now() - start > 5000){
                clearInterval(timer);
            }
        }, 100);
        // Also try on DOMContentLoaded just in case
        document.addEventListener('DOMContentLoaded', hook, { once:true });
    }
})();
