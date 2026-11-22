# 🎡 Fortune Wheel

[![Demo](https://img.shields.io/badge/demo-live-6366f1)](https://dvinerlove.github.io/fortune-wheel/)
[![Landing](https://img.shields.io/badge/landing-promo-f472b6)](https://dvinerlove.github.io/fortune-wheel/landing.html)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)

A web app that picks a random game from your list — spin the wheel and let it decide what to play. Steam prices and discounts are fetched automatically, the look is fully customizable, and the whole state fits into one short shareable link. Available in **English** and **Russian** (auto-detected from your browser).

**[▶ Open the app](https://dvinerlove.github.io/fortune-wheel/)** · **[Promo page](https://dvinerlove.github.io/fortune-wheel/landing.html)**

![Fortune Wheel — screenshot](docs/screenshot.png)

## ✨ Features

- **Random pick** — fair RNG (`crypto.getRandomValues`) with a smooth decelerating spin and a soft tick sound that fades as it slows
- **Steam integration** — auto-matches games in Steam, live prices and discounts for your region, game covers on wheel sectors
- **Link sharing** — a short link preserves your game list and all settings (Supabase Edge Function + URL-state fallback)
- **Wheel presets** — save several game lists (e.g. "Backlog", "Co-op night") and switch between them
- **Hide games** — keep a game in the list but off the wheel (not in the mood today)
- **Elimination mode** — "Remove winner" drops the winning game from the wheel until nothing's left
- **Shuffle** — reshuffle sector order in one click
- **Customization** — custom app/wheel backgrounds (image upload), border/pointer/text colors, button text, label position and length, idle spin
- **Game list** — add games with Steam auto-linking, bulk name import, inline editing, custom sector images
- **History** — every winning game with price and timestamp
- **Sound** — synthesized spin and win sounds (Web Audio API, no files)
- **i18n** — English/Russian UI, auto-detected; Steam region & currency defaults follow the locale
- **PWA-friendly** — no sign-up, all data stays in your browser; new visitors get a demo wheel to play with

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:5173/fortune-wheel/
```

Steam prices and short links need `VITE_API_URL` — see [.env.example](.env.example) (Supabase Edge Function in `supabase/functions/fortune-wheel`).

## 📜 Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | typecheck + production build to `dist/` |
| `npm run lint` | oxlint |
| `npm run preview` | preview the build |
| `npm run deploy` | build + deploy to GitHub Pages |

## 🛠 Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Framer Motion · Lucide · Supabase Edge Functions · GitHub Pages (CI in `.github/workflows/deploy.yml`)

---

<details>
<summary>🇷🇺 По-русски</summary>

Веб-приложение для случайного выбора игры из списка: крутите колесо — оно решит, во что играть. Цены и скидки подтягиваются из Steam, внешний вид полностью настраивается, а всё состояние шарится одной короткой ссылкой. Интерфейс на русском и английском (определяется по языку браузера, переключается в настройках).

</details>

## 📄 License

[MIT](LICENSE)
