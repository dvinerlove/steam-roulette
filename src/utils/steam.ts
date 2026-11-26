import type { Settings } from '../types';
import { t, formatPrice } from '../i18n';

interface SteamPriceData {
  price?: string;
  discount?: string;
  originalPrice?: string;
}

interface RawSteamPriceData {
  price?: number;
  discount?: number;
  originalPrice?: number;
}

export interface SteamSearchResult {
  appId: string;
  name: string;
  icon: string;
}

interface GameMapping {
  game_name: string;
  app_id: string;
  created_at: string;
  updated_at: string;
}

const API_URL = import.meta.env.VITE_API_URL;

// Транслитерация кириллицы в латиницу (для сопоставления названий Steam)
export const transliterateRussian = (text: string): string => {
  const cyrillicMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e',
    'ю': 'yu', 'я': 'ya', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K',
    'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S',
    'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh',
    'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => cyrillicMap[char] || char).join('');
};

// Нормализация строки для сравнения (регистр, пунктуация, лишние пробелы)
export const normalizeStringForComparison = (s: string): string =>
  s.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export async function fetchSteamPrice(
  appId: string, 
  settings: Pick<Settings, 'steam' | 'locale'>
): Promise<SteamPriceData | undefined> {
  try {
    if (!settings.steam.enableIntegration) return undefined;
    
    // Try to use backend API first
    try {
      const response = await fetch(`${API_URL}/api/price/${appId}?region=${settings.steam.region}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data) {
          const result: SteamPriceData = {};
          
          if (data.price != null) {
            result.price = formatPrice(data.price, settings.steam.currency, settings.locale);
          }

          if (data.discount > 0 && data.originalPrice != null) {
            result.discount = `-${data.discount}%`;
            result.originalPrice = formatPrice(data.originalPrice, settings.steam.currency, settings.locale);
          }
          
          return result;
        }
      }
    } catch {
      // Backend API failed, falling back to proxies
    }
    
    // Fallback to proxy method if backend is not available
    const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${settings.steam.region}&filters=basic,price_overview`;
    
    // Попробуем несколько прокси по очереди
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(steamUrl)}`, // corsproxy.io - часто работает
      `https://api.allorigins.win/raw?url=${encodeURIComponent(steamUrl)}`, // allorigins raw
      `https://api.allorigins.win/get?url=${encodeURIComponent(steamUrl)}`, // allorigins get
    ];

    for (let i = 0; i < proxies.length; i++) {
      try {
        const proxyUrl = proxies[i];
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          continue;
        }
        
        const responseText = await response.text();
        
        let data: any;
        // Проверяем, какой формат у ответа
        if (responseText.includes('contents')) {
          try {
            const proxyData = JSON.parse(responseText);
            data = JSON.parse(proxyData.contents);
          } catch {
            continue;
          }
        } else {
          try {
            data = JSON.parse(responseText);
          } catch {
            continue;
          }
        }
        
        // Парсим данные
        if (data && data[appId] && data[appId].success) {
          const appData = data[appId].data;
          
          if (appData.is_free) {
            return { price: t(settings.locale, 'price.free') };
          }
          
          const priceOverview = appData.price_overview;
          if (priceOverview) {
            const result: SteamPriceData = {
              price: priceOverview.final_formatted
            };
            
            if (priceOverview.discount_percent > 0) {
              result.discount = `-${priceOverview.discount_percent}%`;
              result.originalPrice = priceOverview.initial_formatted;
            }
            
            return result;
          }
        }
      } catch {
        continue;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export async function searchSteamGames(query: string): Promise<SteamSearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/steam/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function getGameMapping(gameName: string): Promise<GameMapping | null> {
  try {
    const response = await fetch(`${API_URL}/api/mappings?gameName=${encodeURIComponent(gameName)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function saveGameMapping(gameName: string, appId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameName, appId })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function preloadPrices(appIds: string[], region: string, force: boolean = false): Promise<{ [appId: string]: RawSteamPriceData }> {
  try {
    const response = await fetch(`${API_URL}/api/prices/preload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appIds, region, force })
    });

    if (!response.ok) return {};

    const data = await response.json();
    const results: { [appId: string]: RawSteamPriceData } = {};

    if (data && data.results) {
      for (const result of data.results) {
        if (result.data) {
          results[result.appId] = {
            price: result.data.price,
            discount: result.data.discount,
            originalPrice: result.data.originalPrice
          };
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error preloading prices:', error);
    return {};
  }
}

export interface MappingSuggestion {
  appId: string;
  name: string;
  icon?: string;
  isMostUsed?: boolean;
  isExisting?: boolean;
}

export async function getMappingSuggestions(gameName: string): Promise<{ existing: string | null, suggestions: MappingSuggestion[] }> {
  try {
    const response = await fetch(`${API_URL}/api/mappings/suggest?gameName=${encodeURIComponent(gameName)}`);
    if (!response.ok) return { existing: null, suggestions: [] };

    const data = await response.json();

    const suggestions: MappingSuggestion[] = [];

    // Add existing mapping first if present
    if (data.existing?.app_id) {
      // Try to get details for existing mapping
      const existingSearchResult = data.search?.find((s: any) => s.appId === data.existing.app_id);
      suggestions.push({
        appId: data.existing.app_id,
        name: existingSearchResult?.name || data.existing.game_name || "Existing Mapping",
        icon: existingSearchResult?.icon,
        isExisting: true
      });
    }

    // Add most used mappings
    if (data.mostUsed) {
      for (const usage of data.mostUsed) {
        // Skip if already added
        if (suggestions.find(s => s.appId === usage.app_id)) continue;

        const searchResult = data.search?.find((s: any) => s.appId === usage.app_id);
        suggestions.push({
          appId: usage.app_id,
          name: searchResult?.name || usage.app_id,
          icon: searchResult?.icon,
          isMostUsed: true
        });
      }
    }

    // Add search results
    if (data.search) {
      for (const result of data.search) {
        if (suggestions.find(s => s.appId === result.appId)) continue;
        suggestions.push({
          appId: result.appId,
          name: result.name,
          icon: result.icon
        });
      }
    }

    return { existing: data.existing?.app_id || null, suggestions };
  } catch (error) {
    console.error('Error fetching mapping suggestions:', error);
    return { existing: null, suggestions: [] };
  }
}

export interface DealsGame {
  appId: number;
  name: string;
  price: number | null;
  originalPrice: number | null;
  discount: number;
  currency: string | null;
}

// Горящие скидки дня для первого экрана (deals-режим)
export async function fetchDeals(region: string): Promise<DealsGame[]> {
  try {
    const response = await fetch(`${API_URL}/api/deals?cc=${encodeURIComponent(region)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.games) ? data.games : [];
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
}

export interface WishlistResult {
  games: DealsGame[];
  error?: 'invalid_input' | 'profile_not_found' | 'private_or_empty' | 'fetch_failed';
  steamId64?: string;
}

// Импорт вишлиста по ссылке на профиль / vanity / steamid64
export async function fetchWishlist(profile: string, region: string): Promise<WishlistResult> {
  try {
    const response = await fetch(
      `${API_URL}/api/wishlist?profile=${encodeURIComponent(profile)}&cc=${encodeURIComponent(region)}`
    );
    const data = await response.json().catch(() => null);
    if (!data) return { games: [], error: 'fetch_failed' };
    if (data.error) return { games: [], error: data.error, steamId64: data.steamId64 };
    return { games: Array.isArray(data.games) ? data.games : [], steamId64: data.steamId64 };
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return { games: [], error: 'fetch_failed' };
  }
}
