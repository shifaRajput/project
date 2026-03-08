// navigation bar 
const navItems = document.querySelectorAll(".navbar-center li");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    // Check if the click was on an anchor tag or inside the li
    // We want the browser to follow the link, so we don't use e.preventDefault()
    
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// Add logic to set active class based on current URL on page load
// Add logic to set active class based on current URL on page load
window.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    
    // --- Desktop Navigation ---
    const desktopLinks = document.querySelectorAll(".navbar-center a");
    const desktopLis = document.querySelectorAll(".navbar-center li");
    
    desktopLinks.forEach(link => {
        // If the link matches the current Flask route
        if (link.getAttribute("href") === currentPath) {
            desktopLis.forEach(li => li.classList.remove("active"));
            link.parentElement.classList.add("active");
        }
    });

    // --- Mobile Bottom Navigation ---
    const mobileLinks = document.querySelectorAll(".mobile-bottom-nav a.nav-item");
    
    mobileLinks.forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            mobileLinks.forEach(i => i.classList.remove("active"));
            link.classList.add("active");
        }
    });
});

let orders = [], selectedPay = '', pendingTotal = 0;

document.addEventListener('DOMContentLoaded', () => {
  fetchOrders();
  document.getElementById('cardNumber').addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'').substring(0,16);
    this.value = v.replace(/(.{4})/g,'$1 ').trim();
  });
  document.getElementById('expiry').addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'').substring(0,4);
    this.value = v.length > 2 ? v.substring(0,2) + '/' + v.substring(2) : v;
  });
});

async function fetchOrders() {
  try {
    const res = await fetch('/api/my-orders');
    if (res.status === 401) { window.location.href = '/'; return; }
    const data = await res.json();

    orders = data.orders.filter(o => o.status === 'pending');
    pendingTotal = orders.reduce((s,o) => s + o.total_price, 0);

    // Defensive updates: Only update if the element exists in payment.html
    if (document.getElementById('navUserName')) document.getElementById('navUserName').textContent = data.username;
    if (document.getElementById('bagCount')) document.getElementById('bagCount').textContent = orders.length;
    
    // Ensure these IDs exist in payment.html or the script will halt
    const summaryItemsLabel = document.getElementById('summaryItemsLabel');
    if (summaryItemsLabel) summaryItemsLabel.textContent = `Items (${orders.length})`;

    const summaryItemsAmt = document.getElementById('summaryItemsAmt');
    if (summaryItemsAmt) summaryItemsAmt.textContent = fmt(pendingTotal);

    const summaryTotal = document.getElementById('summaryTotal');
    if (summaryTotal) summaryTotal.textContent = fmt(pendingTotal);

    const payBtnAmount = document.getElementById('payBtnAmount');
    if (payBtnAmount) payBtnAmount.textContent = fmt(pendingTotal);

    renderOrderItems();
  } catch(e) { 
    console.error("Order fetch error:", e);
    showToast('Could not load orders.', 'error'); 
  }
}

function renderOrderItems() {
  const el = document.getElementById('orderItemsList');
  if (!orders.length) {
    el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No pending orders.</p>';
    return;
  }
  el.innerHTML = orders.map(o => `
    <div class="order-item">
      <div class="item-img">📦</div>
      <div class="item-info">
        <div class="item-name">${esc(o.product_name)}</div>
        <div class="item-desc">${esc(o.product_description || '')} · Qty: ${o.quantity}</div>
      </div>
      <div class="item-price">${fmt(o.total_price)}</div>
    </div>`).join('');
}

function goToStep(n) {
  document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`stepContent${n}`) || document.getElementById('stepContentSuccess');
  target.classList.add('active');
  [1,2,3].forEach(i => {
    const s = document.getElementById(`step${i}indicator`);
    s.classList.remove('active','done');
    if (i < n) s.classList.add('done');
    if (i === n) s.classList.add('active');
  });
  document.getElementById('line1').classList.toggle('done', n > 1);
  document.getElementById('line2').classList.toggle('done', n > 2);
  window.scrollTo({ top:0, behavior:'smooth' });
}

function goToStep2() {
  if (!validateAddress()) return;
  const landmark = v('landmark');
  const addr = `${v('house')}, ${v('road')}${landmark ? ', ' + landmark : ''}, ${v('city')}, ${v('state')} - ${v('pincode')}`;
  document.getElementById('addressPreview').innerHTML = `<strong>${esc(v('fullName'))} &nbsp;·&nbsp; ${v('phone')}</strong>${esc(addr)}`;
  goToStep(2);
}

function goToStep3() {
  if (!orders.length) { showToast('No pending orders to pay.','error'); return; }
  goToStep(3);
}

function validateAddress() {
  let ok = true;
  const fields = [
    { id:'fullName', err:'errFullName', msg:'Full name is required' },
    { id:'phone',    err:'errPhone',    msg:'Valid 10-digit number required', fn: x => /^\d{10}$/.test(x) },
    { id:'house',    err:'errHouse',    msg:'House/Flat no. is required' },
    { id:'road',     err:'errRoad',     msg:'Road/Area is required' },
    { id:'city',     err:'errCity',     msg:'City is required' },
    { id:'state',    err:'errState',    msg:'State is required' },
    { id:'pincode',  err:'errPincode',  msg:'Valid 6-digit pincode required', fn: x => /^\d{6}$/.test(x) },
  ];
  fields.forEach(f => {
    const val   = v(f.id);
    const valid = f.fn ? f.fn(val) : val.trim() !== '';
    document.getElementById(f.err).textContent = valid ? '' : f.msg;
    document.getElementById(f.id).classList.toggle('error', !valid);
    if (!valid) ok = false;
  });
  return ok;
}

function selectPayment(method, labelEl) {
  selectedPay = method;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  labelEl.classList.add('selected');
  document.getElementById('cardFields').classList.toggle('visible', method === 'card');
  document.getElementById('codNote').classList.toggle('visible',   method === 'cod');
  labelEl.querySelector('input[type="radio"]').checked = true;
}

// THIS IS THE UPDATED SUBMIT LOGIC
async function submitPayment() {
  if (!selectedPay) { showToast('Please select a payment method.', 'error'); return; }
  if (!orders.length) { showToast('No orders to pay.', 'error'); return; }

  const btn = document.getElementById('payBtn');
  btn.disabled = true; btn.textContent = 'Processing…';

  // Gather the exact address they typed in
  const landmark = v('landmark');
  const fullAddress = `${v('house')}, ${v('road')}${landmark ? ', ' + landmark : ''}, ${v('city')}, ${v('state')} - ${v('pincode')}`;
  const phoneNum = v('phone');

  let successCount = 0;
  for (const o of orders) {
    try {
      const res = await fetch(`/api/pay/${o.order_id}`, { 
        method:'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send address data to the backend to update the user table
        body: JSON.stringify({
            payMethod: selectedPay,
            address: fullAddress,
            phone: phoneNum
        })
      });
      if (res.ok) successCount++;
    } catch {}
  }

  btn.disabled = false;
  btn.innerHTML = `Pay <span id="payBtnAmount">${fmt(pendingTotal)}</span>`;

  if (successCount > 0) {
    document.getElementById('successMsg').textContent = `${successCount} order(s) paid via ${payLabel(selectedPay)}. Total: ${fmt(pendingTotal)}`;
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('stepContentSuccess').classList.add('active');
    
    // THIS STAYS INSIDE THE IF BRACKET
    setTimeout(() => {
        window.location.href = '/myorders'; 
    }, 3000);

  } else {
    showToast('Payment failed. Try again.', 'error');
  }
}

const v   = id  => document.getElementById(id)?.value || '';
const fmt = n   => '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const esc = s   => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const payLabel = m => ({gpay:'Google Pay', card:'Credit/Debit Card', cod:'Cash on Delivery'}[m] || m);

let toastT;
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `show ${type}`;
  clearTimeout(toastT);
  toastT = setTimeout(() => t.className = '', 3000);
}