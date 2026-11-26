import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Game, Settings, HistoryItem } from './types';
import { getGameColor, DEFAULT_GAMES } from './constants';
import { DEFAULT_SETTINGS, mergeSettings } from './types';
import { fetchSteamPrice, searchSteamGames, getGameMapping, saveGameMapping, preloadPrices, getMappingSuggestions, transliterateRussian, normalizeStringForComparison, fetchDeals, fetchWishlist, type MappingSuggestion, type DealsGame } from './utils/steam';
import type { SteamSearchResult } from './utils/steam';
import { useAudio } from './utils/audio';
import { t, formatPrice } from './i18n';
import FortuneWheel from './components/FortuneWheel';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import SteamGameSelectionModal from './components/SteamGameSelectionModal';
import WinScreenSteamGameSelectionModal from './components/WinScreenSteamGameSelectionModal';
import EditGameForm from './components/EditGameForm';
import { Trophy, RefreshCcw, Coins, Search, Plus, X, Settings as SettingsIcon, History as HistoryIcon, ClipboardPaste, Trash2, Link2, Check, Edit2, Gamepad2, ChevronDown, ChevronRight, Shuffle, Eye, EyeOff, Save, Pencil, PencilOff } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig, useDragControls, useMotionValue, useTransform, animate } from 'framer-motion';

const uid = () => Math.random().toString(36).slice(2, 11);
const API_URL = import.meta.env.VITE_API_URL;

// Anonymous usage stats: one random visitor id per browser, no PII
const getVisitorId = () => {
  let vid = localStorage.getItem('fwVisitorId');
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem('fwVisitorId', vid);
  }
  return vid;
};

// Тот же хэш, что на сервере — сравниваем с ownerHash из ответа, чтобы узнать свою live-ссылку
const sha256Hex = async (text: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Слепок «сохранённого» колеса: только юзер-поля — авто-обогащение
// (appId/image/price) и история спинов правками не считаются.
const wheelFingerprint = (gs: { name: string; color: string; hidden?: boolean }[], s: unknown) =>
  gs.map(g => `${g.name}|${g.color}|${g.hidden ? 1 : 0}`).join('\n') + '|' + JSON.stringify(s);

const trackEvent = (event: 'visit' | 'spin' | 'share') => {
  if (!API_URL) return;
  try {
    fetch(`${API_URL}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, visitor: getVisitorId(), ref: document.referrer || null }),
      keepalive: true
    }).catch(() => {});
  } catch { /* localStorage off — skip tracking */ }
};

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [newGameName, setNewGameName] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(() => localStorage.getItem('fortuneWheelListCollapsed') === '1');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [steamProfileInput, setSteamProfileInput] = useState('');
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistResult, setWishlistResult] = useState<{ games: DealsGame[] } | null>(null);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [confirmClearGamesOpen, setConfirmClearGamesOpen] = useState(false);
  const [steamSearchResults, setSteamSearchResults] = useState<SteamSearchResult[]>([]);
  const [showSteamSearchResultsModal, setShowSteamSearchResultsModal] = useState(false);
  const [gameNameToMap, setGameNameToMap] = useState<string>('');
  const [showWinScreenMappingModal, setShowWinScreenMappingModal] = useState(false);
  const [gameToMapOnWinScreen, setGameToMapOnWinScreen] = useState<Game | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [initialized, setInitialized] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCopiedFull, setLinkCopiedFull] = useState(false);
  const [linkUpdated, setLinkUpdated] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'viewer' | 'editor'>(() =>
    ['live', 'editor'].includes(localStorage.getItem('fwShareMode') || '') ? 'editor' : 'viewer');
  const [liveShareId, setLiveShareId] = useState<string | null>(() =>
    localStorage.getItem('fwLiveShare'));
  const [liveDirty, setLiveDirty] = useState(false);
  // Откуда загружены игры: ссылка editable (live) или нет, и наша ли она
  const [shareOrigin, setShareOrigin] = useState<{ editable: boolean; canUpdate: boolean } | null>(null);
  const shareBaselineRef = useRef<string | null>(null);
  const [forkNotice, setForkNotice] = useState(false);
  const [shareIntroOpen, setShareIntroOpen] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [dbError, setDbError] = useState<string | null>(null);
  const [preloading, setPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; appId: string; color: string; image: string; }>({ name: '', appId: '', color: '#ffffff', image: '' });
  const [listHeaderCompact, setListHeaderCompact] = useState(false);

  // Шит списка: два snap-пойнта одним элементом — fullscreen (y=0)
  // и peek-карточка у низа экрана (y=peekY). Драг морфит одно в другое.
  const sheetY = useMotionValue(0);
  const sheetDrag = useDragControls();
  const isMobileSheet = () => window.matchMedia('(max-width: 1023px)').matches;
  const reducedMotionNow = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const titleRowRef = useRef<HTMLButtonElement>(null);
  const [peekY, setPeekY] = useState(0);
  const peekYRef = useRef(0);
  const pendingVelRef = useRef(0);
  const firstSheetPaintRef = useRef(true);
  const lastDragRef = useRef(0);
  const [viewportW, setViewportW] = useState(() => window.innerWidth);
  const lastListScrollRef = useRef(0);
  // Плавная интерполяция казино-кропа: 2.15x на телефоне (≤480) → 1.0 к десктопу (1024).
  // Переходных ступеней нет — трансформ непрерывно зависит от ширины.
  const cropT = Math.min(Math.max((viewportW - 480) / (1024 - 480), 0), 1);
  const cropStyle: React.CSSProperties | undefined = viewportW < 1024 ? {
    transform: `translate(${(-37 * (1 - cropT)).toFixed(2)}vw, ${(-10 * (1 - cropT)).toFixed(2)}dvh) scale(${(2.15 - cropT * 1.15).toFixed(3)})`,
  } : undefined;
  // SPIN принадлежит peek-состоянию: фейдится по прогрессу морфа, а не живёт до снапа
  const spinPeekOpacity = useTransform(sheetY, [0, Math.max(peekY, 1)], [0, 1]);
  const measurePeek = () => {
    const btn = titleRowRef.current;
    // display:none (настройки поверх) → offsetParent null, не портим peek
    if (!btn || !btn.offsetParent) return peekYRef.current;
    // +44: peek показывает кусочек следующего блока — affordance «тут ещё есть»
    const y = Math.max(0, window.innerHeight - (btn.offsetTop + btn.offsetHeight + 44));
    peekYRef.current = y;
    setPeekY(y);
    return y;
  };
  const springTo = (target: number, velocity = 0) => reducedMotionNow()
    ? animate(sheetY, target, { duration: 0.2 })
    : animate(sheetY, target, { type: 'spring', stiffness: 400, damping: 40, bounce: 0, velocity });
  const expandSheet = (velocity = 0) => {
    localStorage.setItem('fortuneWheelListCollapsed', '0');
    pendingVelRef.current = velocity;
    setListCollapsed(false);
  };
  const collapseSheet = (velocity = 0) => {
    localStorage.setItem('fortuneWheelListCollapsed', '1');
    pendingVelRef.current = velocity;
    setListCollapsed(true);
  };
  // Единая точка: состояние → snap-target. Контент едет вместе с шитом.
  useLayoutEffect(() => {
    const py = measurePeek();
    if (!isMobileSheet()) { firstSheetPaintRef.current = false; sheetY.set(0); return; }
    const target = listCollapsed ? py : 0;
    if (firstSheetPaintRef.current) {
      firstSheetPaintRef.current = false;
      if (listCollapsed || reducedMotionNow()) { sheetY.set(target); return; }
      // первый показ — въезд снизу
      sheetY.set(window.innerHeight);
    }
    springTo(target, pendingVelRef.current);
    pendingVelRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listCollapsed]);
  // Ресайн/поворот: peek пересчитываем и докатываем шит до цели
  useEffect(() => {
    const onResize = () => {
      setViewportW(window.innerWidth);
      if (!isMobileSheet()) { sheetY.set(0); return; }
      if (listCollapsed) sheetY.set(measurePeek());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listCollapsed]);
  // State for mapping suggestions
  const [mappingSuggestions, setMappingSuggestions] = useState<{ [gameId: string]: MappingSuggestion[] }>({});
  const [showMappingSuggestionsFor, setShowMappingSuggestionsFor] = useState<string | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');
  const [manualSearchLoading, setManualSearchLoading] = useState<boolean>(false);
  const localeRef = useRef(settings.locale);
  localeRef.current = settings.locale;
  const shareFailedRef = useRef(false);
  const [tempGameId, setTempGameId] = useState<string | null>(null);
  // Скрытые игры не идут на колесо, но остаются в списке
  const visibleGames = useMemo(() => games.filter(g => !g.hidden), [games]);
  const confettiBits = useMemo(() => {
    if (!selectedGame || !settings.wheel.confetti) return [];
    const palette = games.map(g => g.color);
    return Array.from({ length: 36 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2.2 + Math.random() * 1.3,
      color: palette[i % palette.length] || '#6366f1',
      rot: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
      w: 6 + Math.random() * 6,
    }));
  }, [selectedGame, settings.wheel.confetti, games]);
  
  // Helper to normalize a game object to ensure all required fields are present
  const normalizeGame = (game: any, index: number = 0): Game => ({
    id: game.id || uid(),
    name: game.name || '',
    appId: game.appId || undefined,
    price: game.price,
    discount: game.discount,
    originalPrice: game.originalPrice,
    color: game.color || getGameColor(index),
    // миграция старых тяжёлых header.jpg на миниатюру
    image: typeof game.image === 'string' ? game.image.replace(/\/apps\/(\d+)\/header\.jpg$/, '/apps/$1/capsule_sm_120.jpg') : game.image,
    hidden: game.hidden
  });

  const clearAll = () => {
    setSettings(DEFAULT_SETTINGS);
    setGames([]);
    setHistory([]);
    localStorage.removeItem('fortuneWheelSettings');
    localStorage.removeItem('fortuneWheelGames');
    localStorage.removeItem('fortuneWheelHistory');
  };

  const handleCopyLink = async (modeOverride?: 'viewer' | 'editor') => {
    if (sharing) return;
    // onClick передаёт объект события — валиден только явный режим из интро/меню
    const override = modeOverride === 'editor' || modeOverride === 'viewer' ? modeOverride : undefined;
    // Первый шар и режим никогда не выбирался — сначала интро с объяснением
    if (!override && !localStorage.getItem('fwShareMode')) {
      setShareIntroOpen(true);
      return;
    }
    setSharing(true);
    setLinkError(null);
    setLinkCopied(false);
    setLinkCopiedFull(false);
    
    const url = new URL(window.location.href);

    const state = {
      settings,
      games: games.map(game => ({
        name: game.name,
        appId: game.appId,
        color: game.color,
        image: game.image,
        hidden: game.hidden
      })) // Save all important game data for perfect sharing!
    };
    const encodedState = btoa(encodeURIComponent(JSON.stringify(state)));

    const collab = (override ?? shareMode) === 'editor';
    const createShare = async (asCollab: boolean): Promise<string> => {
      const resp = await fetch(`${API_URL}/api/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asCollab ? { state, collab: true } : { state })
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || t(settings.locale, 'err.apiStatus', { code: resp.status }));
      }
      const { shareId } = await resp.json();
      if (!shareId) throw new Error(t(settings.locale, 'err.noShareId'));
      return shareId;
    };

    let shortLinkSuccess = false;
    let updated = false;
    try {
      if (!API_URL) {
        throw new Error(t(settings.locale, 'err.noApiUrl'));
      }
      let id: string;
      if (collab && liveShareId) {
        // PUT всегда: заодно апгрейдит старые private-live шары до collab.
        const resp = await fetch(`${API_URL}/api/shares/${liveShareId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state, owner: getVisitorId(), collab: true })
        });
        if (resp.ok) {
          id = liveShareId;
          updated = liveDirty;
        } else if (resp.status === 403 || resp.status === 404) {
          // ownership lost (other browser / wiped storage) — mint a fresh editor link
          id = await createShare(true);
          setLiveShareId(id);
          localStorage.setItem('fwLiveShare', id);
        } else {
          const e = await resp.json().catch(() => ({}));
          throw new Error(e.error || t(settings.locale, 'err.apiStatus', { code: resp.status }));
        }
        setLiveDirty(false);
      } else {
        id = await createShare(collab);
        if (collab) {
          setLiveShareId(id);
          localStorage.setItem('fwLiveShare', id);
          setLiveDirty(false);
        }
      }
      // слепок = то, что сейчас лежит по ссылке — «Сохранить» появится
      // только когда локальное состояние от него уедет
      shareBaselineRef.current = wheelFingerprint(state.games, state.settings);
      url.searchParams.set('share', id);
      url.searchParams.delete('state'); // Remove old state param if exists
      shortLinkSuccess = true;
    } catch {
      // Короткая ссылка не получилась — fallback на state-параметр, это не ошибка для юзера
      url.searchParams.set('state', encodedState);
      url.searchParams.delete('share');
    }

    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      setLinkError(t(settings.locale, 'err.shareFailed'));
      setSharing(false);
      return;
    }
    if (updated) {
      setLinkUpdated(true);
      setTimeout(() => setLinkUpdated(false), 2000);
    } else if (shortLinkSuccess) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } else {
      setLinkCopiedFull(true);
      setTimeout(() => setLinkCopiedFull(false), 2000);
    }
    trackEvent('share');
    setSharing(false);
  };

  const handlePreloadPrices = async () => {
    setPreloading(true);
    setPreloadProgress(0);
    const gamesWithAppId = games.filter(g => g.appId);
    const appIds = gamesWithAppId.map(g => g.appId!);
    
    if (appIds.length === 0) {
      setPreloading(false);
      return;
    }

    // Preload prices
    const priceResults = await preloadPrices(appIds, settings.steam.region, true); // force true
    const newGames = games.map(g => ({ ...g }));
    let processed = 0;

    for (const game of newGames) {
      if (game.appId && priceResults[game.appId]) {
        const priceData = priceResults[game.appId];
        const result: any = {};
        if (priceData.price != null) {
          result.price = formatPrice(priceData.price, settings.steam.currency, settings.locale);
        }
        if (priceData.discount != null && priceData.discount > 0 && priceData.originalPrice != null) {
          result.discount = `-${priceData.discount}%`;
          result.originalPrice = formatPrice(priceData.originalPrice, settings.steam.currency, settings.locale);
        }
        game.price = result.price;
        game.discount = result.discount;
        game.originalPrice = result.originalPrice;
      }
      processed++;
      setPreloadProgress(Math.round((processed / newGames.length) * 100));
    }

    setGames(newGames);
    setPreloadProgress(100);
    setPreloading(false);
  };

  // Helper function to fetch mapping suggestions for a game
  const fetchMappingSuggestionsForGame = async (game: Game) => {
    const { suggestions } = await getMappingSuggestions(game.name);
    
    // Auto-map only if NOT already mapped, AND we have an EXACT normalized match
    if (!game.appId) {
      const normalizedGameName = normalizeStringForComparison(game.name);
      const transliteratedGameName = normalizeStringForComparison(transliterateRussian(game.name));
      
      // Only auto-map if we have an exact normalized or transliterated match!
      const autoMapSuggestion =
        suggestions.find(s => normalizeStringForComparison(s.name) === normalizedGameName)
        ?? suggestions.find(s => normalizeStringForComparison(transliterateRussian(s.name)) === transliteratedGameName);

      if (autoMapSuggestion) {
        await handleApplyMappingSuggestion(game.id, autoMapSuggestion.appId, autoMapSuggestion.icon);
      }
    }
    
    setMappingSuggestions(prev => ({ ...prev, [game.id]: suggestions }));
  };

  // Helper to fetch price in background for a specific game ID
  const fetchPriceInBackground = async (gameId: string, appId: string) => {
    if (!settings.steam.enableIntegration) return;
    try {
      const priceData = await fetchSteamPrice(appId, settings);
      if (priceData) {
        // Update game with price, but only if it still exists
        setGames(prevGames => {
          const game = prevGames.find(g => g.id === gameId);
          if (game && game.appId === appId) {
            return prevGames.map(g => g.id === gameId ? {
              ...g,
              price: priceData.price,
              discount: priceData.discount,
              originalPrice: priceData.originalPrice
            } : g);
          }
          return prevGames; // Game removed or appId changed, do nothing
        });
      }
    } catch (error) {
      console.error('Error fetching price in background:', error);
    }
  };

  // Handle applying a mapping suggestion to game
  const handleApplyMappingSuggestion = async (gameId: string, appId: string, icon?: string) => {
    // Find game
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    // Get the suggestion to find its icon (переданная напрямую приоритетнее — mappingSuggestions может ещё не закоммититься)
    const suggestion = mappingSuggestions[gameId]?.find(s => s.appId === appId);
    const gameImage = icon || suggestion?.icon || getSteamGameIconUrl(appId);

    // Update game locally FIRST, show immediately
    const updatedGames = games.map(g => g.id === gameId ? { ...g, appId: appId, image: gameImage } : g);
    setGames(updatedGames);
    
    // Clear suggestions for this game
    setShowMappingSuggestionsFor(null);
    setMappingSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[gameId];
      return newSuggestions;
    });

    // Do the rest in background without blocking UI
    (async () => {
      await saveGameMapping(game.name, appId);
      fetchPriceInBackground(gameId, appId);
    })();
  };

  const saveEditedGame = () => {
    if (!editingGame || !editForm.name.trim()) return;
    const appId = editForm.appId.trim() || undefined;
    const appIdChanged = appId !== editingGame.appId;
    setGames(prev => prev.map(g => g.id === editingGame.id ? {
      ...g, ...editForm, name: editForm.name.trim(), appId,
      ...(appIdChanged ? { price: undefined, discount: undefined, originalPrice: undefined } : {})
    } : g));
    if (appIdChanged && appId) fetchPriceInBackground(editingGame.id, appId);
    setEditingGame(null);
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setEditForm({ name: game.name, appId: game.appId || '', color: game.color, image: game.image || '' });
  };

  // Helper to get Steam game icon URL
  const getSteamGameIconUrl = (appId: string) => {
    // Use Akamai CDN instead of Cloudflare to avoid ORB blocking
    return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_sm_120.jpg`;
  };

  const handleSteamGameSelect = async (selectedAppId: string | undefined) => {
    // First clean up any temp game state
    const currentTempGameId = tempGameId;
    setShowSteamSearchResultsModal(false);
    setGameNameToMap('');
    setSteamSearchResults([]);
    setTempGameId(null);

    if (!currentTempGameId) {
      // No temp game, add new one
      let gameImage: string | undefined = undefined;
      
      if (selectedAppId) {
        const selectedResult = steamSearchResults.find(r => r.appId === selectedAppId);
        gameImage = selectedResult?.icon || getSteamGameIconUrl(selectedAppId);
      }
      const newGame: Game = {
        id: uid(),
        name: gameNameToMap,
        appId: selectedAppId,
        color: getGameColor(games.length), // Use current length for color calculation
        image: gameImage
      };
      setGames(prev => [...prev, newGame]);
      
      if (selectedAppId) {
        (async () => {
          await saveGameMapping(gameNameToMap, selectedAppId);
          fetchPriceInBackground(newGame.id, selectedAppId);
        })();
      }
    } else {
      // We have a temp game, update it!
      if (selectedAppId) {
        const selectedResult = steamSearchResults.find(r => r.appId === selectedAppId);
        const gameImage = selectedResult?.icon || getSteamGameIconUrl(selectedAppId);
        setGames(prevGames => {
          const game = prevGames.find(g => g.id === currentTempGameId);
          if (game) {
            return prevGames.map(g => g.id === currentTempGameId ? { ...g, appId: selectedAppId, image: gameImage } : g);
          }
          return prevGames;
        });
        
        (async () => {
          await saveGameMapping(gameNameToMap, selectedAppId);
          fetchPriceInBackground(currentTempGameId, selectedAppId);
        })();
      }
    }
  };

  const handleWinScreenGameSelect = async (selectedAppId: string | undefined, originalGame: Game) => {
    let gameImage: string | undefined = undefined;
    if (selectedAppId) {
      const selectedResult = steamSearchResults.find(r => r.appId === selectedAppId);
      gameImage = selectedResult?.icon || getSteamGameIconUrl(selectedAppId);
    }

    const updatedGame = { ...originalGame, appId: selectedAppId, image: gameImage };
    setGames(prevGames => prevGames.map(g => g.id === originalGame.id ? updatedGame : g));
    setSelectedGame(updatedGame); // Update the selected game on win screen
    setShowWinScreenMappingModal(false);
    setGameToMapOnWinScreen(null);
    setSteamSearchResults([]);

    // Do the rest in background
    if (selectedAppId) {
      (async () => {
        await saveGameMapping(originalGame.name, selectedAppId);
        if (settings.steam.enableIntegration) {
          try {
            const data = await fetchSteamPrice(selectedAppId, settings);
            if (data) {
              setGames(prevGames => prevGames.map(g =>
                g.id === originalGame.id && g.appId === selectedAppId ? { ...g, ...data } : g));
              setSelectedGame(prev =>
                prev && prev.id === originalGame.id && prev.appId === selectedAppId ? { ...prev, ...data } : prev);
            }
          } catch (error) {
            console.error('Error fetching price on win screen after mapping:', error);
          }
        }
      })();
    }
  };

  const { playSpinSound, playWinSound, playTick } = useAudio();

  // Подсказки маппинга грузим лениво по клику — не все 80 запросов разом
  const handleToggleSuggestions = async (game: Game) => {
    if (showMappingSuggestionsFor === game.id) {
      setShowMappingSuggestionsFor(null);
      return;
    }
    setShowMappingSuggestionsFor(game.id);
    if (!mappingSuggestions[game.id]) {
      await fetchMappingSuggestionsForGame(game);
    }
  };

  // Инициализация при первом запуске
  useEffect(() => {
    if (initialized) return;
    
    const init = async () => {
      let loadedFromShare = false;
      let loadedSettings = DEFAULT_SETTINGS;
      let loadedGames: Game[] = [];
      let loadedHistory: HistoryItem[] = [];

      // 1. Проверка на ссылку с шейрингом FIRST! BEFORE clearing shareDB!
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('share');
      const stateParam = params.get('state');

      // Deals-режим: на самом первом визите колесо наполняется горящими скидками.
      // Запрос стартует сразу — параллельно с загрузкой шаринга, без потери времени
      const isFirstVisit = !shareId && !stateParam && localStorage.getItem('fortuneWheelGames') === null;
      const dealsPromise = isFirstVisit
        ? fetchDeals(loadedSettings.steam.region).catch(() => [])
        : null;

      if (shareId) {
        // First try API
        try {
          const response = await fetch(`${API_URL}/api/shares/${shareId}`);
          if (response.ok) {
            const sharedState = await response.json();

            // mode/editable есть только у нового API; отсутствие = неизменяемая ссылка
            const shareApiMode = sharedState.mode as 'editor' | 'live' | 'snapshot' | undefined;
            const mine = shareApiMode === 'live' && sharedState.ownerHash
              ? sharedState.ownerHash === await sha256Hex(getVisitorId())
              : false;
            const canUpdate = shareApiMode === 'editor' || mine;
            setShareOrigin({ editable: shareApiMode !== 'snapshot' && sharedState.editable === true, canUpdate });
            if (canUpdate) {
              // Ссылка редактируемая нами — продолжаем править её же
              setShareMode('editor');
              setLiveShareId(shareId);
              setLiveDirty(false);
              localStorage.setItem('fwShareMode', 'editor');
              localStorage.setItem('fwLiveShare', shareId);
            } else {
              // Чужая/viewer-ссылка — забываем свою editor-шару, иначе
              // «Сохранить» перезапишет её содержимым этой копии
              setLiveShareId(null);
              setLiveDirty(false);
              localStorage.removeItem('fwLiveShare');
            }

            if (sharedState.settings) {
              loadedSettings = mergeSettings(sharedState.settings);
            }
            if (sharedState.games) {
              loadedGames = sharedState.games.map(normalizeGame);
              loadedFromShare = true;
            }
          } else {
            throw new Error('API share not found');
          }
        } catch {
          setDbStatus('disconnected');
          shareFailedRef.current = true;
          setDbError(t(loadedSettings.locale, 'err.shareLoad'));
        }
      } else if (stateParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(stateParam)));
          if (decoded.settings) {
            loadedSettings = mergeSettings(decoded.settings);
          }
          if (decoded.games) {
            loadedGames = decoded.games.map(normalizeGame);
            loadedFromShare = true;
          }
        } catch (err) {
          console.error('Failed to parse shared state:', err);
        }
      }

      // 2. Если не из шейринга, загружаем из localStorage — каждый ключ независимо,
      // чтобы один битый JSON не ронял остальные
      if (!loadedFromShare) {
        const loadJson = (key: string) => {
          try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
          } catch (err) {
            console.error(`Failed to parse ${key}:`, err);
            return null;
          }
        };
        const savedSettings = loadJson('fortuneWheelSettings');
        const savedGames = loadJson('fortuneWheelGames');
        const savedHistory = loadJson('fortuneWheelHistory');
        if (savedSettings) loadedSettings = mergeSettings(savedSettings);
        // Ребрендинг: дефолтный заголовок старого имени мигрируем в PileSpin.
        // Кастомный пользовательский заголовок не трогаем.
        if (loadedSettings.titles.main === 'STEAM ROULETTE' || loadedSettings.titles.main === 'СТИМ-РУЛЕТКА') {
          loadedSettings = { ...loadedSettings, titles: { ...loadedSettings.titles, main: 'PILESPIN' } };
        }
        if (localStorage.getItem('fortuneWheelGames') === null) {
          // Совсем первый визит — колесо из горящих скидок вместо демо-игр.
          // Кап по времени: если сеть медленная — демо, ценность не должна
          // стоить первому рендеру больше ~1.2с
          const deals = await Promise.race([
            dealsPromise || Promise.resolve([]),
            new Promise<never[]>(r => setTimeout(() => r([]), 2000))
          ]);
          if (deals.length >= 4) {
            loadedGames = deals.slice(0, 10).map((d, i) => ({
              id: uid(),
              name: d.name,
              appId: String(d.appId),
              color: getGameColor(i),
              price: d.price != null ? formatPrice(d.price, loadedSettings.steam.currency, loadedSettings.locale) : undefined,
              discount: d.discount > 0 ? `-${d.discount}%` : undefined,
              originalPrice: d.originalPrice != null && d.discount > 0
                ? formatPrice(d.originalPrice, loadedSettings.steam.currency, loadedSettings.locale)
                : undefined,
            }));
          } else {
            // подсев демо-игр, чтобы колесо не было пустым
            loadedGames = DEFAULT_GAMES.map((g, i) => ({ id: uid(), ...g, color: getGameColor(i) }));
          }
        } else if (Array.isArray(savedGames)) {
          loadedGames = savedGames.map(normalizeGame);
        }
        if (Array.isArray(savedHistory)) {
          loadedHistory = savedHistory.map((item: any) =>
            item?.game ? { ...item, game: normalizeGame(item.game) } : item).filter(Boolean);
        }
      }

      // Длинные state-ссылки тоже нередактируемые — считаем их снапшотами
      if (loadedFromShare && !shareId) {
        setShareOrigin({ editable: false, canUpdate: false });
      }
      // База сравнения для dirty/форка — «как выглядело колесо при загрузке»
      // (из ссылки или из localStorage — сравниваем с тем, что отобразили)
      shareBaselineRef.current = wheelFingerprint(loadedGames, loadedSettings);

      // Игры рендерим сразу — не ждём сеть
      setSettings(loadedSettings);
      setGames(loadedGames);
      setHistory(loadedHistory);
      setInitialized(true);
      trackEvent('visit');
      if (!shareFailedRef.current) {
        setDbStatus('connected');
        setDbError(null);
      }
      // Reset all UI state to avoid open modals!
      setEditingGame(null);
      setSettingsOpen(false);
      setHistoryOpen(false);
      setImportOpen(false);
      setConfirmClearGamesOpen(false);
      setShowSteamSearchResultsModal(false);
      setShowWinScreenMappingModal(false);
      setShowMappingSuggestionsFor(null);
      setMappingSuggestions({});

      // Авто-маппинг + цены — фоновыми батчами, не блокируя первый рендер
      if (loadedSettings.steam.enableIntegration) {
        (async () => {
          const enriched = new Map<string, { appId: string; image?: string }>();
          for (let i = 0; i < loadedGames.length; i += 4) {
            const batch = await Promise.all(loadedGames.slice(i, i + 4).map(async game => {
              if (game.appId) {
                return game.image ? null : { id: game.id, appId: game.appId, image: getSteamGameIconUrl(game.appId) };
              }
              const { existing, suggestions } = await getMappingSuggestions(game.name);
              if (existing) {
                const s = suggestions.find(s => s.appId === existing);
                return { id: game.id, appId: existing, image: s?.icon || getSteamGameIconUrl(existing) };
              }
              const mostUsed = suggestions.find(s => s.isMostUsed);
              return mostUsed ? { id: game.id, appId: mostUsed.appId, image: mostUsed.icon || getSteamGameIconUrl(mostUsed.appId) } : null;
            }));
            for (const g of batch) if (g) enriched.set(g.id, g);
            if (enriched.size > 0) {
              setGames(prev => prev.map(g => {
                const m = enriched.get(g.id);
                return m ? { ...g, appId: g.appId || m.appId, image: g.image || m.image } : g;
              }));
            }
          }

          // Цены — после маппинга, одним запросом
          const appIds = loadedGames
            .map(g => g.appId || enriched.get(g.id)?.appId)
            .filter((id): id is string => !!id);
          if (appIds.length > 0) {
            setPreloading(true);
            const priceResults = await preloadPrices(appIds, loadedSettings.steam.region, false);
            setGames(prev => prev.map(game => {
              const data = game.appId && priceResults[game.appId];
              if (!data) return game;
              const priceData: any = {};
              if (data.price != null) {
                priceData.price = formatPrice(data.price, loadedSettings.steam.currency, loadedSettings.locale);
              }
              if (data.discount != null && data.discount > 0 && data.originalPrice != null) {
                priceData.discount = `-${data.discount}%`;
                priceData.originalPrice = formatPrice(data.originalPrice, loadedSettings.steam.currency, loadedSettings.locale);
              }
              return { ...game, ...priceData };
            }));
            setPreloading(false);
          }
        })();
      }
      
      // Очищаем URL от state параметра, чтобы не дублировать при перезагрузке
      if (stateParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    init();
  }, [initialized]);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('fortuneWheelSettings', JSON.stringify(settings));
      localStorage.setItem('fortuneWheelGames', JSON.stringify(games));
      localStorage.setItem('fortuneWheelHistory', JSON.stringify(history));
    } catch {
      // Quota exceeded (big images) — не роняем приложение
    }
    // Реальная правка колеса относительно загруженного/сохранённого слепка?
    const changed = shareBaselineRef.current !== null &&
      wheelFingerprint(games, settings) !== shareBaselineRef.current;
    // Правки своей editor-шары → кнопка «Сохранить» (откат правок её прячет)
    if (liveShareId) setLiveDirty(changed);
    // Первая правка чужой/нередактируемой шары — подсказка про собственную копию
    if (changed && shareOrigin && !shareOrigin.canUpdate && !forkNotice) {
      setForkNotice(true);
    }
  }, [settings, games, history, initialized]);

  // Заголовок вкладки следует за настраиваемым заголовком
  useEffect(() => {
    document.title = settings.titles.main || 'PileSpin';
    document.documentElement.lang = settings.locale;
  }, [settings.titles.main, settings.locale]);

  // Escape закрывает любой открытый оверлей
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setSelectedGame(null);
      setImportOpen(false);
      setConfirmClearGamesOpen(false);
      setSettingsOpen(false);
      setHistoryOpen(false);
      setShowSteamSearchResultsModal(false);
      setShowWinScreenMappingModal(false);
      setShowMappingSuggestionsFor(null);
      setManualSearchQuery('');
      setEditingGame(null);
      setShareMenuOpen(false);
      setShareIntroOpen(false);
      collapseSheet();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Проверка связи с API — один раз после инициализации
  useEffect(() => {
    if (!initialized) return;
    const checkConnection = async () => {
      if (!API_URL) {
        setDbStatus('disconnected');
        setDbError(t(localeRef.current, 'err.noApiUrl'));
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.database === 'connected') {
            setDbStatus('connected');
            // Preserve the share-load error so a bad ?share= link isn't silently masked
            if (!shareFailedRef.current) setDbError(null);
          } else {
            setDbStatus('disconnected');
            setDbError(t(localeRef.current, 'err.dbConn'));
          }
        } else {
          setDbStatus('disconnected');
          setDbError(t(localeRef.current, 'err.apiConn'));
        }
      } catch {
        setDbStatus('disconnected');
        setDbError(t(localeRef.current, 'err.apiUnreachable'));
      }
    };

    checkConnection();
  }, [initialized]);

  const handleAddGame = async () => {
    if (!newGameName.trim()) return;

    const gameName = newGameName.trim();
    setNewGameName('');

    if (settings.steam.enableIntegration) {
      // 1. Try to get mapping from DB
      const dbMapping = await getGameMapping(gameName);
      if (dbMapping) {
        // We have a mapping, add the game now and fetch price in background
        const newGame: Game = {
          id: uid(),
          name: gameName,
          appId: dbMapping.app_id,
          color: getGameColor(games.length),
          image: getSteamGameIconUrl(dbMapping.app_id)
        };
        setGames(prev => [...prev, newGame]);
        (async () => fetchPriceInBackground(newGame.id, dbMapping.app_id))();
        return;
      } else {
        // 2. Search Steam for the game
        const searchResults = await searchSteamGames(gameName);

        if (searchResults.length === 1) {
          // Auto-select if only one result
          const newGame: Game = {
            id: uid(),
            name: gameName,
            appId: searchResults[0].appId,
            color: getGameColor(games.length),
            image: searchResults[0].icon || getSteamGameIconUrl(searchResults[0].appId)
          };
          setGames(prev => [...prev, newGame]);
          (async () => {
            await saveGameMapping(gameName, searchResults[0].appId);
            fetchPriceInBackground(newGame.id, searchResults[0].appId);
          })();
        } else if (searchResults.length > 1) {
          // Show modal for user to choose, add a temp game first
          const tempGame: Game = {
            id: uid(),
            name: gameName,
            color: getGameColor(games.length)
          };
          setGames(prev => [...prev, tempGame]);
          setTempGameId(tempGame.id);
          setSteamSearchResults(searchResults);
          setGameNameToMap(gameName);
          setShowSteamSearchResultsModal(true);
        } else {
          // No results, just add the game
          const newGame: Game = {
            id: uid(),
            name: gameName,
            color: getGameColor(games.length)
          };
          setGames(prev => [...prev, newGame]);
        }
      }
    } else {
      // Steam integration disabled, just add the game
      const newGame: Game = {
        id: uid(),
        name: gameName,
        color: getGameColor(games.length)
      };
      setGames(prev => [...prev, newGame]);
    }
  };

  const handleImportGames = () => {
    const lines = importText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const newGames: Game[] = lines.map((name, index) => ({
      id: uid(),
      name,
      color: getGameColor(games.length + index)
    }));
    setGames(prev => [...prev, ...newGames]);
    setImportText('');
    setImportOpen(false);
  };

  const wishlistToGames = (list: DealsGame[], offset: number): Game[] =>
    list.map((g, i) => ({
      id: uid(),
      name: g.name,
      appId: String(g.appId),
      color: getGameColor(offset + i),
      price: g.price != null ? formatPrice(g.price, settings.steam.currency, settings.locale) : undefined,
      discount: g.discount > 0 ? `-${g.discount}%` : undefined,
      originalPrice: g.originalPrice != null && g.discount > 0
        ? formatPrice(g.originalPrice, settings.steam.currency, settings.locale)
        : undefined,
    }));

  const handleImportWishlist = async () => {
    if (!steamProfileInput.trim() || wishlistLoading) return;
    setWishlistLoading(true);
    setWishlistError(null);
    setWishlistResult(null);
    const res = await fetchWishlist(steamProfileInput.trim(), settings.steam.region);
    setWishlistLoading(false);
    if (res.error) {
      setWishlistError(res.error);
      return;
    }
    if (res.games.length === 0) {
      setWishlistError('private_or_empty');
      return;
    }
    setWishlistResult({ games: res.games });
  };

  const applyWishlist = (mode: 'replace' | 'append') => {
    if (!wishlistResult) return;
    const offset = mode === 'replace' ? 0 : games.length;
    const newGames = wishlistToGames(wishlistResult.games, offset);
    setGames(prev => mode === 'replace' ? newGames : [...prev, ...newGames]);
    setWishlistResult(null);
    setWishlistError(null);
    setSteamProfileInput('');
    setImportOpen(false);
  };

  const handleRemoveGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
  };

  const handleResult = async (game: Game) => {
    setSelectedGame(game);
    trackEvent('spin');
    if (settings.sound.enabled) {
      playWinSound(settings.sound.volume);
    }
    
    // Добавляем в историю (храним последние 100 — localStorage не бесконечный)
    const historyItem: HistoryItem = {
      id: uid(),
      timestamp: Date.now(),
      game
    };
    setHistory(h => [...h, historyItem].slice(-100));
    
    let gameWithAppId = { ...game };

    if (!game.appId && settings.steam.enableIntegration) {
      // Try to find mapping if appId is missing
      const dbMapping = await getGameMapping(game.name);
      if (dbMapping) {
        gameWithAppId = { ...game, appId: dbMapping.app_id };
      } else {
        const searchResults = await searchSteamGames(game.name);
        if (searchResults.length === 1) {
          gameWithAppId = { ...game, appId: searchResults[0].appId };
          await saveGameMapping(game.name, searchResults[0].appId);
        } else if (searchResults.length > 1) {
          setGameToMapOnWinScreen(game);
          setSteamSearchResults(searchResults);
          setShowWinScreenMappingModal(true);
          // Don't proceed with price fetching yet, wait for user selection
          return; 
        }
      }
    }

    if (gameWithAppId.appId && !gameWithAppId.price && settings.steam.enableIntegration) {
      setLoadingPrices(true);
      try {
        const data = await fetchSteamPrice(gameWithAppId.appId, settings);
        if (data) {
          const updatedGame = { 
            ...gameWithAppId, 
            price: data.price, 
            discount: data.discount, 
            originalPrice: data.originalPrice 
          };
          setSelectedGame(updatedGame);
          setGames(prev => prev.map(g => g.id === game.id ? updatedGame : g));
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      } finally {
        setLoadingPrices(false);
      }
    }
  };

  const handleSpinStart = () => {
    if (settings.sound.enabled) {
      playSpinSound(settings.sound.volume);
    }
    setSelectedGame(null);
  };

  return (
    <MotionConfig reducedMotion="user">
    <main
      className="h-dvh text-slate-100 font-sans p-4 max-lg:pt-0 md:p-8 transition-all duration-300 overflow-hidden lg:overflow-auto [scrollbar-gutter:stable]"
      style={{
        backgroundImage: settings.customization.backgroundImage
          ? `url(${settings.customization.backgroundImage})`
          : settings.customization.backgroundColor
            ? 'none'
            : 'linear-gradient(135deg, #0f172a, #1e293b)',
        backgroundColor: settings.customization.backgroundColor || undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* мобильный топ-бар: заголовок слева, шар/настройки справа — под пальцем */}
      <div className="lg:hidden sticky top-0 z-40 -mx-4 mb-2 px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] flex items-center justify-between gap-3 bg-slate-900 border-b border-white/5">
        <span className="text-lg font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
          {settings.titles.main}
        </span>
        <div className="flex items-center shrink-0">
          <button onClick={() => void handleCopyLink()} aria-label={t(settings.locale, 'action.shareWheel')} className="p-3 text-slate-300 active:scale-90 transition-transform">
            {linkCopied || linkCopiedFull ? <Check size={20} className="text-emerald-400" /> : <Link2 size={20} />}
          </button>
          <button onClick={() => setSettingsOpen(true)} aria-label={t(settings.locale, 'action.settings')} className="p-3 text-slate-300 active:scale-90 transition-transform">
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100dvh-5.5rem)] lg:min-h-[calc(100dvh-4rem)] gap-8 relative">

        <div className="flex-1 lg:min-w-0 flex flex-col items-center justify-center space-y-8 relative px-4 order-1 lg:order-2">
          <div className={`text-center space-y-4 transition-transform duration-300 ease-out max-lg:hidden ${settingsOpen ? 'lg:-translate-x-[300px]' : ''}`}>
            <h1 className="text-[clamp(1.9rem,7vw,4.5rem)] font-black leading-[1.15] pb-[0.12em] whitespace-nowrap overflow-hidden text-ellipsis bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              {settings.titles.main}
            </h1>
            <p className="text-slate-200 font-medium text-sm md:text-xl">{settings.titles.subtitle}</p>
          </div>

          <div className={`relative transition-transform duration-300 ease-out ${settingsOpen ? 'lg:-translate-x-[300px]' : ''}`} style={cropStyle}>
            <FortuneWheel
              games={visibleGames}
              onResult={handleResult} 
              isSpinning={isSpinning} 
              setIsSpinning={setIsSpinning}
              settings={settings}
              onSpinStart={handleSpinStart}
              isWinPopupOpen={selectedGame !== null}
              winnerIndex={selectedGame ? visibleGames.indexOf(selectedGame) : -1}
              onTick={(f) => settings.sound.enabled && playTick(settings.sound.volume * f)}
            />
          </div>

          {/* Модалка с результатом по центру колеса */}
          <AnimatePresence>
            {selectedGame && !isSpinning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[80] flex items-center justify-center p-4"
              >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedGame(null)} />
                {confettiBits.length > 0 && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {confettiBits.map((b, i) => (
                      <motion.span
                        key={i}
                        initial={{ y: -20, rotate: 0, opacity: 1 }}
                        animate={{ y: window.innerHeight + 60, rotate: b.rot, opacity: [1, 1, 0] }}
                        transition={{ duration: b.duration, delay: b.delay, ease: 'easeIn' }}
                        style={{ position: 'absolute', left: `${b.left}%`, width: b.w, height: b.w * 1.6, backgroundColor: b.color, borderRadius: 1 }}
                      />
                    ))}
                  </div>
                )}
                <motion.div
                  role="dialog" aria-modal="true" aria-label={t(settings.locale, 'aria.win')}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
                  className="relative bg-slate-900/95 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-white/20 w-full max-w-sm sm:max-w-md">
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={() => void handleCopyLink()}
                      className="text-white/60 hover:text-white transition-colors p-2 flex items-center gap-1.5 text-sm"
                      title={t(settings.locale, 'action.shareWheel')}
                    >
                      {linkCopied || linkCopiedFull ? <Check size={18} className="text-emerald-400" /> : <Link2 size={18} />}
                      {linkCopied ? t(settings.locale, 'action.shareCopied') : linkCopiedFull ? t(settings.locale, 'action.shareCopiedFull') : t(settings.locale, 'action.shareWheel')}
                    </button>
                    <button onClick={() => setSelectedGame(null)} className="text-white/60 hover:text-white transition-colors p-2">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="bg-yellow-400 p-4 rounded-full shadow-lg animate-bounce [animation-iteration-count:3]">
                      <Trophy className="text-slate-900" size={40} />
                    </div>
                    
                    <div>
                      <h3 className="text-white/70 uppercase tracking-widest text-xs font-bold mb-1">{t(settings.locale, 'win.label')}</h3>
                      <h2 className="text-2xl sm:text-3xl font-black text-white break-all max-w-full">{selectedGame.name}</h2>
                    </div>

                    {(settings.prices.showPrices || settings.prices.showDiscounts) && (
                      <div className="w-full bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 mt-4">
                        {loadingPrices ? (
                          <div className="flex items-center justify-center gap-2 py-2">
                            <RefreshCcw className="animate-spin text-indigo-300" size={24} />
                            <span className="text-lg font-medium">{t(settings.locale, 'win.loading')}</span>
                          </div>
                        ) : selectedGame.price ? (
                          <>
                            {settings.prices.showPrices && (
                              <div className="flex items-center justify-center gap-2 text-indigo-200 mb-1">
                                <Coins size={20} />
                                <span className="text-sm font-semibold uppercase tracking-wider">{t(settings.locale, 'win.price')}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                              {selectedGame.originalPrice && settings.prices.showDiscounts && (
                                <span className="text-lg text-slate-400 line-through">{selectedGame.originalPrice}</span>
                              )}
                              {settings.prices.showPrices && (
                                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{selectedGame.price}</span>
                              )}
                              {selectedGame.discount && settings.prices.showDiscounts && (
                                <span className="text-lg font-bold text-yellow-300 bg-yellow-500/30 px-3 py-1 rounded">{selectedGame.discount}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-indigo-200/60 py-2 italic">
                            {selectedGame.appId ? t(settings.locale, 'win.priceNotFound') : t(settings.locale, 'win.notOnSteam')}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedGame.appId && settings.steam.enableIntegration && (
                      <a
                        href={`https://store.steampowered.com/app/${selectedGame.appId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors mt-2 underline underline-offset-4"
                      >
                        {t(settings.locale, 'win.viewOnSteam')}
                      </a>
                    )}
                    <button
                      onClick={() => { setGames(prev => prev.map(g => g.id === selectedGame.id ? { ...g, hidden: true } : g)); setSelectedGame(null); }}
                      className="text-red-300/70 hover:text-red-200 text-sm transition-colors mt-3 underline underline-offset-4"
                    >
                      {t(settings.locale, 'win.removeFromWheel')}
                    </button>
                  </div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          style={{ y: sheetY }}
          drag="y"
          dragListener={false}
          dragControls={sheetDrag}
          dragMomentum={false}
          dragConstraints={{ top: 0, bottom: peekY }}
          dragElastic={0.15}
          onDragStart={() => sheetY.stop()}
          onDragEnd={(_, info) => {
            lastDragRef.current = performance.now();
            // Snap к ближайшему пойнту по спроецированной точке остановки (Apple: d≈0.998)
            const projected = sheetY.get() + (info.velocity.y / 1000) * (0.998 / (1 - 0.998));
            const v = info.velocity.y;
            const py = peekYRef.current;
            if (Math.abs(projected) < Math.abs(projected - py)) {
              listCollapsed ? expandSheet(v) : springTo(0, v);
            } else {
              listCollapsed ? springTo(py, v) : collapseSheet(v);
            }
          }}
          className={`space-y-3 bg-slate-800/70 max-lg:bg-slate-900 max-lg:will-change-transform lg:backdrop-blur-md rounded-2xl border border-slate-700 h-fit order-2 lg:order-1 lg:self-start lg:shrink-0 lg:overflow-hidden lg:transition-[width,opacity,padding,margin,border-color] lg:duration-300 lg:ease-out max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:h-dvh max-lg:z-50 max-lg:m-0 max-lg:rounded-b-none max-lg:border-x-0 max-lg:border-b-0 max-lg:pb-[env(safe-area-inset-bottom)] max-lg:flex max-lg:flex-col max-lg:overscroll-contain max-lg:shadow-2xl max-lg:p-4 ${
          settingsOpen
            ? 'lg:w-0 lg:p-0 lg:border-transparent lg:opacity-0 lg:-mr-8 lg:pointer-events-none max-lg:hidden'
            : listCollapsed
              ? 'lg:mt-0 lg:w-14 lg:p-2 lg:opacity-60 lg:hover:opacity-100 lg:hover:border-indigo-500/50 lg:hover:bg-slate-800/90 group'
              : 'lg:w-1/3'
        }`}>
          {/* drag-ручка шита — мобилка; тап тоже тоглит */}
          <div
            className="lg:hidden flex justify-center pt-0.5 pb-1.5 cursor-grab active:cursor-grabbing touch-pan-x select-none"
            onPointerDown={(e) => sheetDrag.start(e)}
            onClick={() => { if (performance.now() - lastDragRef.current > 300) (listCollapsed ? expandSheet : collapseSheet)(); }}
          >
            <div className="w-10 h-1.5 rounded-full bg-slate-500/80" />
          </div>
          {/* большая SPIN-кнопка в зоне большого пальца — мобилка */}
          <motion.button
            onClick={() => (document.querySelector('[data-spin-btn]') as HTMLButtonElement)?.click()}
            disabled={isSpinning || visibleGames.length === 0}
            className={`${listCollapsed ? 'lg:hidden' : 'hidden'} w-full h-14 rounded-xl bg-indigo-600 font-black text-lg tracking-widest text-white active:scale-[0.97] transition-transform disabled:opacity-50`}
            style={{ opacity: spinPeekOpacity }}
          >
            {settings.spinButton.text}
          </motion.button>
          <button
            ref={titleRowRef}
            onClick={() => { if (performance.now() - lastDragRef.current > 300) (listCollapsed ? expandSheet : collapseSheet)(); }}
            onPointerDown={(e) => { if (isMobileSheet()) sheetDrag.start(e); }}
            aria-expanded={!listCollapsed}
            title={t(settings.locale, listCollapsed ? 'games.expandList' : 'games.collapseList')}
            className={`group w-full flex items-center justify-between text-xl font-bold py-1 rounded-lg transition-colors duration-200 hover:bg-slate-700/40 touch-pan-x select-none ${listCollapsed ? 'lg:justify-center' : '-mx-2 px-2'}`}
          >
            <span className={`flex items-center gap-2 ${listCollapsed ? 'lg:hidden' : ''}`}>
              <Gamepad2 className="text-indigo-400" />
              {t(settings.locale, 'games.title')} <span className={listCollapsed ? 'max-lg:hidden' : ''}>({visibleGames.length})</span>
            </span>
            {listCollapsed && (
              <ChevronRight size={16} className="hidden lg:block text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
            )}
            {!listCollapsed && (
              <ChevronDown size={20} className="hidden lg:block text-slate-400 transition-all duration-200 group-hover:translate-y-0.5 group-hover:text-indigo-400" />
            )}
          </button>
          {listCollapsed && (
            <div className="hidden lg:flex flex-col items-center gap-1 border-t border-slate-700/60 pt-2">
              <button onClick={() => void handleCopyLink()} title={t(settings.locale, 'action.shareWheel')} aria-label={t(settings.locale, 'action.shareWheel')} className="p-1.5 rounded-md text-slate-500 hover:text-indigo-300 hover:bg-slate-700/60 transition-colors">
                {linkCopied || linkCopiedFull ? <Check size={16} className="text-emerald-400" /> : <Link2 size={16} />}
              </button>
              <button onClick={() => setHistoryOpen(true)} title={t(settings.locale, 'action.history')} aria-label={t(settings.locale, 'action.history')} className="p-1.5 rounded-md text-slate-500 hover:text-indigo-300 hover:bg-slate-700/60 transition-colors">
                <HistoryIcon size={16} />
              </button>
              <button onClick={() => setSettingsOpen(true)} title={t(settings.locale, 'action.settings')} aria-label={t(settings.locale, 'action.settings')} className="p-1.5 rounded-md text-slate-500 hover:text-indigo-300 hover:bg-slate-700/60 transition-colors">
                <SettingsIcon size={16} />
              </button>
            </div>
          )}
          <AnimatePresence initial={false}>
          {(!listCollapsed || isMobileSheet()) && (
          <motion.div
            key="gameList"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden max-lg:flex max-lg:flex-col max-lg:flex-1 max-lg:min-h-0"
          >
          <div className={`flex flex-col gap-3 max-lg:transition-[max-height,opacity,margin] max-lg:duration-200 max-lg:ease-out max-lg:overflow-hidden ${listHeaderCompact ? 'max-lg:max-h-0 max-lg:opacity-0 max-lg:mb-0 lg:mb-4' : 'max-lg:max-h-80 max-lg:opacity-100 mb-4'}`}>
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => void handleCopyLink()}
                  disabled={sharing}
                  className={`flex-1 p-3 rounded-l-lg transition-colors flex items-center justify-center gap-2 font-semibold text-white disabled:opacity-50 ${linkCopied || linkCopiedFull ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  {linkCopied || linkCopiedFull || linkUpdated ? <Check size={20} /> : (shareMode === 'editor' && liveShareId && liveDirty) ? <Save size={20} /> : <Link2 size={20} />}
                  <span className="whitespace-nowrap">{linkCopied ? t(settings.locale, 'action.shareCopied') : linkCopiedFull ? t(settings.locale, 'action.shareCopiedFull') : linkUpdated ? t(settings.locale, 'share.updated') : (shareMode === 'editor' && liveShareId && liveDirty) ? t(settings.locale, 'share.update') : t(settings.locale, 'action.shareWheel')}</span>
                </button>
                <button
                  onClick={() => setShareMenuOpen(v => !v)}
                  title={t(settings.locale, 'share.modeTitle')}
                  aria-label={t(settings.locale, 'share.modeTitle')}
                  className={`px-2.5 rounded-r-lg border-l border-white/20 transition-colors text-white ${linkCopied || linkCopiedFull ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  {shareMode === 'editor' ? <Pencil size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {shareMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShareMenuOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                    {(['viewer', 'editor'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => {
                          setShareMode(mode);
                          localStorage.setItem('fwShareMode', mode);
                          setShareMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-700 flex items-start gap-2 transition-colors"
                      >
                        <span className="w-4 shrink-0 mt-0.5">{shareMode === mode && <Check size={14} className="text-indigo-400" />}</span>
                        {mode === 'editor'
                          ? <Pencil size={14} className="shrink-0 mt-0.5 text-slate-400" />
                          : <Eye size={14} className="shrink-0 mt-0.5 text-slate-400" />}
                        <span className="min-w-0">
                          <span className="block text-slate-200">{t(settings.locale, mode === 'editor' ? 'share.modeEditor' : 'share.modeViewer')}</span>
                          <span className="block text-slate-500">{t(settings.locale, mode === 'editor' ? 'share.editorHint' : 'share.viewerHint')}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {linkError && (
                <div className="mt-1 text-xs text-red-400 break-all">
                  {linkError}
                </div>
              )}
            </div>
            {forkNotice && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-200">
                <PencilOff size={14} className="shrink-0 mt-0.5 text-amber-400" />
                <span className="flex-1">{t(settings.locale, shareOrigin?.editable ? 'fork.noticeLive' : 'fork.noticeSnapshot')}</span>
                <button onClick={() => setForkNotice(false)} aria-label={t(settings.locale, 'action.close')} className="text-amber-300/70 hover:text-amber-100 shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="grid grid-cols-5 gap-2">
              <button onClick={() => setImportOpen(true)} className="text-slate-400 hover:text-white py-2 rounded-lg hover:bg-slate-700 transition flex flex-col items-center justify-center gap-1" title={t(settings.locale, 'action.import')}>
                <ClipboardPaste size={20} />
                <span className="text-[11px] leading-none whitespace-nowrap">{t(settings.locale, 'action.import')}</span>
              </button>
              <button onClick={() => setGames(prev => [...prev].sort(() => Math.random() - 0.5))} className="text-slate-400 hover:text-white py-2 rounded-lg hover:bg-slate-700 transition flex flex-col items-center justify-center gap-1" title={t(settings.locale, 'action.shuffle')}>
                <Shuffle size={20} />
                <span className="text-[11px] leading-none whitespace-nowrap">{t(settings.locale, 'action.shuffle')}</span>
              </button>
              <button onClick={() => setHistoryOpen(true)} className="text-slate-400 hover:text-white py-2 rounded-lg hover:bg-slate-700 transition flex flex-col items-center justify-center gap-1" title={t(settings.locale, 'action.history')}>
                <HistoryIcon size={20} />
                <span className="text-[11px] leading-none whitespace-nowrap">{t(settings.locale, 'action.history')}</span>
              </button>
              <button onClick={() => setConfirmClearGamesOpen(true)} className="text-slate-400 hover:text-red-400 py-2 rounded-lg hover:bg-slate-700 transition flex flex-col items-center justify-center gap-1" title={t(settings.locale, 'action.clearList')}>
                <Trash2 size={20} />
                <span className="text-[11px] leading-none whitespace-nowrap">{t(settings.locale, 'action.clear')}</span>
              </button>
              <button onClick={() => setSettingsOpen(true)} className="text-slate-400 hover:text-white py-2 rounded-lg hover:bg-slate-700 transition flex flex-col items-center justify-center gap-1" title={t(settings.locale, 'action.settings')}>
                <SettingsIcon size={20} />
                <span className="text-[11px] leading-none whitespace-nowrap">{t(settings.locale, 'action.settings')}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGame()}
                placeholder={t(settings.locale, 'games.addPlaceholder')}
                className="w-full bg-slate-700 border-none rounded-lg py-2 px-3 min-h-[44px] focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-100"
              />
            </div>
            <button
              onClick={handleAddGame}
              className="bg-indigo-600 hover:bg-indigo-500 p-2 min-w-[44px] min-h-[44px] rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus size={24} />
            </button>
          </div>



          <div
            onScroll={(e) => {
              const st = e.currentTarget.scrollTop;
              const last = lastListScrollRef.current;
              // классика «hide on scroll down / show on scroll up»
              if (st <= 8 || st < last - 4) setListHeaderCompact(false);
              else if (st > last + 4 && st > 24) setListHeaderCompact(true);
              lastListScrollRef.current = st;
            }}
            className="mt-3 lg:max-h-[60vh] max-lg:flex-1 max-lg:min-h-0 overflow-y-auto space-y-2 pr-2 custom-scrollbar pt-1 [mask-image:linear-gradient(to_bottom,transparent,black_24px)]"
          >
            {games.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">
                {t(settings.locale, 'games.empty')}
              </p>
            )}
            <AnimatePresence initial={false}>
            {games.map((game) => (
              <motion.div
                key={game.id}
                layout
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="flex flex-col bg-slate-700/50 p-3 rounded-lg border border-slate-600"
              >
                {editingGame?.id === game.id && createPortal(
                    <div role="dialog" aria-modal="true" aria-label={t(settings.locale, 'games.edit')} className="fixed inset-0 z-[70] bg-slate-900 lg:bg-black/60 lg:backdrop-blur-sm lg:flex lg:items-center lg:justify-center max-lg:animate-[sheetUp_0.25s_ease-out] overscroll-contain" onClick={() => setEditingGame(null)}>
                      <div className="max-lg:h-full max-lg:overflow-y-auto max-lg:p-4 lg:w-full lg:max-w-md lg:bg-slate-800 lg:border lg:border-slate-600 lg:rounded-2xl lg:p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white">{t(settings.locale, 'games.edit')}</h3>
                          <button onClick={() => setEditingGame(null)} aria-label={t(settings.locale, 'action.close')} className="p-2 -m-1 text-slate-400 hover:text-white">
                            <X size={20} />
                          </button>
                        </div>
                        <EditGameForm
                          loc={settings.locale}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          onSave={saveEditedGame}
                          onCancel={() => setEditingGame(null)}
                        />
                      </div>
                    </div>,
                    document.body
                  )}
                <>
                    <div className={`flex items-center gap-3 ${game.hidden ? 'opacity-40' : ''}`}>
                      <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden border" style={{ borderColor: game.color, backgroundColor: `${game.color}33` }}>
                        {(() => {
                          const rowImg = game.image && !game.image.includes('header.jpg')
                            ? game.image
                            : game.appId ? getSteamGameIconUrl(game.appId) : game.image;
                          return rowImg && (
                            <img src={rowImg} alt="" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="truncate flex-1 text-sm font-medium" title={game.name}>{game.name}</span>
                        {settings.prices.showPrices && game.price && (
                          <span className="text-xs text-slate-400 shrink-0">{game.price}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setGames(prev => prev.map(g => g.id === game.id ? { ...g, hidden: !g.hidden } : g))}
                          title={t(settings.locale, game.hidden ? 'games.showOnWheel' : 'games.hideFromWheel')}
                          aria-label={t(settings.locale, game.hidden ? 'games.showOnWheel' : 'games.hideFromWheel')}
                          className={`p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center ${game.hidden ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                        >
                          {game.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {settings.steam.enableIntegration && (
                          <button
                            onClick={() => handleToggleSuggestions(game)}
                            className="text-indigo-400 hover:text-indigo-300 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center"
                            title={t(settings.locale, 'games.findGame')}
                          >
                            <Search size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditGame(game)}
                          title={t(settings.locale, 'games.edit')}
                          aria-label={t(settings.locale, 'games.edit')}
                          className="text-slate-400 hover:text-indigo-400 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleRemoveGame(game.id)}
                          title={t(settings.locale, 'games.remove')}
                          aria-label={t(settings.locale, 'games.remove')}
                          className="text-red-400/60 hover:text-red-400 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      </div>
                    </div>
                    {showMappingSuggestionsFor === game.id && createPortal(
                      <div role="dialog" aria-modal="true" aria-label={t(settings.locale, 'games.pickPrompt')} className="fixed inset-0 z-[70] bg-slate-900 lg:bg-black/60 lg:backdrop-blur-sm lg:flex lg:items-center lg:justify-center overscroll-contain" onClick={() => { setShowMappingSuggestionsFor(null); setManualSearchQuery(''); }}>
                      <div className="space-y-2 bg-slate-900 lg:bg-slate-800 p-4 lg:p-5 max-lg:h-full max-lg:overflow-y-auto max-lg:animate-[sheetUp_0.25s_ease-out] lg:w-full lg:max-w-md lg:border lg:border-slate-600 lg:rounded-2xl lg:max-h-[80vh] lg:overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold text-white">{t(settings.locale, 'games.pickPrompt')}</h4>
                          <button onClick={() => { setShowMappingSuggestionsFor(null); setManualSearchQuery(''); }} aria-label={t(settings.locale, 'action.close')} className="p-2 -m-1 text-slate-400 hover:text-white">
                            <X size={20} />
                          </button>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={manualSearchQuery}
                            onChange={(e) => setManualSearchQuery(e.target.value)}
                            placeholder={t(settings.locale, 'games.searchPlaceholder')}
                            className="flex-1 text-sm px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600"
                          />
                          <button
                            onClick={async () => {
                              if (!manualSearchQuery.trim()) return;
                              setManualSearchLoading(true);
                              const results = await searchSteamGames(manualSearchQuery);
                              // Convert to MappingSuggestion type
                              const suggestions: MappingSuggestion[] = results.map(result => ({
                                appId: result.appId,
                                name: result.name,
                                icon: result.icon
                              }));
                              // Merge with existing suggestions, removing duplicates
                              const existingSuggestions = mappingSuggestions[game.id] || [];
                              const mergedSuggestions = [...suggestions];
                              for (const existing of existingSuggestions) {
                                if (!mergedSuggestions.find(s => s.appId === existing.appId)) {
                                  mergedSuggestions.push(existing);
                                }
                              }
                              setMappingSuggestions({ ...mappingSuggestions, [game.id]: mergedSuggestions });
                              setManualSearchLoading(false);
                            }}
                            disabled={manualSearchLoading}
                            className="px-3 py-2 min-w-[44px] min-h-[44px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {manualSearchLoading ? '…' : <><Search size={16} className="lg:hidden" /><span className="max-lg:hidden">{t(settings.locale, 'games.search')}</span></>}
                          </button>
                        </div>
                        {mappingSuggestions[game.id]?.map((suggestion) => (
                          <button
                            key={suggestion.appId}
                            onClick={() => handleApplyMappingSuggestion(game.id, suggestion.appId)}
                            className="w-full flex items-center gap-2 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-lg flex-shrink-0 relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)' }}>
                              <Gamepad2 size={20} className="text-slate-400" />
                              {suggestion.icon && (
                                <img src={suggestion.icon} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-white">{suggestion.name}</span>
                              <div className="flex gap-1 mt-1">
                                {suggestion.isExisting && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded">{t(settings.locale, 'games.badgeCurrent')}</span>
                                )}
                                {suggestion.isMostUsed && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded">{t(settings.locale, 'games.badgePopular')}</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      </div>,
                      document.body
                    )}
                  </>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </div>

      <SettingsPanel
        settings={settings}
        setSettings={setSettings}
        isOpen={settingsOpen}
        setIsOpen={setSettingsOpen}
        clearAll={clearAll}
        dbStatus={dbStatus}
        dbError={dbError}
        preloading={preloading}
        preloadProgress={preloadProgress}
        handlePreloadPrices={handlePreloadPrices}
      />

      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
        locale={settings.locale}
      />

      <SteamGameSelectionModal
        isOpen={showSteamSearchResultsModal}
        onClose={() => setShowSteamSearchResultsModal(false)}
        gameName={gameNameToMap}
        searchResults={steamSearchResults}
        onSelect={handleSteamGameSelect}
        locale={settings.locale}
      />

      <WinScreenSteamGameSelectionModal
        isOpen={showWinScreenMappingModal}
        onClose={() => setShowWinScreenMappingModal(false)}
        game={gameToMapOnWinScreen}
        searchResults={steamSearchResults}
        onSelect={handleWinScreenGameSelect}
        locale={settings.locale}
      />

      {/* Импорт игр модалка */}
      <AnimatePresence>
        {importOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setImportOpen(false)}
          >
            <motion.div
              role="dialog" aria-modal="true" aria-label={t(settings.locale, 'import.title')}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{t(settings.locale, 'import.title')}</h3>
                <button onClick={() => setImportOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              {/* Импорт из Steam-профиля: вишлист с живыми ценами и скидками */}
              <div className="mb-5">
                <p className="text-slate-300 font-medium mb-2">{t(settings.locale, 'import.steamTitle')}</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={steamProfileInput}
                    onChange={(e) => { setSteamProfileInput(e.target.value); setWishlistError(null); setWishlistResult(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleImportWishlist(); }}
                    placeholder={t(settings.locale, 'import.profilePlaceholder')}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-base lg:text-sm"
                  />
                  <button
                    onClick={() => void handleImportWishlist()}
                    disabled={wishlistLoading || !steamProfileInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    {wishlistLoading ? t(settings.locale, 'import.loading') : t(settings.locale, 'import.wishlist')}
                  </button>
                </div>
                {wishlistError && (
                  <p className="text-sm text-amber-400/90 mb-1">
                    {t(settings.locale,
                      wishlistError === 'invalid_input' ? 'import.errInvalid'
                      : wishlistError === 'profile_not_found' ? 'import.errNotFound'
                      : wishlistError === 'private_or_empty' ? 'import.errPrivate'
                      : 'import.errFetch')}
                  </p>
                )}
                {wishlistResult && (
                  <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                    <p className="text-sm text-emerald-400 mb-2">
                      {t(settings.locale, 'import.found', { count: wishlistResult.games.length })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => applyWishlist('replace')}
                        className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
                      >
                        {t(settings.locale, 'import.replace')}
                      </button>
                      <button
                        onClick={() => applyWishlist('append')}
                        className="flex-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                      >
                        {t(settings.locale, 'import.append')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-slate-400 mb-2 text-sm">{t(settings.locale, 'import.manualTitle')}</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-48 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 mb-4"
                placeholder="Counter-Strike 2&#10;Dota 2&#10;Half-Life 3"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleImportGames}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
                >
                  {t(settings.locale, 'import.submit')}
                </button>
                <button 
                  onClick={() => setImportOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {t(settings.locale, 'action.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Интро выбора типа ссылки — показывается один раз при первом шаре */}
      <AnimatePresence>
        {shareIntroOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShareIntroOpen(false)}
          >
            <motion.div
              role="dialog" aria-modal="true" aria-label={t(settings.locale, 'share.introTitle')}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">{t(settings.locale, 'share.introTitle')}</h3>
                <button onClick={() => setShareIntroOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-4">{t(settings.locale, 'share.introBody')}</p>
              <div className="flex flex-col gap-2">
                {(['viewer', 'editor'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setShareMode(mode);
                      localStorage.setItem('fwShareMode', mode);
                      setShareIntroOpen(false);
                      handleCopyLink(mode);
                    }}
                    className="flex items-start gap-3 text-left p-3 rounded-lg border border-slate-600 hover:border-indigo-500 hover:bg-slate-700/60 transition-colors"
                  >
                    {mode === 'editor'
                      ? <Pencil size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                      : <Eye size={20} className="text-slate-400 shrink-0 mt-0.5" />}
                    <span>
                      <span className="block font-semibold text-white text-sm">{t(settings.locale, mode === 'editor' ? 'share.modeEditor' : 'share.modeViewer')}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{t(settings.locale, mode === 'editor' ? 'share.editorHint' : 'share.viewerHint')}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">{t(settings.locale, 'share.introLater')}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Подтверждение очистки игр */}
      <AnimatePresence>
        {confirmClearGamesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmClearGamesOpen(false)}
          >
            <motion.div
              role="dialog" aria-modal="true" aria-label={t(settings.locale, 'clear.title')}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{t(settings.locale, 'clear.title')}</h3>
                <button onClick={() => setConfirmClearGamesOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <p className="text-slate-400 mb-6">{t(settings.locale, 'clear.confirm', { n: games.length })}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setGames([]);
                    setConfirmClearGamesOpen(false);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg transition-colors font-semibold"
                >
                  {t(settings.locale, 'action.clear')}
                </button>
                <button 
                  onClick={() => setConfirmClearGamesOpen(false)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                >
                  {t(settings.locale, 'action.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
    </MotionConfig>
  );
}

export default App;
