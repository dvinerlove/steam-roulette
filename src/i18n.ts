export type Locale = 'en' | 'ru';

export const detectLocale = (): Locale =>
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';

const en = {
  // Game list sidebar
  'games.title': 'Games',
  'games.collapseList': 'Collapse list',
  'games.expandList': 'Expand list',
  'games.empty': 'List is empty — add a game above or import a list',
  'games.addPlaceholder': 'Add a game...',
  'games.findGame': 'Find on Steam',
  'games.pickPrompt': 'Pick a game:',
  'games.searchPlaceholder': 'Search Steam...',
  'games.search': 'Search',
  'games.badgeCurrent': 'Current',
  'games.badgePopular': 'Popular',
  'games.name': 'Name',
  'games.color': 'Color',
  'action.import': 'Import',
  'action.clearList': 'Clear game list',
  'action.share': 'Short link',
  'action.shareCopied': 'Copied!',
  'action.shareLink': 'Link',
  'action.shareWheel': 'Share wheel',
  'action.history': 'History',
  'action.settings': 'Settings',
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.clear': 'Clear',
  'action.reset': 'Reset',

  // Win modal
  'win.label': 'Winning game',
  'win.price': 'Price',
  'win.loading': 'Loading...',
  'win.priceNotFound': 'Price not found',
  'win.notOnSteam': 'Not on Steam',
  'win.viewOnSteam': 'View on Steam',

  // Import / confirm dialogs
  'import.title': 'Import game list',
  'import.hint': 'Paste the list of games, one per line:',
  'import.submit': 'Import',
  'clear.title': 'Clear game list?',
  'clear.confirm': 'Delete all {n} games? This cannot be undone.',

  // Steam selection modals
  'steamSelect.title': 'Select a game for "{name}"',
  'steamSelect.hint': 'Multiple Steam games found. Pick the one matching your game.',
  'steamSelect.skip': "Don't link to Steam",
  'winSelect.title': 'Identify "{name}"',
  'winSelect.hint': 'Several Steam games match yours. Pick the right one to fetch prices.',

  // Errors / status
  'err.noApiUrl': 'API URL not configured. Check the VITE_API_URL env variable.',
  'err.noShareId': 'API did not return shareId',
  'err.apiStatus': 'API returned an error: {code}',
  'err.shareFailed': 'Could not create a short link',
  'err.shareLoad': 'Failed to load from API. Check your connection.',
  'err.dbConn': 'Database connection error.',
  'err.apiConn': 'API connection error.',
  'err.apiUnreachable': 'Could not connect to API.',
  'err.imageTooLarge': 'Image is too large! Maximum size is 1MB.',

  // Settings panel
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.integrations': 'Integrations',
  'settings.data': 'Data',

  // Appearance tab
  'sound.section': 'Sound',
  'sound.enable': 'Enable sound',
  'sound.volume': 'Volume',
  'appearance.general': 'General',
  'appearance.language': 'Language',
  'appearance.appBg': 'App background (max 1MB)',
  'appearance.appBgColor': 'Background color',
  'appearance.confetti': 'Confetti on win',
  'appearance.upload': 'Upload image',
  'appearance.wheelSection': 'Wheel',
  'appearance.wheelBg': 'Wheel background (max 1MB)',
  'appearance.wheelBgSettings': 'Wheel background settings',
  'appearance.bgColor': 'Backdrop color',
  'appearance.bgOpacity': 'Backdrop opacity',
  'appearance.imgOpacity': 'Image opacity',
  'appearance.colorOpacity': 'Color opacity',
  'appearance.lineOpacity': 'Line opacity',
  'appearance.borderColor': 'Border color',
  'appearance.pointerColor': 'Pointer color',
  'appearance.spinDuration': 'Spin duration (sec)',
  'appearance.labelPosition': 'Label position',
  'appearance.posInner': 'Inner',
  'appearance.posMiddle': 'Middle',
  'appearance.posOuter': 'Outer',
  'appearance.posFarOuter': 'Far outer',
  'appearance.textColor': 'Sector text color',
  'appearance.textMain': 'Main',
  'appearance.textStroke': 'Stroke',
  'appearance.strokeWidth': 'Stroke width',
  'appearance.pageTitles': 'Page titles',
  'appearance.titlePh': 'Main title',
  'appearance.subtitlePh': 'Subtitle',
  'appearance.resetAll': 'Reset everything and clear list',
  'appearance.resetConfirm': 'Reset all settings and clear the game list?',
  'appearance.showNames': 'Show names',
  'appearance.showImages': 'Show images',
  'appearance.showColors': 'Show colors',
  'appearance.sectorLines': 'Sector lines',
  'appearance.idleSpin': 'Idle spin',
  'appearance.spinBtn': 'Spin button',
  'appearance.text': 'Text',
  'appearance.btnBg': 'Button background',
  'appearance.btnTextColor': 'Text color',

  // Integrations tab
  'db.section': 'Database',
  'db.status': 'Connection status',
  'db.loading': 'Loading...',
  'db.connected': 'Connected!',
  'db.disconnected': 'Disconnected',
  'steam.enable': 'Enable integration',
  'steam.region': 'Region',
  'steam.currency': 'Currency',
  'region.kz': 'Kazakhstan',
  'region.ru': 'Russia',
  'region.us': 'USA',
  'region.eu': 'Europe',

  // Data tab
  'prices.section': 'Prices & discounts',
  'prices.showPrices': 'Show prices',
  'prices.showDiscounts': 'Show discounts',
  'prices.loadAll': 'Load all prices',
  'prices.loading': 'Loading... {n}%',
  'edit.section': 'Edit games',
  'edit.title': 'Editing:',
  'edit.image': 'Image (max 1MB)',

  // History
  'history.title': 'History',
  'history.clear': 'Clear history',
  'history.empty': 'No spins yet',

  // Prices
  'price.free': 'Free',

  // aria labels
  'aria.win': 'Winning game',
  'aria.history': 'Spin history',
};

const ru: typeof en = {
  'games.title': 'Список игр',
  'games.collapseList': 'Свернуть список',
  'games.expandList': 'Развернуть список',
  'games.empty': 'Список пуст — добавьте игру выше или импортируйте список',
  'games.addPlaceholder': 'Добавить игру...',
  'games.findGame': 'Подобрать игру',
  'games.pickPrompt': 'Выберите игру:',
  'games.searchPlaceholder': 'Поиск в Steam...',
  'games.search': 'Поиск',
  'games.badgeCurrent': 'Текущий',
  'games.badgePopular': 'Популярный',
  'games.name': 'Название',
  'games.color': 'Цвет',
  'action.import': 'Импорт',
  'action.clearList': 'Очистить',
  'action.share': 'Короткая ссылка',
  'action.shareCopied': 'Скопировано!',
  'action.shareLink': 'Ссылка',
  'action.shareWheel': 'Поделиться колесом',
  'action.history': 'История',
  'action.settings': 'Настройки',
  'action.save': 'Сохранить',
  'action.cancel': 'Отмена',
  'action.clear': 'Очистить',
  'action.reset': 'Сброс',

  'win.label': 'Выпавшая игра',
  'win.price': 'Цена',
  'win.loading': 'Загрузка...',
  'win.priceNotFound': 'Цена не найдена',
  'win.notOnSteam': 'Не в Steam',
  'win.viewOnSteam': 'Смотреть в Steam',

  'import.title': 'Импорт списка игр',
  'import.hint': 'Вставьте список игр, каждая на новой строке:',
  'import.submit': 'Импортировать',
  'clear.title': 'Очистить список игр?',
  'clear.confirm': 'Вы уверены, что хотите удалить все {n} игр из списка? Это действие нельзя отменить.',

  'steamSelect.title': 'Выберите игру для "{name}"',
  'steamSelect.hint': 'Найдено несколько игр Steam. Выберите ту, которая соответствует вашей игре.',
  'steamSelect.skip': 'Не привязывать к Steam',
  'winSelect.title': 'Уточнить игру "{name}"',
  'winSelect.hint': 'Найдено несколько игр Steam, соответствующих вашей. Выберите правильную, чтобы получить информацию о ценах.',

  'err.noApiUrl': 'API URL не настроен. Проверьте переменную окружения VITE_API_URL.',
  'err.noShareId': 'API не вернул shareId',
  'err.apiStatus': 'API вернул ошибку: {code}',
  'err.shareFailed': 'Не удалось создать короткую ссылку',
  'err.shareLoad': 'Не удалось загрузить из API. Проверьте подключение.',
  'err.dbConn': 'Ошибка подключения к базе данных.',
  'err.apiConn': 'Ошибка подключения к API.',
  'err.apiUnreachable': 'Не удалось подключиться к API.',
  'err.imageTooLarge': 'Изображение слишком большое! Максимальный размер 1MB.',

  'settings.title': 'Настройки',
  'settings.appearance': 'Внешний вид',
  'settings.integrations': 'Интеграции',
  'settings.data': 'Данные',

  'sound.section': 'Звук',
  'sound.enable': 'Включить звук',
  'sound.volume': 'Громкость',
  'appearance.general': 'Общий вид',
  'appearance.language': 'Язык',
  'appearance.appBg': 'Фон приложения (макс 1MB)',
  'appearance.appBgColor': 'Цвет фона',
  'appearance.confetti': 'Конфетти при победе',
  'appearance.upload': 'Загрузить изображение',
  'appearance.wheelSection': 'Колесо',
  'appearance.wheelBg': 'Фон колеса (макс 1MB)',
  'appearance.wheelBgSettings': 'Настройки фона колеса',
  'appearance.bgColor': 'Цвет подложки',
  'appearance.bgOpacity': 'Прозр. подложки',
  'appearance.imgOpacity': 'Прозр. изображения',
  'appearance.colorOpacity': 'Прозр. цветов',
  'appearance.lineOpacity': 'Прозр. линий',
  'appearance.borderColor': 'Цвет рамки',
  'appearance.pointerColor': 'Цвет указателя',
  'appearance.spinDuration': 'Время прокрутки (сек)',
  'appearance.labelPosition': 'Расположение названий',
  'appearance.posInner': 'Ближе к центру',
  'appearance.posMiddle': 'Среднее',
  'appearance.posOuter': 'Ближе к краю',
  'appearance.posFarOuter': 'Очень близко к краю',
  'appearance.textColor': 'Цвет текста на секторах',
  'appearance.textMain': 'Основной',
  'appearance.textStroke': 'Обводка',
  'appearance.strokeWidth': 'Толщина обводки',
  'appearance.pageTitles': 'Заголовки страницы',
  'appearance.titlePh': 'Основной заголовок',
  'appearance.subtitlePh': 'Подзаголовок',
  'appearance.resetAll': 'Сбросить всё и очистить список',
  'appearance.resetConfirm': 'Вы уверены, что хотите сбросить все настройки и очистить список игр?',
  'appearance.showNames': 'Показывать названия',
  'appearance.showImages': 'Показывать изображения',
  'appearance.showColors': 'Показывать цвета',
  'appearance.sectorLines': 'Линии секторов',
  'appearance.idleSpin': 'Idle спин',
  'appearance.spinBtn': 'Кнопка Spin',
  'appearance.text': 'Текст',
  'appearance.btnBg': 'Фон кнопки',
  'appearance.btnTextColor': 'Цвет текста',

  'db.section': 'База данных',
  'db.status': 'Статус подключения',
  'db.loading': 'Загрузка...',
  'db.connected': 'Всё подключено!',
  'db.disconnected': 'Отключено',
  'steam.enable': 'Включить интеграцию',
  'steam.region': 'Регион',
  'steam.currency': 'Валюта',
  'region.kz': 'Казахстан',
  'region.ru': 'Россия',
  'region.us': 'США',
  'region.eu': 'Европа',

  'prices.section': 'Цены и скидки',
  'prices.showPrices': 'Показывать цены',
  'prices.showDiscounts': 'Показывать скидки',
  'prices.loadAll': 'Загрузить все цены',
  'prices.loading': 'Загрузка... {n}%',
  'edit.section': 'Редактирование игр',
  'edit.title': 'Редактирование:',
  'edit.image': 'Изображение (макс 1MB)',

  'history.title': 'История',
  'history.clear': 'Очистить историю',
  'history.empty': 'История прокрутов пуста',

  'price.free': 'Бесплатно',

  'aria.win': 'Выпавшая игра',
  'aria.history': 'История прокрутов',
};

const translations: Record<Locale, typeof en> = { en, ru };

export type TranslationKey = keyof typeof en;

export const formatPrice = (amount: number, currency: string, locale: string = 'en'): string => {
  if (amount === 0) return t(locale, 'price.free');
  try {
    return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: amount % 1 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

export const t = (
  locale: string | undefined,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string => {
  let str = translations[(locale as Locale)]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
};
