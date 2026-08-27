// sw.js - Service Worker for EduAI PWA
// Provides offline support and caching

const CACHE_NAME = 'EduAI-v3.0.0';
const STATIC_CACHE = 'EduAI-static-v3';
const DYNAMIC_CACHE = 'EduAI-dynamic-v3';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/subjects-voice.css',
  '/css/settings.css',
  '/css/econ-tools.css',
  '/css/subject-tools.css',
  '/css/school-os.css',
  '/css/socratic-tutor.css',
  '/css/interactive-lab.css',
  '/css/essay-coach.css',
  '/css/quiz-battle.css',
  '/css/pronunciation-coach.css',
  '/css/teacher-grading.css',
  '/css/flashcards.css',
  '/css/learning-roadmap.css',
  '/css/challenges.css',
  '/css/study-calendar.css',
  '/css/collaborative-whiteboard.css',
  '/css/science-calculator.css',
  '/css/lesson-agent.css',
  '/css/workspace.css',
  '/js/state.js',
  '/js/security.js',
  '/js/fingerprint.js',
  '/js/accounts.js',
  '/js/personalization.js',
  '/js/models.js',
  '/js/subjects.js',
  '/js/subject-tools.js',
  '/js/school-os.js',
  '/js/classroom.js',
  '/js/connectivity.js',
  '/js/ui.js',
  '/js/students.js',
  '/js/quiz.js',
  '/js/memory.js',
  '/js/ai-core.js',
  '/js/attendance.js',
  '/js/behavior.js',
  '/js/calendar.js',
  '/js/communication.js',
  '/js/analytics.js',
  '/js/assignments.js',
  '/js/reports.js',
  '/js/gamification.js',
  '/js/quiz-game.js',
  '/js/ai-feedback.js',
  '/js/initialize-features.js',
  '/js/dialog.js',
  '/js/projects.js',
  '/js/toast.js',
  '/js/api-utils.js',
  '/js/textbook.js',
  '/js/monaco-init.js',
  '/js/memory-ui.js',
  '/js/cyber-challenges.js',
  '/js/terminal.js',
  '/js/voice.js',
  '/js/i18n.js',
  '/js/hardware-profile.js',
  '/js/model-loader.js',
  '/js/settings.js',
  '/js/tts.js',
  '/js/accessibility.js',
  '/js/multimodal.js',
  '/js/textbook-rag.js',
  '/js/learning-analytics.js',
  '/js/webllm-engine.js',
  '/js/curriculum-rag.js',
  '/js/curriculum-selector.js',
  '/js/student-dashboard.js',
  '/js/econ-tools.js',
  '/js/student-workspace.js',
  '/js/teacher-analytics.js',
  '/js/class-monitor.js',
  '/js/plagiarism.js',
  '/js/parent-portal.js',
  '/js/slide-builder.js',
  '/js/practice-test.js',
  '/js/my-path.js',
  '/js/ai-context.js',
  '/js/socratic-tutor.js',
  '/js/interactive-lab.js',
  '/js/essay-coach.js',
  '/js/quiz-battle.js',
  '/js/pronunciation-coach.js',
  '/js/teacher-grading.js',
  '/js/flashcards.js',
  '/js/learning-roadmap.js',
  '/js/challenges.js',
  '/js/study-calendar.js',
  '/js/collaborative-whiteboard.js',
  '/js/science-calculator.js',
  '/js/lesson-agent.js',
  '/js/chapter-progress.js',
  '/js/lesson-planner.js',
  '/js/parent-digest.js',
  '/js/voice-dialogue.js',
  '/js/sneakernet-sync.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls (Ollama, backend) - always use network
  if (url.pathname.startsWith('/api/') || 
      url.port === '11434' || 
      url.hostname === 'localhost' && url.port === '3001') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline response for API calls
          return new Response(
            JSON.stringify({ error: 'Offline - please check your connection' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset) || url.pathname === asset)) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          return fetch(request)
            .then((response) => {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, clone);
              });
              return response;
            });
        })
    );
    return;
  }

  // Other requests - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cached) => {
            if (cached) {
              return cached;
            }
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // This would sync any offline messages when connection is restored
  console.log('[SW] Syncing offline messages...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: data.url
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

console.log('[SW] Service worker loaded');
