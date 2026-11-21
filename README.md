# 🎡 Колесо Фортуны

[![Demo](https://img.shields.io/badge/demo-live-6366f1)](https://dvinerlove.github.io/fortune-wheel/)
[![Landing](https://img.shields.io/badge/landing-promo-f472b6)](https://dvinerlove.github.io/fortune-wheel/landing.html)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)

Веб-приложение для случайного выбора игры из списка: крутите колесо — оно решит, во что играть. Цены и скидки подтягиваются из Steam, внешний вид полностью настраивается, а всё состояние шарится одной короткой ссылкой.

**[▶ Открыть приложение](https://dvinerlove.github.io/fortune-wheel/)** · **[Промо-страница](https://dvinerlove.github.io/fortune-wheel/landing.html)**

![Колесо Фортуны — скриншот](docs/screenshot.png)

## ✨ Возможности

- **Случайный выбор** — честный RNG (`crypto.getRandomValues`), плавная прокрутка с затуханием
- **Steam-интеграция** — автопоиск игры в Steam, живые цены и скидки в выбранном регионе, обложки на секторах колеса
- **Шаринг по ссылке** — короткая ссылка сохраняет список игр и все настройки (Supabase Edge Function + fallback на URL-state и localStorage)
- **Кастомизация** — свой фон и фон колеса (загрузка изображений), цвета рамки/указателя/текста, текст кнопки, позиция и длина названий, idle-вращение
- **Список игр** — добавление с автопривязкой к Steam, импорт списком, редактирование, подсказки маппинга
- **История** — все выпавшие игры с ценой и временем
- **Звук** — синтезированные звуки прокрутки и выигрыша (Web Audio API, без файлов)
- **PWA-friendly** — работает без регистрации, данные хранятся локально

## 🚀 Запуск

```bash
npm install
npm run dev        # http://localhost:5173/fortune-wheel/
```

Для Steam-цен и коротких ссылок нужен `VITE_API_URL` — см. [.env.example](.env.example) (Supabase Edge Function в `supabase/functions/fortune-wheel`).

## 📜 Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` | typecheck + прод-сборка в `dist/` |
| `npm run lint` | oxlint |
| `npm run preview` | предпросмотр сборки |
| `npm run deploy` | сборка + деплой на GitHub Pages |

## 🛠 Стек

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Framer Motion · Lucide · Supabase Edge Functions · GitHub Pages (CI в `.github/workflows/deploy.yml`)

## 📄 Лицензия

[MIT](LICENSE)
