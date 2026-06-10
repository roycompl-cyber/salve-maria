// Custom push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Fundacja", body: event.data.text(), url: "/" };
  }

  const { title, body, icon, badge, url, tag } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/icons/icon-192.png",
      badge: badge || "/icons/icon-96.png",
      tag: tag || "fundacja",
      data: { url: url || "/" },
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "Otwórz" },
        { action: "close", title: "Zamknij" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Prayer reminder via service worker
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_PRAYER_REMINDER") {
    const { time } = event.data;
    // Store reminder time for next alarm
    self.registration.showNotification("Czas na modlitwę 🙏", {
      body: "Fundacja zaprasza Cię na chwilę modlitwy.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      tag: "prayer-reminder",
      data: { url: "/prayers" },
      vibrate: [200, 100, 200],
    });
  }
});
