# LinguaKid BG ↔ EN — Веб-приложение для изучения слов

Современное Mobile-First приложение для изучения пары **Болгарский ↔ Английский**:
- **Родитель (компьютер/планшет):** создаёт темы, добавляет слова по одному или списком (`куче — dog`), редактирует их и отслеживает прогресс ребёнка.
- **Ребёнок (смартфон):** входит по простому **семейному коду** и проходит 7-этапный игровой урок с озвучкой (Web Speech API), анимациями и звёздами.
- **Синхронизация в реальном времени (Supabase Realtime):** слово, добавленное с компьютера, мгновенно появляется на телефоне ребёнка.
- **Язык интерфейса:** переключатель `RU / BG` в шапке и настройках.

---

## Быстрый запуск локально

```bash
npm install
npm run dev
```
Приложение откроется на `http://localhost:5173`. Без ключей Supabase оно сразу работает в локальном демо-режиме (данные сохраняются в `localStorage`).

---

## Шаг 1. Подключение бесплатной базы данных Supabase

1. Перейдите на [supabase.com](https://supabase.com) и создайте бесплатный аккаунт.
2. Нажмите **New Project**, выберите имя (например, `linguakid-bg-en`), придумайте пароль БД и выберите ближайший регион (например, `Frankfurt`). Дождитесь создания (~1 минута).
3. В левом меню откройте **SQL Editor** → **New query**.
4. Скопируйте всё содержимое файла `supabase/schema.sql` из этого проекта, вставьте в редактор и нажмите **Run**.
5. Перейдите в **Project Settings → API** и скопируйте два значения:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public** key (`eyJhbGciOi...`)
6. Создайте файл `.env` в корне проекта (на основе `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=ваш_anon_public_key
   ```
   *(Также эти ключи можно ввести прямо в окне «Настройки» внутри самого приложения.)*

---

## Шаг 2. Бесплатный деплой на Vercel (рекомендуется)

1. Загрузите папку проекта в новый репозиторий на [GitHub](https://github.com).
2. Зайдите на [vercel.com](https://vercel.com) (вход через GitHub) и нажмите **Add New → Project**.
3. Выберите ваш репозиторий. Vercel автоматически определит фреймворк **Vite**.
4. Раскройте блок **Environment Variables** и добавьте:
   - `VITE_SUPABASE_URL` = ваш Project URL
   - `VITE_SUPABASE_ANON_KEY` = ваш anon public key
5. Нажмите **Deploy**. Через 1 минуту вы получите постоянную ссылку вида `https://linguakid-bg-en.vercel.app`.
6. Откройте ссылку на компьютере (режим **Родитель**) и на телефоне ребёнка (режим **Ребёнок**), введите одинаковый **Семейный код** (например, `IVANOV-2026`) — готово!

### Альтернатива: деплой на Netlify
1. Зайдите на [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** (GitHub).
2. Build command: `npm run build`, Publish directory: `dist`.
3. В **Site configuration → Environment variables** добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
4. Нажмите **Deploy site**.
