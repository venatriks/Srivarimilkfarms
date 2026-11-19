const allowedFields = new Set(['p_customer_name','p_customer_email','p_customer_phone','p_address','p_items','p_delivery_slot','p_instructions','p_payment_method','p_idempotency_key','p_whatsapp_consent']);
const paymentMethods = new Set(['UPI Instant Pay','Cash on Delivery','Razorpay']);
const deliverySlots = new Set(['5:00 AM - 6:00 AM','5:30 AM - 6:30 AM','6:30 AM - 7:30 AM']);
const validText = (value,maxLength) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
function validateCheckout(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  if (p.p_whatsapp_consent !== undefined &&
      typeof p.p_whatsapp_consent !== 'boolean') return false;
  if (Object.keys(p).some(k => !allowedFields.has(k))) return false;
  if (!validText(p.p_customer_name,100) || !validText(p.p_customer_email,254) || !validText(p.p_customer_phone,20) || !validText(p.p_address,500)) return false;
  if (!deliverySlots.has(p.p_delivery_slot) || !paymentMethods.has(p.p_payment_method)) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.p_customer_email)) return false;
  if (typeof p.p_idempotency_key !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(p.p_idempotency_key)) return false;
  if (p.p_instructions != null && (typeof p.p_instructions !== 'string' || p.p_instructions.length > 1000)) return false;
  if (!Array.isArray(p.p_items) || p.p_items.length < 1 || p.p_items.length > 30) return false;
  return p.p_items.every(i => i && typeof i === 'object' && !Array.isArray(i) && Object.keys(i).length === 2 && Object.keys(i).every(k => k === 'product_id' || k === 'quantity') && typeof i.product_id === 'string' && i.product_id.trim().length > 0 && i.product_id.length <= 100 && Number.isInteger(i.quantity) && i.quantity >= 1 && i.quantity <= 100);
}
module.exports = {validateCheckout};
