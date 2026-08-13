// Scanifest shared utilities - loaded by every page.
// Keeps Supabase config and common helper functions in one place.

const SUPABASE_URL = 'https://svwhikfrzfnjfysutnze.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nK1u_alsgjQj85ZvYdzOnQ_bVxWV7Ku';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

// Redirects to loginPath if there's no active session. Pass the
// correct relative path for the calling page's location
// (e.g. '../index.html' from inside /pages/).
async function requireAuth(loginPath) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = loginPath;
    return null;
  }
  return session.user;
}

function boxVolumeLiters(box) {
  if (!box.height || !box.width || !box.length) return 0;
  let h = box.height, w = box.width, l = box.length;
  if (box.is_imperial) { h *= 2.54; w *= 2.54; l *= 2.54; }
  return (h * w * l) / 1000;
}

function boxWeightKg(box) {
  if (!box.weight) return 0;
  return box.is_imperial ? box.weight * 0.453592 : box.weight;
}

// Recomputes and saves the cached aggregate fields on a shipment
// (number_of_boxes, number_of_items, total_volume, total_weight).
// Call after any action that changes box count, item count, or box dims.
async function recomputeShipmentTotals(shipmentId) {
  if (!shipmentId) return;
  const { data: boxes } = await supabaseClient
    .from('boxes')
    .select('id, height, width, length, weight, is_imperial')
    .eq('shipment_id', shipmentId);

  const boxList = boxes || [];
  const boxIds = boxList.map(b => b.id);

  let itemCount = 0;
  if (boxIds.length > 0) {
    const { data: itemQuantities } = await supabaseClient
      .from('items')
      .select('quantity')
      .in('box_id', boxIds);
    itemCount = (itemQuantities || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  const totalVolume = boxList.reduce((sum, b) => sum + boxVolumeLiters(b), 0);
  const totalWeight = boxList.reduce((sum, b) => sum + boxWeightKg(b), 0);

  await supabaseClient
    .from('shipments')
    .update({
      number_of_boxes: boxList.length,
      number_of_items: itemCount,
      total_volume: totalVolume,
      total_weight: totalWeight
    })
    .eq('id', shipmentId);
}

// Simple inline icons - no image assets needed, scale cleanly for print.
function fragileIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2 L22 20 L2 20 Z" stroke-linejoin="round"/>
    <line x1="12" y1="9" x2="12" y2="14"/>
    <circle cx="12" cy="17" r="0.6" fill="currentColor"/>
  </svg>`;
}
function heavyIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="9" width="4" height="6" rx="1"/>
    <rect x="17" y="9" width="4" height="6" rx="1"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
  </svg>`;
}
