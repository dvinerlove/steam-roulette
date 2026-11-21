export interface Game {
  id: string;
  name: string;
  appId?: string;
  price?: string;
  discount?: string;
  originalPrice?: string;
  color: string;
  image?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  game: Game;
}

import { detectLocale, type Locale } from './i18n';

export interface Settings {
  locale: Locale;
  customization: {
    backgroundImage?: string;
    wheelImage?: string;
    wheelImageOpacity: number;
    wheelBgColor: string;
    wheelBgOpacity: number;
    wheelBorderColor: string;
    pointerColor: string;
    colorOpacity: number;
    sectorLineOpacity: number;
  };
  steam: {
    region: string;
    currency: string;
    enableIntegration: boolean;
    useProxy: boolean;
  };
  wheel: {
    spinDuration: number;
    showGameNames: boolean;
    showImages: boolean;
    showColors: boolean;
    textPosition: 'inner' | 'middle' | 'outer' | 'far-outer';
    showSectorLines: boolean;
    idleSpin: boolean;
    textColor: string;
    textStrokeColor: string;
    textStrokeWidth: number;
    textTruncationMultiplier: number;
  };
  prices: {
    showPrices: boolean;
    showDiscounts: boolean;
    preloaded: boolean;
  };
  spinButton: {
    text: string;
    backgroundColor: string;
    textColor: string;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
  titles: {
    main: string;
    subtitle: string;
  };
}

const defaultLocale = detectLocale();

export const DEFAULT_SETTINGS: Settings = {
  locale: defaultLocale,
  customization: {
    wheelBorderColor: '#1f2937',
    pointerColor: '#ffffff',
    wheelImageOpacity: 0.8,
    wheelBgColor: '#000000',
    wheelBgOpacity: 0.1,
    colorOpacity: 0.7,
    sectorLineOpacity: 0.5
  },
  steam: {
    region: defaultLocale === 'ru' ? 'kz' : 'us',
    currency: defaultLocale === 'ru' ? 'KZT' : 'USD',
    enableIntegration: true,
    useProxy: true
  },
  wheel: {
    spinDuration: 5,
    showGameNames: true,
    showImages: true,
    showColors: true,
    textPosition: 'far-outer',
    showSectorLines: true,
    idleSpin: true,
    textColor: '#ffffff',
    textStrokeColor: '#000000',
    textStrokeWidth: 0.1,
    textTruncationMultiplier: 2.0
  },
  prices: {
    showPrices: true,
    showDiscounts: true,
    preloaded: false
  },
  spinButton: {
    text: 'SPIN',
    backgroundColor: '#ffffff',
    textColor: '#1f2937'
  },
  sound: {
    enabled: true,
    volume: 0.5
  },
  titles: {
    main: defaultLocale === 'ru' ? 'КОЛЕСО ФОРТУНЫ' : 'FORTUNE WHEEL',
    subtitle: defaultLocale === 'ru' ? 'Крути лудик' : 'Spin it, pick it'
  }
};

// Deep-merge a partial settings object (from share links / localStorage) over defaults
export const mergeSettings = (partial?: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...partial,
  customization: { ...DEFAULT_SETTINGS.customization, ...partial?.customization },
  wheel: { ...DEFAULT_SETTINGS.wheel, ...partial?.wheel },
  spinButton: { ...DEFAULT_SETTINGS.spinButton, ...partial?.spinButton },
  sound: { ...DEFAULT_SETTINGS.sound, ...partial?.sound },
  titles: { ...DEFAULT_SETTINGS.titles, ...partial?.titles },
  steam: { ...DEFAULT_SETTINGS.steam, ...partial?.steam },
  prices: { ...DEFAULT_SETTINGS.prices, ...partial?.prices },
});
