// Very small cart utility stored in localStorage
window.VegeCart = (function(){
  const STORAGE_KEY = 'vegefoods.cart.v1';
  const countEl = document.getElementById('cart-count');
  let memoryItems = null; // Fallback for environments where localStorage is unavailable (iOS private mode)
  const COOKIE_KEY = 'vege_cart';

  function safeParse(json){
    try { return JSON.parse(json); } catch { return null; }
  }

  function readCookie(){
    const match = document.cookie.split('; ').find(c => c.startsWith(COOKIE_KEY + '='));
    if (!match) return null;
    try{
      const value = decodeURIComponent(match.split('=')[1] || '');
      const parsed = safeParse(value);
      return Array.isArray(parsed) ? parsed : null;
    }catch{ return null; }
  }
  function writeCookie(items){
    try{
      const value = encodeURIComponent(JSON.stringify(items || []));
      const expires = new Date(Date.now() + 7*24*60*60*1000).toUTCString();
      document.cookie = COOKIE_KEY + '=' + value + '; Expires=' + expires + '; Path=/; SameSite=Lax';
    }catch{}
  }
  function clearCookie(){
    document.cookie = COOKIE_KEY + '=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax';
  }

  function read(){
    // Prefer memory fallback if set
    if (Array.isArray(memoryItems)) return memoryItems;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = safeParse(raw || '[]');
      if (Array.isArray(parsed)) return parsed;
      // If localStorage empty or invalid, try cookie
      const fromCookie = readCookie();
      return Array.isArray(fromCookie) ? fromCookie : [];
    } catch (e) {
      // On error (e.g., Safari private), fallback to in-memory
      const fromCookie = readCookie();
      if (Array.isArray(fromCookie)) return fromCookie;
      memoryItems = Array.isArray(memoryItems) ? memoryItems : [];
      return memoryItems;
    }
  }

  function write(items){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      // If write succeeds, clear memory fallback
      memoryItems = null;
      // Keep cookie in sync for cross-context
      writeCookie(items);
    } catch (e) {
      // Fallback for environments where setItem throws
      memoryItems = Array.isArray(items) ? items : [];
      writeCookie(memoryItems);
    }
    updateBadge(items);
  }

  function updateBadge(items){
    if (!countEl) return;
    const count = items.reduce((sum, it) => sum + (it.qty||0), 0);
    countEl.textContent = String(count);
  }

  function addItem(item){
    const items = read();
    const existing = items.find(x => x.id === item.id);
    if (existing) existing.qty += item.qty || 1; else items.push({ ...item, qty: item.qty || 1 });
    write(items);
  }

  function removeItem(id){
    write(read().filter(x => x.id !== id));
  }

  function setQty(id, qty){
    const items = read();
    const it = items.find(x => x.id === id);
    if (it){ it.qty = Math.max(0, qty|0); }
    write(items.filter(x => x.qty > 0));
  }

  function getItems(){ return read(); }
  function clear(){ write([]); clearCookie(); }

  // Initialize badge
  updateBadge(read());
  return { addItem, removeItem, setQty, getItems, clear };
})();

