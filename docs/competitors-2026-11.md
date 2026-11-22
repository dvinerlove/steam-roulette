# Fortune Wheel — Competitor Research
**Date:** 2026-11 · **Scope:** all live competitors for a free no-signup "Steam game picker wheel" web app
**Fortune Wheel baseline:** paste/type game list → spin wheel → Steam auto-match with **live prices/discounts on sectors**, covers on sectors, short share links, presets, hide games, **elimination mode**, history with prices, EN/RU auto-detect, no signup, all data in browser, open source (MIT). Does **not** import a Steam library via API — user pastes names.

---

## 1. Market map — TL;DR

The "steam roulette" niche is **crowded but fragmented**. ~15 real Steam-specific pickers exist. They split into:

- **Library pickers** (paste Steam ID / Steam login → roll one game). Most common. No wheel show, no shareable wheel.
- **Catalog roulettes** (random game from *all of Steam*, streamer-oriented). 2–3 real ones.
- **Group pickers** (merge friends' libraries). 2–3 real ones.
- **Generic wheel spinners** with a "Steam games" SEO template page (static list, no live Steam data).
- **Bots** (Discord/Telegram) — minor.

**Nobody combines: your own list + wheel show + live prices on sectors + share link + elimination mode + EN/RU.** Fortune Wheel's actual moat is the *price-aware shareable wheel*, not the picking itself.

---

## 2. Direct competitors (Steam-specific)

### Tier A — strongest

| Name | URL | What it does | Lacks vs Fortune Wheel | Popularity signals |
|---|---|---|---|---|
| **Steam Game Gauntlet (SGG)** | gamegauntlets.com (+ /ru/) | Wheel over a **200k-game Steam catalog**; deep filters: HLTB, Metacritic, SteamSpy, GameFAQs, price, playtime, publisher, year; "SGG challenge" gauntlet mode. Open nightly catalog dump on GitHub (leinstay/steamdb, 114★). | No user-defined lists/presets; no share links; no elimination-vs-list; prices used as filter, not displayed live per sector (unverified); picks from whole catalog, not your pasted list; clunky 2016-era UI | **The RU-streamer incumbent.** Popularized by Maddyson's 2016 стримхата (31k concurrent viewers); meta tags target "maddyson, sgg, рандомайзер игр"; discussed on GoHa.ru, dota2.ru, DTF, arhivach; still actively updated (catalog dump dated 2026-11-18); has full RU UI |
| **The Wheelhaus** | thewheelhaus.com (aliases steamroulette.xyz, steamroulette.games) | "The original" Steam roulette: wheel of random Steam games, filters by genre/tag/price/your library, IGDB-rating curation to skip shovelware. Official Discord bot. | No custom lists, no presets, no share links, no elimination, no prices on sectors, EN only; spins *catalog* games, not your list | Format popularized by **Funhaus/Inside Gaming "Steam Roulette"/"Wheelhaus" YouTube shows** (64 episodes, millions of cumulative views); still used by BroughtYouThisThing; 10-yr-old domain; squats steamroulette.* domains; bot listed on top.gg |
| **pickaga.me** | pickaga.me | Most feature-rich library tool: random roll from your Steam library/wishlist with filters (genre, playtime, Metacritic, reviews, price, HLTB, Steam Deck, GeForce NOW, current players); friends' library compare + **combine multiple libraries**; "Copy link" for combined views; stats/charts. No signup. | No wheel visual (it's a roll/randomizer, not a show); no elimination mode; no wheel-share links (copies comparison links only); requires **public Steam profile**; EN only | Listed in major curated Steam Community guides (e.g. guide 3708079101, updated Oct 2026); actively developed |
| **WeBothPlay** | webothplay.com | Group tool: paste 2–16 Steam profiles → common games, "one copy away", shared backlog → filter → roulette or group vote; share links with preview cards; Discord bot (`/compare`, `/roulette`). Freemium (8 free, 16 premium). | Group-only focus, no solo list wheel; roulette is secondary; no prices; signup-adjacent for full features; EN only | Polished, has Discord bot; premium tier |
| **steamroulette.app** | steamroulette.app | SEO-optimized library picker: Steam ID in → roulette + filters; combine friends' libraries; programmatic SEO "curated routes" (action/indie/co-op/F2P pages). | Thin actual features vs SEO surface; no custom lists, share, elimination, prices; needs public profile | Owns the exact-match "steamroulette" keyword domain |

### Tier B — real but narrower

| Name | URL | What | Lacks vs FW |
|---|---|---|---|
| SteamSlots | steamslots.com | Slot-machine (not wheel) aesthetic; Steam profile sync; CSV import; **presets — paywalled ("premium")** | No wheel; presets premium; no share/elimination/prices-on-ui |
| GameRoulette | gameroulette.io | **Requires Steam OpenID login**; library sync; playtime/genre filters | Forced login kills friction-free claim; no share/elimination |
| Gaming Roulette | gamingroulette.com | Steam OpenID + 3D-styled wheel; played/unplayed, genre, MP/SP, achievements filters; demo mode | Login wall; no share links/prices |
| imho.run/what-to-play | imho.run (+/ru/) | Wheel over your backlog (<1h played), curated co-op lists, **group "Together" rooms** spin over shared games; EN + RU | Sign-in or public profile needed; max 10 names per wheel; no prices/share-config |
| NXTO | nxto.app (/ru/ exists) | Picker from owned+unplayed + taste-based "games like X" recommendations; mood filters; **12 languages incl. RU**; no account | No wheel; no share/elimination |
| Tsumi | tsumi.gg | Backlog analyzer ("pile of shame" stats) + mood roll; Steam OpenID | Account-adjacent; analyzer not wheel |
| Backlog Shuffle | backlogshuffle.com | AI-vibe picker: Steam OpenID, mood+time filters, pin/shuffle/launch | Login; recommender not roulette |
| 10015.io Steam Random Game Picker | 10015.io/tools/steam-random-game-picker | Simple filtered picker (playtime, tags, min review score); "Play in Steam" launch button | No wheel, share, prices |
| randomgamepicker.com | randomgamepicker.com | Rolls random game from curated 15k Steam catalog by genre/base price; **shows live price + discount in the result card** | No wheel, no custom lists, catalog-only |
| randomsteam.kgivler.com | randomsteam.kgivler.com | Minimal picker; unplayed-only mode; CSV export; Finger/IRC bots (!) | Bare bones; public profile needed |
| randomdraw.xyz | randomdraw.xyz/random-steam-game | Basic store/library picker | Everything except "random from library" |
| GameShelf Play Next | gameshelf.net/tools/play-next | Backlog roulette filtered by vibe/HLTB/rating; Squad Pick group vote | **Requires Google sign-in**; tracker-first |
| steamrandomizer.com | steamrandomizer.com | Random **achievement** picker ("Steam Purgatory Challenge") | Different niche |
| steam-tools.net roulette | steam-tools.net/multiplayerroulett/ | Old tool: rolls a random game common to several Steam IDs | Abandonware-era UX; group-only |
| steamdb.info/calculator | steamdb.info/calculator | Library value calculator that has a random-game option (mentioned in Steam forums) | Side feature of an analytics site |

### RU-language competitors — PROMO.md claim "No Russian-language competitor exists" is **WRONG**

| Name | Notes |
|---|---|
| **SGG / gamegauntlets.com/ru/** | Full RU UI; the biggest RU incumbent via Maddyson/streamhata community |
| **imho.run/ru/what-to-play** | RU wheel over backlog |
| **nxto.app/ru/** | RU picker, 12 languages |
| **gamechosis.com/ru/tools/wheel-of-games** | RU "Колесо игр" — wheel over their Steam catalog; discounts-site audience |
| **steam-pixel.com/random** | RU randomizer, claims 130k+ games, ad-heavy |
| **Playpill** (DTF, Oct 2026) | RU Steam-login roulette with gamification (3 rolls then 5h cooldown, collectible cards, points per minute played); viral DTF post |

*Refined truth:* RU competitors exist, but **none** offer: user-defined list wheel + live prices + share links + elimination + no-signup. The "first RU tool that X" angle survives only with that phrasing.

### Generic wheel spinners (adjacent, not real competitors but SEO rivals)

| Name | Notes |
|---|---|
| wheelofnames.com | Category giant (teachers/raffles); share links, images, sounds, remove-after-pick; **zero Steam features** |
| pickerwheel.com | Elimination + accumulation modes, share; freemium; no Steam |
| wheeldecide.com | 2012 legacy, still up; Facebook login for saves; stagnant |
| spinthewheel.io | Multi-wheel, weighted, "provably fair"; classroom audience |
| spinthewheelrandompicker.com, spinchakra.com, spinwheelpicker.io, wheelr.xyz, spinwiththewheel.com | SEO-template "Steam game picker wheel" pages: **static hardcoded game lists** (or paste-your-own); spinwheelpicker.io has elimination toggle; spinwiththewheel has "remove after playing" + history — closest generic analogue; none have Steam data, prices, or auto-matching |

### Bots & official

- **The Wheelhaus Discord bot** (official) — `/shuffle`, `/free`, `/user`, `/genre`, `/tag`
- **Steam Watch** bot — `/suggest random`, `/suggest owned`
- **ToneDial** (GitHub bot) — roulette w/ Steam OAuth, secret voting, weighted picks
- **WeBothPlay bot** — `/compare`, `/roulette`
- **Steam built-in:** "Play Next" shelf (algorithmic ML recs, NOT random, not shareable, not a wheel); `store.steampowered.com/explore/random` (official store-wide random redirect); historical "Spin Cycle" spring-cleaning event
- RandomSteamBot (Telegram) — paid "case" scam-adjacent, ignore

---

## 3. Where competitors get traffic/links

1. **Steam Community guides** — the biggest curated referral channel: "A Collection of Steam Tools" (guide 451698754) and "The Ultimate Collection of Steam Tools & Resources" (guide 3708079101, active/updated Oct 2026) both list pickaga.me, TheWheelhaus, SGG, steamcompletionist, playagame.josephtran.io, servc.eu, steamadvisor. **Action: get Fortune Wheel added to these guides.**
2. **Steam Community Suggestions forum** — recurring "add a random game button" threads (Apr 2022, May 2024, Aug 2026); commenters link thewheelhaus & steamdb calculator. Organic link-dropping ground.
3. **Reddit r/Steam** — Nov 29, 2025 post by u/YipuTheDerp asking Valve for a random-game button: **8,600+ upvotes in 15h**, top of r/Steam → covered by GameRant, gram.pl (PL), indian-tv.cz (CZ), gamersky.com (CN). Massive validated demand; thread full of people who'd use exactly this.
4. **Streamer/youtube fame** — Wheelhaus owes everything to Funhaus (Rooster Teeth); SGG owes everything to Maddyson стримхата. Format proven as *content*, not just utility.
5. **RU content sites** — DTF featured wheel-roulette articles twice (2021 → gamegauntlets/wheelhaus; Oct 2026 → Playpill author's own launch post). GoHa.ru, dota2.ru forum threads for SGG.
6. **AlternativeTo / similars.net** — thewheelhaus listed among wheelofnames alternatives; category pages are a cheap passive channel.
7. **Programmatic SEO** — steamroulette.app ("curated routes"), the SEO-template wheel sites (spinthewheelrandompicker etc.) rank for "steam game picker wheel" with static content. Proof the keyword has volume.

---

## 4. Positioning check

**Validated: "Steam roulette" / "steam game picker" is the right niche keyword.** Evidence:
- All serious competitors target exactly these terms: thewheelhaus (owns steamroulette.xyz/.games aliases), steamroulette.app (exact-match domain), steamslots ("steam roulette and random steam game picker" in title), pickaga.me ("steam roulette, steam game wheel" in meta).
- Generic "spin the wheel" SERPs are dominated by wheelofnames/pickerwheel — teacher/raffle/classroom intent, wrong audience, unbeatable incumbents. Avoid.
- RU search demand exists: "рулетка стим", "рандомайзер игр", "колесо игр", "во что поиграть стим" — SGG ranks via streamer fame, steam-pixel/gamechosis via SEO.
- One nuance: "Fortune Wheel" as a name collides with an unrelated upcoming Steam game (appid 4152810) and generic wheel-of-fortune terms — brand-name SEO will be hard; rely on descriptive keywords in title/H1.

---

## 5. Feature matrix (✓ = has, — = lacks, ? = unverified)

| Feature | FW | Wheelhaus | SGG | pickaga.me | steamroulette.app | WeBothPlay | imho.run | Generic wheels |
|---|---|---|---|---|---|---|---|---|
| Wheel visual | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| Your own list (paste) | ✓ | — | — | — | — | — | — | ✓ |
| Steam library import | — | ✓ | ✓(catalog) | ✓ | ✓ | ✓ | ✓ | — |
| Live prices shown | **✓ on sectors** | filter only | filter only | filter only | — | — | — | — |
| Discounts shown | ✓ | — | ? | — | — | — | — | — |
| Covers on sectors | ✓ | ✓ | ✓ | — | ? | — | ? | some |
| Share wheel via link | **✓ short link** | — | — | compare-link only | — | verdict-link only | — | ✓ |
| Elimination mode | ✓ | — | gauntlet | — | — | vote | — | some |
| Presets | ✓ free | — | — | filters | routes | — | lists | some |
| No signup/public profile | ✓ | ✓ | ✓ | public profile | public profile | public profile | public profile/Steam | ✓ |
| RU UI | ✓ | — | ✓ | — | — | — | ✓ | wheelr only |
| Group/friends | — | — | — | ✓ combine | ✓ | ✓✓ core | ✓ rooms | — |
| HLTB/rating filters | — | IGDB | ✓✓ | ✓ | ? | — | session len | — |
| Open source | ✓ MIT | — | data only | — | — | — | — | — |

**Honest weaknesses vs the field:** no Steam-library auto-import (roadmap per PROMO.md), no group/merge features, no HLTB/review/playtime filters, price feed depends on own Supabase function (single point of failure).

---

## 6. Gaps we can exploit

1. **"Prices on the wheel" — nobody else does this.** Every competitor either has no price data, uses it only as a filter, or shows it after the pick. Copy: *"The only Steam wheel where every sector shows the live price and today's discount."*
2. **"Which discounted game should I buy" use case** — all library pickers only pick games you *own*. Fortune Wheel + wishlist/backlog-of-want lists + discounts = a sale-season tool ("spin your wishlist during the Steam sale"). Zero competition for this framing.
3. **Shareable wheel ≠ shareable result.** WeBothPlay shares a verdict; pickaga.me shares a compare view; generic wheels share a dumb list. Copy: *"Send your friend a link — they get the same wheel, same games, same prices."* Group/game-night angle without needing everyone's public Steam profile.
4. **No Steam profile, no privacy wall.** ~80% of Steam pickers demand a public profile or Steam OpenID login — a real friction + fear point. Copy: *"No Steam login, no public profile needed — it never sees your account."* Also works for non-Steam games (Epic/GOG/console titles) — no Steam-specific picker can do that.
5. **Elimination backlog gauntlet in RU.** SGG's "gauntlet" proved the challenge format in the RU-streamer scene but it rolls from the whole catalog. Fortune Wheel's remove-winner mode over *your* backlog is the personal version: *"режим выбывания по твоему бэклогу"* — no RU tool has it.
6. **Streamer/show angle.** Both incumbents grew via streamers, yet neither has a pretty customizable wheel (custom backgrounds, colors, covers, sounds) worth OBS-capturing. Copy for streamers: *"a Steam wheel your viewers actually want to watch."*
7. **Steam-login fatigue / privacy.** gameroulette.io and gamingroulette.com force OpenID; GameShelf forces Google. One-line copy: *"Open the link, spin, close the tab. Zero accounts anywhere."*
8. **Free presets vs SteamSlots' paywalled presets.** Direct jab where relevant: same feature, theirs is premium.
9. **r/Steam demand timing.** The 8.6k-upvote "random game button" thread (Nov 2025) + recurring Steam forum requests = an audience explicitly asking for this. Reply/post copy: *"Valve won't add the random button, so I did."*
10. **Works with private profiles & mixed platforms.** A subtle but real gap: Steam-API tools fail silently on private profiles; Fortune Wheel doesn't care — paste 20 names from anywhere.

---

## 7. Promo-kit corrections needed in `docs/PROMO.md`

- Line ~11: *"No Russian-language competitor exists"* → **false**. Replace with: *"RU competitors exist (SGG, imho.run, NXTO, gamechosis, steam-pixel, Playpill) but none have shareable custom-list wheels, live prices, or elimination mode."*
- Add SGG/gamegauntlets to the "biggest threat" awareness — it's the entrenched RU incumbent, not wheelhaus.
- Directories section: also target Steam Community guide owners (guide 3708079101) — higher-quality channel than AlternativeTo for this niche.
