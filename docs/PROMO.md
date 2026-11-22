# Fortune Wheel — promo kit

Everything ready to copy-paste. Links:

- App: https://dvinerlove.github.io/fortune-wheel/
- Landing EN: https://dvinerlove.github.io/fortune-wheel/landing.html
- Landing RU: https://dvinerlove.github.io/fortune-wheel/landing-ru.html
- GitHub: https://github.com/dvinerlove/fortune-wheel
- Screenshots: `docs/screenshot.png`, `docs/screenshot-mobile.png`, `public/og-image.png`

Positioning (from [competitor research](competitors-2026-11.md)): don't say "spin the wheel" (saturated, wrong audience — teachers and raffles). Say **"Steam roulette" / "steam game picker"** — that's the niche. RU competitors exist (SGG, imho.run, NXTO, gamechosis, steam-pixel, Playpill) but **none have shareable custom-list wheels, live prices on sectors, or elimination mode** — that's the exact claim to use.

Full channel map: [channels-2026-11.md](channels-2026-11.md).

---

## Reddit — English

### r/Steam (main launch post)

**Title:** I made a Steam roulette — spin a wheel of your games, with live prices

**Body:**

> My backlog finally won. I built a free little tool that picks what to play: paste your game list, spin the wheel, done.
>
> What it does:
> - Random pick from your list (fair RNG, every game has equal odds)
> - Auto-matches games to Steam: live prices and discounts right on the wheel
> - Share your wheel with friends via one short link
> - Presets ("backlog", "co-op night"), hide games you're not in the mood for, elimination mode
> - No sign-up, everything stays in your browser
>
> Link: https://dvinerlove.github.io/fortune-wheel/
> Source (MIT): https://github.com/dvinerlove/fortune-wheel
>
> Would love feedback — what would make you actually use this? (I tried Steam library auto-import and dropped it: public-profile requirement locked out too many people. If that's the dealbreaker for you, say so — it'll tell me the demand is real.)

Attach `docs/screenshot.png`.

### r/SideProject

**Title:** Fortune Wheel — a Steam roulette to decide what game to play (free, no sign-up)

Same body as above, shorter — cut the preset line.

### r/internetisbeautiful

**Title:** Spin a wheel to decide which Steam game to play — live prices on every sector

Body: two sentences + link.

### r/patientgamers (backlog angle)

**Title:** Can't decide what to play from your backlog? I made a wheel for it

Emphasize: unplayed backlog → wheel decides → elimination mode burns through the list.

**Note on rules:** r/Steam requires decent account age/karma for self-promo. If auto-removed, post in r/SideProject + r/internetisbeautiful first, ask a friend to post to r/Steam, or wait for a self-promo Saturday thread.

---

## Show HN

**Title:** Show HN: Fortune Wheel – a Steam roulette that picks your next game, with live prices

**First comment:**

> Hey, I built this after "what should I play tonight" took longer than actually playing. It's a wheel spinner for your game list — auto-pulls Steam prices/covers, everything shareable via a short link, no sign-up. Front is React 19 + Vite on GitHub Pages, backend is a single Supabase Edge Function (share links + Steam price cache + rate limiting). MIT licensed. Happy to answer questions.

Post Tue–Thu, ~14:00 UTC.

---

## Product Hunt (optional — research says PH flops for this category, but it's free)

- **Tagline:** Steam roulette — let the wheel pick your next game
- **Description:** Paste your games, spin the wheel, get a random pick with live Steam prices and discounts. Share your wheel via one link. Free, no sign-up, open source.
- **Topics:** Games, Steam, Free
- Hunter needed or self-submit; launch Tue–Thu 00:01 PT. Skip unless you have ~20 friends to upvote in the first hours.

---

## Russian-language posts

### Habr (article — main RU channel)

**Full draft ready**: `docs/habr-article.md` — copy-paste into Habr editor, tags included.

**Title:** Steam-рулетка: как я сделал колесо, которое выбирает, во что играть

**Structure (draft below):**

> У каждого геймера есть бэклог: 100+ купленных на распродажах игр и вечный вопрос «во что поиграть». Я задолбался листать библиотеку и сделал инструмент, который решает за меня — колесо фортуны по списку игр.
>
> Что умеет:
> - Крутит колесо по вашему списку, честный рандом (crypto.getRandomValues)
> - Автоматически ищет игру в Steam: живые цены и скидки прямо на секторах
> - Шаринг колеса одной короткой ссылкой — отправь друзьям
> - Пресеты списков («бэклог», «на компанию»), скрытие игр, режим выбывания
> - Русский и английский интерфейс, без регистрации, данные в браузере
>
> Технически: React 19 + Vite + Tailwind на GitHub Pages, бэкенд — одна Supabase Edge Function (шаринг ссылок, кэш цен Steam, rate-limiting от спама, анонимная статистика посещений).
>
> Самое интересное в статье — как работает шаринг состояния без бэкенда-аккаунтов и как я ограничил спам публичным эндпоинтом.
>
> Ссылка: https://dvinerlove.github.io/fortune-wheel/
> Код (MIT): https://github.com/dvinerlove/fortune-wheel

Habr angle = technical writeup (share-link architecture, rate limiting, edge functions) — that sells better than a pure promo post.

### Pikabu — пост

**Заголовок:** Устал выбирать, во что играть — сделал колесо фортуны по своему бэклогу

Короткий пост-история + скриншот + ссылка. Пикабу любит личные истории, а не пресс-релизы.

### Telegram-каналы

- @progulka, @gamedevrelated, игровые подборки — напишите админам, формат: 3 строки + скрин + ссылка
- RU Discord-серверы про Steam/инди — каналы #self-promo

---

## Directories (submit once, passive traffic)

| Directory | URL | Effort | Note |
|---|---|---|---|
| AlternativeTo | alternativeto.net | low | List as alternative to wheelofnames.com + thewheelhaus.com — biggest lever |
| SaaSHub | saashub.com | low | Direct submission form |
| Slant | slant.co | low | "What's the best wheel spinner" question exists |
| Toolify / There's An AI For That | toolify.ai | skip | Wrong category (not AI) |
| itch.io | itch.io | medium | Web tools get listed; can host the app page there too |
| Steam Community threads | steamcommunity.com | low | Find "roulette button" suggestion threads, drop link organically |

---

## GitHub stars (organic)

- Topics already set: `steam-roulette`, `steam-game-picker`, `wheel-spinner`, `random-game-picker`, `backlog`, `decision-wheel`, `github-pages`, `supabase` + tech tags
- Submit to awesome-lists via PR: `awesome-selfhosted` (no — it's not self-hosted), `awesome-gametools`-type lists, `awesome-react` misc section
- Add to README: star badge is already there via shields — keep
- Ask friends to star in launch wave — stars cluster in first 48h boost discoverability

---

## What I could NOT do for you

- Post to Reddit/Twitter/Telegram — needs your accounts (and fresh accounts get posts auto-removed)
- Product Hunt submission — needs your PH account
- Get actual stars — that's humans. Everything above is staged for a launch wave.

---

## Stats

Check usage after promo wave:
`GET https://tyxlbygyynhdxcexgaxf.supabase.co/functions/v1/fortune-wheel/api/stats`
→ uniqueVisitors, totals (visit/spin/share), 14-day daily breakdown, top referrers.
