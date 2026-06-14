self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("salve-static-v1").then((cache) =>
      cache.addAll(["/manifest.json", "/logo.png", "/icons/icon-192.png", "/icons/icon-512.png"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const allowed = new Set(["salve-static-v1", "salve-public-v1"]);
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => !allowed.has(key)).map((key) => caches.delete(key)))
      ),
      self.clients.claim(),
    ])
  );
});

const STATIC_ASSET = /\.(?:png|jpg|jpeg|webp|svg|wav|woff2?)$/i;
const PUBLIC_CONTENT = /^\/(?:api\/(?:articles|petitions|gospel)(?:\/|$)|katechizm\.json$)/;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (STATIC_ASSET.test(url.pathname)) {
    event.respondWith(
      caches.open("salve-static-v1").then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  if (PUBLIC_CONTENT.test(url.pathname)) {
    event.respondWith(
      caches.open("salve-public-v1").then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(request, response.clone());
          return response;
        } catch {
          return (await cache.match(request)) || Response.error();
        }
      })
    );
  }
});

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
      data: { url: url || "/", presetId: data.presetId },
      vibrate: [200, 100, 200, 100, 400],
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
  const presetId = event.notification.data?.presetId;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Jeśli app jest już otwarta — wyślij postMessage zamiast nawigować
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          if (presetId) {
            client.postMessage({ type: "PRAYER_ALARM", presetId });
          } else {
            client.navigate(url);
          }
          return;
        }
      }
      // App zamknięta — otwórz z URL param
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
