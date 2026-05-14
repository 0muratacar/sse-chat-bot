# Commit History & Rationale

Bu dosya, projenin commit geçmişini adım adım açıklar. Her commit için ne yapıldığı, neden yapıldığı ve sonucunda ne beklendiği belirtilmiştir.

---

## Commit 1: `feat: initialize project with TypeScript + Express`

**Ne yapıldı:**
- Node.js projesi `npm init` ile başlatıldı
- TypeScript konfigürasyonu (`tsconfig.json`) oluşturuldu
- Express server minimal olarak kuruldu (`src/app.ts`, `src/server.ts`)
- Development tooling eklendi (nodemon, ts-node)
- `.gitignore` dosyası oluşturuldu

**Neden:**
Her projenin temeli çalışan bir iskelet olmalıdır. Üstüne bir şey inşa etmeden önce `npm run dev` yazıp sunucunun ayağa kalktığını doğrulamak gerekir. Ayrıca GitHub'a ilk commit olarak projenin çalışır iskeletini koymuş oluyoruz.

**Sonuç:**
`npm run dev` → Server localhost:3000'de ayakta, `GET /health` → `{ "status": "ok" }` dönüyor.

---

## Commit 2: `feat: add Docker Compose, Prisma schema, and seed data`

**Ne yapıldı:**
- Docker Compose ile PostgreSQL 16, Redis 7 ve App container'ları tanımlandı
- Prisma schema oluşturuldu: User, Chat, Message, FeatureFlag modelleri
- Seed script yazıldı (demo user, 3 chat, default feature flag'ler)
- Dockerfile (multi-stage build) oluşturuldu
- `.env.example` dosyası eklendi

**Neden:**
Uygulamanın kalbi veritabanıdır. `docker-compose up` ile tüm altyapının tek komutla ayağa kalkması, değerlendiricinin hiçbir şey kurmak zorunda kalmamasını sağlar. Prisma schema, veri yapısını net şekilde tanımlar ve migration geçmişi oluşturur.

**Sonuç:**
`docker-compose up` → PostgreSQL + Redis + App çalışır. DB'de User, Chat, Message, FeatureFlag tabloları var. Seed ile demo data yüklü.

---

## Commit 3: `feat: add configuration management and structured logging`

**Ne yapıldı:**
- `Config` class'ı (Singleton pattern) — tüm env var'ları merkezi bir yerden okur
- `constants.ts` — feature flag default'ları, pagination limitleri gibi sabit değerler
- `Logger` class'ı (Singleton pattern) — Winston ile structured JSON logging
- `server.ts` config ve logger kullanacak şekilde güncellendi

**Neden:**
Her servis kendi `process.env.X`'ini okumak yerine merkezi Config'den almalıdır — tekrar önlenir, typo riski azalır, test'te mock'lanabilir. Logger ise her yerde aynı formatta yazmalıdır — production'da JSON, development'ta renkli console. Bu ikisi tüm diğer layer'ların bağımlılığıdır, bu yüzden erken eklenir.

**Sonuç:**
`Config.get('databaseUrl')` ve `logger.info('message', { meta })` her yerden çağrılabilir. Log çıktısı structured ve filtrelenebilir durumda.

---

## Commit 4: `feat: add Prisma singleton and repository layer`

**Ne yapıldı:**
- `PrismaService` (Singleton) — connection lifecycle management, error event handling
- `UserRepository` — findById, findByEmail
- `ChatRepository` — findByUserId (cursor-based pagination), findByIdAndUserId
- `MessageRepository` — findByChatId, findByChatIdLimited, create
- `FeatureFlagRepository` — findByKey, findAll, create, update

**Neden:**
Repository pattern sayesinde servisler doğrudan Prisma'ya bağımlı olmaz. Test'te kolayca mock'lanabilir. İleride ORM değişse sadece repository katmanı değişir, servis katmanı etkilenmez. Ayrıca Prisma client'ın singleton olması connection pool'un verimli kullanılmasını sağlar.

**Sonuç:**
`chatRepository.findByUserId(userId, { limit, cursor })` gibi temiz API'ler ile veritabanına erişim mümkün. Her repository tek bir model'in CRUD operasyonlarını sağlar.

---

## Commit 5: `feat: add service layer and DI container`

**Ne yapıldı:**
- `RedisService` (Singleton) — get/set/del operasyonları, connection management
- `FeatureFlagService` — Redis cache + DB fallback, write-through cache stratejisi
- `ChatService` — chat listesi (paginated), chat history (full/limited)
- `CompletionService` — AI completion (streaming vs JSON, mock tool execution)
- `Container` (Singleton) — tüm dependency'leri wire eden DI container

**Neden:**
Service pattern iş mantığını controller'lardan ayırır. Controller sadece HTTP işi yapar (parse request, call service, format response). DI container ise tüm bağımlılıkları merkezi bir yerden wire eder — kim neye bağımlı açıkça görülür, test'te kolayca override edilebilir.

**Sonuç:**
`container.chatService.getChats(userId)` gibi çağrılar yapılabilir. Servisler birbirine interface üzerinden bağlı, concrete class'lara değil.

---

## Commit 6: `feat: implement middleware chain with correct ordering`

**Ne yapıldı:**
- `appCheckMiddleware` — Firebase App Check token doğrulaması (mock)
- `authMiddleware` — JWT token verify, user bilgisini request'e ekler
- `clientTypeMiddleware` — X-Client-Type header'dan client tipini algılar
- `validateBody` / `validateParams` — Zod schema ile request validation
- `loggingMiddleware` — Request timing ve structured log
- `errorHandlerMiddleware` — Unhandled error'ları yakalar, consistent format döner

**Neden:**
Döküman middleware sıralamasını özellikle vurguluyor. Doğru chain sırası güvenlik açısından kritik: önce App Check (request gerçek bir uygulamadan mı?), sonra Auth (kim bu?), sonra validation (geçerli data mı?). Error handler en dışta her şeyi sarar ki hiçbir hata kullanıcıya stack trace olarak dönmesin.

**Sonuç:**
Her protected request bu pipeline'dan geçer. Auth header'sız → 401, App Check eksik → 403, geçersiz body → 400 (Zod detayları ile). Tüm hatalar consistent `{ error: { code, message, status } }` formatında.

---

## Commit 7: `feat: implement feature flag system with admin API and strategies`

**Ne yapıldı:**
- `AdminController` — Feature flag CRUD endpoint'leri (GET all, GET by key, PUT, POST)
- `CompletionStrategy` interface + `StreamingStrategy` + `JsonStrategy`
- `ChatHistoryStrategy` interface + `FullHistoryStrategy` + `LimitedHistoryStrategy`
- `PaginationStrategy` — dynamic limit from flag
- Zod validation schemas (createFlagSchema, updateFlagSchema, completionBodySchema)
- Route registration ile admin endpoint'leri aktif

**Neden:**
**Projenin KEY requirement'ı budur.** Feature flag'ler DB'de tutulur (persistent), Redis'te cache'lenir (hızlı okuma), admin API ile runtime'da değiştirilir. Write-through cache: her güncelleme hem DB hem Redis'e yazılır → consistency garantisi. Strategy pattern: flag değerine göre farklı strateji seçilir, if/else chain'i yerine clean OOP.

**Sonuç:**
`PUT /api/admin/features/STREAMING_ENABLED` → body: `{"value": "false"}` → DB + Redis güncellenir. Sonraki completion request'i artık JSON döner (SSE yerine). Restart yok, redeploy yok.

---

## Commit 8: `feat: add chat list and history endpoints with feature flags`

**Ne yapıldı:**
- `ChatController` (class-based) — getChats, getChatHistory metotları
- `GET /api/chats` → paginated chat list (cursor-based)
- `GET /api/chats/:chatId/history` → mesaj geçmişi
- Route-specific middleware chain: App Check → Auth → Client Type → Validation
- Feature flag entegrasyonu: PAGINATION_LIMIT, CHAT_HISTORY_ENABLED

**Neden:**
İlk iki core endpoint. Feature flag'lerin etkisini burada göreceğiz: PAGINATION_LIMIT flag'i 30'a çekilirse chat listesi max 30 döner, CHAT_HISTORY_ENABLED false yapılırsa sadece son 10 mesaj gelir. Tüm bunlar restart etmeden.

**Sonuç:**
Auth'lu user kendi chat'lerini görebilir. Pagination cursor ile çalışır (scalable). History flag'e göre full veya limited döner. Başka user'ın chat'ine erişim 404 döner.

---

## Commit 9: `feat: add completion endpoint with SSE streaming support`

**Ne yapıldı:**
- `CompletionController` — POST /api/chats/:chatId/completion
- SSE streaming: `thinking` → `content` (word by word) → `tool_execution` → `done` event'leri
- JSON response mode: tek seferde complete response
- Mock AI tool (`getCurrentWeather`) — AI_TOOLS_ENABLED flag'i ile kontrollü
- OpenAI fallback desteği (key varsa gerçek API, yoksa mock response)
- Token generation utility (`npm run generate-token`)

**Neden:**
Projenin en önemli endpoint'i. SSE streaming Strategy pattern'ın en görünür örneği: STREAMING_ENABLED=true iken `Content-Type: text/event-stream`, false iken `application/json`. Feature flag değiştiğinde restart etmeden davranış değişmesi burada kanıtlanıyor. Mock tool ise AI_TOOLS_ENABLED flag'inin conditional feature execution'ını gösteriyor.

**Sonuç:**
- Flag true → SSE stream açılır, event'ler sırayla gönderilir, client real-time görür
- Flag false → Tek JSON response döner
- Tool flag true + "weather" kelimesi → Mock tool çalışır, sonuç stream'de görünür
- Tüm mesajlar DB'ye kaydedilir (user + assistant)

---

## Commit 10: `feat: add unit tests, README, and project documentation`

**Ne yapıldı:**
- Jest konfigürasyonu (ts-jest, test tsconfig)
- 3 test suite, 16 unit test:
  - `FeatureFlagService` — Redis cache hit, DB fallback, default values, write-through, pagination clamping
  - `ChatService` — pagination limit from flag, chat not found, full/limited history
  - `Middlewares` — App Check pass/reject, client type detection, default values
- `README.md` — setup instructions, API docs, architecture overview
- `.env.example` doğrulaması

**Neden:**
Submission gereklilikleri: testing coverage + README with setup instructions. Değerlendirici ilk README'ye bakacak — 5 dakikada projeyi ayağa kaldırabilmeli. Unit test'ler ise iş mantığının doğru çalıştığını kanıtlar ve design pattern'ların mock'lanabilirliğini gösterir (DI'ın gerçek faydası).

**Sonuç:**
`npm test` → 16 test geçer. README ile proje 5 dakikada kurulabilir. Coverage report ile hangi katmanların test edildiği görülür.
