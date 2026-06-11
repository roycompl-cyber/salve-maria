self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Salve Maria", body: event.data.text(), url: "/" };
  }

  const { title, body, icon, badge, url, tag } = data;

  event.waitUntil(
    self.registration.showNotification(title || "Salve Maria", {
      body,
      icon: icon || "/icons/icon-192.png",
      badge: badge || "/icons/icon-96.png",
      tag: tag || "fundacja",
      data: { url: url || "/" },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
