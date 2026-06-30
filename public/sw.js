// RaxisLab OS — Service Worker
// Handles push notifications from Score Engine and Earnings alerts

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Message from page → show notification directly (foreground path)
self.addEventListener("message", e => {
  if (e.data?.type === "SHOW_NOTIF") {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: "/logo.png",
      badge: "/logo.png",
      vibrate: [200, 100, 200],
    });
  }
});

// Web Push events (background — requires VAPID setup)
self.addEventListener("push", e => {
  const data = e.data?.json() ?? { title: "RaxisLab Alert", body: "" };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      badge: "/logo.png",
      vibrate: [200, 100, 200],
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/score-engine";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(clients => {
      const existing = clients.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
