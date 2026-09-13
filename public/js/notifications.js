(() => {
  const userId = window.MEDICORE_NOTIFICATION_USER;
  if (!userId || typeof io === "undefined") return;
  const base = location.pathname.startsWith("/doctor") ? "/doctor" : "/patient";
  const setBadge = count => document.querySelectorAll("[data-notification-badge]").forEach(badge => { badge.textContent = count; badge.hidden = !count; });
  const refresh = () => fetch(`${base}/notifications/unread-count`, { credentials: "same-origin" }).then(r => r.ok && r.json()).then(data => data && setBadge(data.count)).catch(() => {});
  const toast = n => { const el = document.createElement("a"); el.href = n.link || `${base}/notifications`; el.textContent = `🔔 ${n.title}: ${n.message}`; el.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:9999;max-width:360px;padding:14px;background:#0f766e;color:#fff;border-radius:8px;box-shadow:0 6px 18px #0003;text-decoration:none"; document.body.appendChild(el); setTimeout(() => el.remove(), 6000); };
  const socket = io({ withCredentials: true });
  socket.on("notification:new", n => { toast(n); refresh(); });
  document.addEventListener("click", event => { const item = event.target.closest("[data-notification-link]"); if (item) fetch(`${base}/notifications/${item.dataset.notificationId}/read`, { method: "POST", credentials: "same-origin" }).finally(refresh); });
  refresh();
})();
