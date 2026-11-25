import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform, animate } from 'framer-motion';
import type { Game, Settings } from '../types';

interface FortuneWheelProps {
  games: Game[];
  onResult: (game: Game) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  settings: Settings;
  onSpinStart?: () => void;
  isWinPopupOpen?: boolean;
  winnerIndex?: number;
  onTick?: (volumeFactor: number) => void;
}

const FortuneWheel: React.FC<FortuneWheelProps> = ({ 
  games, 
  onResult, 
  isSpinning, 
  setIsSpinning,
  settings,
  onSpinStart,
  isWinPopupOpen,
  winnerIndex = -1,
  onTick
}) => {
  const rotate = useMotionValue(0);
  const [totalRotation, setTotalRotation] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const currentRotationRef = useRef(0);
  const spinInfoRef = useRef<{ start: number; degrees: number } | null>(null);
  const lastBoundaryRef = useRef(0);
  const pointerTilt = useMotionValue(0);
  const pointerSquash = useMotionValue(1);
  const pointerStretch = useMotionValue(1);
  const sustainedTilt = useMotionValue(0);
  const wheelZoom = useMotionValue(1);
  const wheelSpeedRef = useRef({ v: 0, t: 0, speed: 0 });
  const wheelBoxRef = useRef<HTMLDivElement>(null);
  const contactOpacity = useTransform(pointerTilt, v => Math.max(0.12, 0.4 - Math.abs(v) / 120));
  // отъезд пикера при зуме: отдельный канал — начинается раньше колеса
  // (anticipation), заканчивается вместе с ним
  const pointerZoomX = useMotionValue(0);

  const sectorAngle = games.length > 0 ? 360 / games.length : 360;

  useEffect(() => {
    currentRotationRef.current = totalRotation;
    rotate.set(totalRotation);
  }, [totalRotation, rotate]);

  const spinRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable], button, a, [role="button"]')) return;
      if (isWinPopupOpen || document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault(); // пробел скроллит страницу
      spinRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isWinPopupOpen]);

  const lastTickTimeRef = useRef(0);

  useMotionValueEvent(rotate, 'change', (v) => {
    const now = performance.now();
    const dt = now - wheelSpeedRef.current.t;
    if (dt > 0) wheelSpeedRef.current.speed = ((v - wheelSpeedRef.current.v) / dt) * 1000;
    wheelSpeedRef.current.v = v;
    wheelSpeedRef.current.t = now;

    const info = spinInfoRef.current;
    const speed = Math.abs(wheelSpeedRef.current.speed);
    // sustained-отгиб ∝ speed² (Galvo): на скорости лопасть держится согнутой
    sustainedTilt.set(info ? 14 * (speed * speed) / (speed * speed + 300 * 300) : 0);
    // suspense-zoom: лёгкий приближал в фазе затухания.
    // Пикер отъезжает раньше (окно 0.45 против 0.55 у колеса) — anticipation:
    // глаз успевает заметить уход носика до того, как обод начал расти
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // На мобилке колесо уже увеличено и кропнуто — зум выносит пикер за экран,
    // а он должен оставаться в фокусе на всём спине
    const mobileCrop = window.matchMedia('(max-width: 1023px)').matches;
    if (info && !reduced && !mobileCrop) {
      const p = Math.min(Math.max((info.start - v) / info.degrees, 0), 1);
      const radius = (wheelBoxRef.current?.clientWidth ?? 0) / 2;
      wheelZoom.set(1 + 0.03 * Math.min(Math.max((p - 0.55) / 0.45, 0), 1));
      pointerZoomX.set(0.04 * Math.min(Math.max((p - 0.4) / 0.5, 0), 1) * radius);
    }
    // Контактная модель насечки: носик скользит вверх по её грани — подъём чистая
    // геометрия треугольного профиля (set на каждый кадр, не спринг).
    // dist — угол от носика до ближайшей насечки под ним.
    const phase = (((-v) % sectorAngle) + sectorAngle) % sectorAngle;
    const dist = sectorAngle - phase;
    const CONTACT_DEG = 2.8; // угловая ширина контакта: насечка + толщина носика
    // отгиб растёт со скоростью — ощущение разгона; на ползании минимальный
    const MAX_LIFT = 7 + Math.min(speed / 450, 1) * 24;
    if (!reduced && dist <= CONTACT_DEG) {
      pointerTilt.stop(); // контакт авторитетнее — глушим недоигравший срыв
      pointerTilt.set(MAX_LIFT * (1 - dist / CONTACT_DEG));
    }

    // вершина насечки прошла под носиком — срыв
    const boundary = Math.floor(-v / sectorAngle);
    if (boundary <= lastBoundaryRef.current || now - lastTickTimeRef.current <= 40) return;
    lastBoundaryRef.current = boundary;
    lastTickTimeRef.current = now;

    if (info && onTick) {
      const traveled = info.start - v;
      const progress = Math.min(Math.max(traveled / info.degrees, 0), 1);
      // fade-in за первые ~8% спина, потом плавный спад к концу
      const fadeIn = Math.min(1, progress / 0.08);
      const fadeOut = Math.max(0.1, 1 - Math.pow(progress, 1.4) * 0.9);
      onTick(fadeIn * fadeOut);
    }

    // Срыв: пружина возвращает носик вниз со скоростью, равной скорости
    // подъёма по грани насечки (MAX_LIFT за CONTACT_DEG при текущей скорости
    // колеса). Кеп 160 — на быстрой фазе срывы сливаются в треск, не вертолёт.
    if (!reduced) {
      const snapV = Math.min((speed * MAX_LIFT) / CONTACT_DEG, 420);
      animate(pointerTilt, 0, { type: 'spring', stiffness: 380, damping: 9, velocity: -snapV });
      if (info) {
        animate(pointerSquash, 1, { type: 'spring', stiffness: 300, damping: 7, velocity: -snapV * 0.003 });
        animate(pointerStretch, 1, { type: 'spring', stiffness: 300, damping: 7, velocity: snapV * 0.003 });
      }
    }
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isSpinning && !isWinPopupOpen && settings.wheel.idleSpin && games.length > 0 && !reducedMotion) {
      lastTimeRef.current = performance.now();
      
      const animateIdle = (time: number) => {
        const deltaTime = Math.min(time - lastTimeRef.current, 100);
        lastTimeRef.current = time;

        const degreesToAdd = (deltaTime / 1000) * 6;
        
        currentRotationRef.current -= degreesToAdd;
        rotate.set(currentRotationRef.current);
        
        animationFrameRef.current = requestAnimationFrame(animateIdle);
      };
      
      animationFrameRef.current = requestAnimationFrame(animateIdle);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpinning, settings.wheel.idleSpin, games.length, rotate, isWinPopupOpen]);

  const spin = async () => {
    if (isSpinning || games.length === 0) return;

    if (onSpinStart) onSpinStart();
    setIsSpinning(true);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Use cryptographically secure random
    const randomArray = new Uint32Array(2);
    crypto.getRandomValues(randomArray);
    const r1 = randomArray[0] / 0x100000000;
    const r2 = randomArray[1] / 0x100000000;

    // Победитель выбирается до анимации, колесо целится внутрь его слайса.
    // Джиттер смещён к краям слайса (посадка «на волоске» от соседа = интрига),
    // но строго |jitter| < 0.5 — честность не ломается: под пикером тот же слайс
    const targetIndex = Math.floor(r1 * games.length);
    const u = r2 - 0.5;
    const frac = 0.5 + Math.sign(u) * Math.pow(Math.abs(u) * 2, 0.55) * 0.47;

    const start = currentRotationRef.current;
    // adjustedRotation = (-newRotation + 90) % 360 должен оказаться в слайсе
    // targetIndex на доле frac → решаем относительно текущего угла
    const delta = ((targetIndex + frac) * sectorAngle + start - 90) % 360;
    const spinDegrees = 2880 + ((delta + 360) % 360);
    const newRotation = start - spinDegrees;

    spinInfoRef.current = { start, degrees: spinDegrees };
    lastBoundaryRef.current = Math.floor(-start / sectorAngle);
    lastTickTimeRef.current = 0;

    // Экспоненциальное затухание (вязкое трение): быстрый старт и длинный
    // ползучий хвост одной непрерывной кривой — без швов и переключений фаз
    await animate(rotate, newRotation, {
      duration: settings.wheel.spinDuration,
      ease: (t) => (1 - Math.exp(-7 * t)) / (1 - Math.exp(-7))
    });
    spinInfoRef.current = null;

    setTotalRotation(newRotation);
    animate(wheelZoom, 1, { duration: 0.5, ease: 'easeOut' });
    animate(pointerZoomX, 0, { duration: 0.5, ease: 'easeOut' });
    // settle-plop: лопасть «шлёпается» на место — один большой вязкий толчок + сквош у пивота
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate(pointerTilt, 0, { type: 'spring', stiffness: 160, damping: 6, velocity: 160 });
      animate(pointerSquash, 1, { type: 'spring', stiffness: 200, damping: 7, velocity: -1.4 });
      animate(pointerStretch, 1, { type: 'spring', stiffness: 200, damping: 7, velocity: 1.2 });
    }

    // Пауза-бит после остановки — интрига перед показом победителя.
    // isSpinning держим до конца: иначе в паузу включается idle-spin
    // и колесо «набирает инерцию» перед модалкой
    await new Promise(r => setTimeout(r, 700));

    // Pointer is on RIGHT (0 degrees), adjust calculation accordingly!
    const normalizedRotation = (-newRotation) % 360;
    const adjustedRotation = (normalizedRotation + 90) % 360; // because we have -90 offset in sector angles
    let winningIndex = Math.floor(adjustedRotation / sectorAngle);
    if (winningIndex < 0) winningIndex += games.length;
    if (winningIndex >= games.length) winningIndex = 0;
    onResult(games[winningIndex]);
    setIsSpinning(false);
  };
  spinRef.current = spin;

  // лопасть: сплошной цвет + лёгкий глянец (все конкуренты — цельная чистая форма)
  const gummyStyle: React.CSSProperties = {
    backgroundColor: settings.customization.pointerColor,
    backgroundImage: [
      'radial-gradient(65% 70% at 30% 26%, rgba(255,255,255,0.45), transparent 70%)',
      'linear-gradient(0deg, rgba(0,0,0,0.16), transparent 40%)'
    ].join(','),
  };

  const getTextRadius = () => Math.min(Math.max(settings.wheel.textPosition, 12), 46);

  const textRadius = getTextRadius();

  // Иконка и подпись лежат на одной радиальной оси слайса. Если подписи внутрь не хватает
  // разбега до кнопки — ставим её снаружи иконки и пускаем к краю.
  const imgHalf = Math.min(5, textRadius * Math.sin((sectorAngle * Math.PI) / 360) * 0.75, 49 - textRadius);
  const labelOutward = settings.wheel.showImages && textRadius - imgHalf - 1.5 < 16;
  const labelRadius = settings.wheel.showImages
    ? textRadius + (labelOutward ? imgHalf + 1.5 : -imgHalf - 1.5)
    : textRadius;

  const truncateName = (name: string): string => {
    const truncMult = settings.wheel.textTruncationMultiplier;
    if (truncMult >= 10) return name;
    const count = games.length;
    const baseLen =
      count <= 4 ? 22 : count <= 8 ? 18 : count <= 16 ? 14 :
      count <= 24 ? 10 : count <= 36 ? 8 : count <= 50 ? 6 : 5;
    const maxLen = Math.round(baseLen * truncMult);
    return name.length > maxLen ? `${name.substring(0, Math.max(3, maxLen - 3))}...` : name;
  };

  // Шрифт: базовый размер по числу секторов, ужимаем чтобы имя влезало в дугу сектора
  const fontSize = (() => {
    const count = games.length;
    const base =
      count <= 4 ? 9 : count <= 8 ? 7 : count <= 16 ? 5 :
      count <= 24 ? 4 : count <= 36 ? 3.2 : count <= 50 ? 2.6 : 2.2;
    if (count === 0) return base;
    // текст идёт от края внутрь — ширина строки ограничена радиальной глубиной
    const radial = labelOutward
      ? Math.max(49 - labelRadius, 8)
      : Math.max(labelRadius - 9, 4); // 9 = радиус хаба + зазор, чтобы текст не заезжал под кнопку
    const maxLen = Math.max(1, ...games.map(g => truncateName(g.name).length));
    return Math.min(base, radial / (0.62 * maxLen));
  })();

  return (
    <div className="mx-auto w-fit overflow-clip [overflow-clip-margin:32px]">
    <div className="relative w-[min(90vw,70vh,700px,calc(100vw-4rem))] h-[min(90vw,70vh,700px,calc(100vw-4rem))] mx-auto rounded-full shadow-2xl">
      {/* Пикер-флаппер: обёртка несёт цветную тень (clip-path срезал бы её на элементе) */}
      <div 
        className="absolute right-0 top-1/2 translate-x-[10%] -translate-y-1/2 z-30 w-[7%] h-[5%] max-lg:w-[8.5%] max-lg:h-[6.5%] pointer-events-none"
        style={{ filter: `drop-shadow(0 3px 5px color-mix(in srgb, ${settings.customization.pointerColor} 55%, transparent))` }}
      >
        {/* следует за зумом колеса: растёт и отодвигается вместе с ободом */}
        <motion.div className="absolute inset-0" style={{ scale: wheelZoom, x: pointerZoomX }}>
          {/* контактная тень лежит на колесе, не крутится с лопастью */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[10%] w-[45%] h-[18%] rounded-full bg-black/45 blur-[2px]"
            style={{ opacity: contactOpacity }}
          />
          {/* шарнир: sustained-отгиб от скорости колеса */}
          <motion.div className="absolute inset-0" style={{ rotate: sustainedTilt, transformOrigin: '96% 50%' }}>
            {/* кик-отгиб на каждом колышке */}
            <motion.div className="absolute inset-0" style={{ rotate: pointerTilt, transformOrigin: '96% 50%' }}>
              {/* желейная деформация: объём сохраняется, skew слегка срезает форму */}
              <motion.div className="absolute inset-0" style={{ scaleX: pointerSquash, scaleY: pointerStretch, transformOrigin: '96% 50%' }}>
                {/* цельная лопасть-треугольник */}
                <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)', ...gummyStyle }} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div
        ref={wheelBoxRef}
        className="w-full h-full rounded-full border-8 md:border-12 relative will-change-transform"
        style={{
          rotate,
          scale: wheelZoom,
          borderColor: settings.customization.wheelBorderColor
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: settings.customization.wheelBgColor,
            opacity: settings.customization.wheelBgOpacity
          }}
        />
        {settings.customization.wheelImage && (
          <div
            className="absolute inset-0 bg-cover bg-center rounded-full"
            style={{ 
              backgroundImage: `url(${settings.customization.wheelImage})`,
              opacity: settings.customization.wheelImageOpacity
            }}
          />
        )}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
          {games.map((game, i) => {
            const sectorStartAngle = i * sectorAngle - 90;
            const sectorEndAngle = (i + 1) * sectorAngle - 90;
            const sectorMidAngle = sectorStartAngle + sectorAngle / 2;
            
            const x1 = 50 + 50 * Math.cos((sectorStartAngle * Math.PI) / 180);
            const y1 = 50 + 50 * Math.sin((sectorStartAngle * Math.PI) / 180);
            const x2 = 50 + 50 * Math.cos((sectorEndAngle * Math.PI) / 180);
            const y2 = 50 + 50 * Math.sin((sectorEndAngle * Math.PI) / 180);
            const largeArcFlag = sectorAngle > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            const textX = 50 + textRadius * Math.cos((sectorMidAngle * Math.PI) / 180);
            const textY = 50 + textRadius * Math.sin((sectorMidAngle * Math.PI) / 180);
            const labelX = 50 + labelRadius * Math.cos((sectorMidAngle * Math.PI) / 180);
            const labelY = 50 + labelRadius * Math.sin((sectorMidAngle * Math.PI) / 180);

            // Радиальная ориентация как в Wheel of Names, но флипаем лейбл когда
            // он уходит вверх ногами (левая половина) — иначе нечитаемо.
            const normA = ((sectorMidAngle % 360) + 360) % 360;
            const flipped = normA > 90 && normA < 270;
            const textRotation = sectorMidAngle + (flipped ? 180 : 0);

            const displayName = truncateName(game.name);

            return (
              <g key={game.id}>
                {settings.wheel.showColors && (
                  <path 
                    d={pathData} 
                    fill={game.color} 
                    stroke="transparent" 
                    strokeWidth="0.2" 
                    opacity={settings.customization.colorOpacity}
                  />
                )}
                {/* казино-подсветка победителя: остальные слайсы глушим, у победного белый обод */}
                {winnerIndex >= 0 && settings.wheel.showColors && i !== winnerIndex && (
                  <path d={pathData} fill="rgba(2,6,23,0.5)" className="pointer-events-none" />
                )}
                {winnerIndex === i && (
                  <path d={pathData} fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.75" className="pointer-events-none" />
                )}
                {settings.wheel.showImages && (
                  <g transform={`translate(${textX}, ${textY}) rotate(${textRotation})`}>
                    {game.image ? (
                      <>
                        <clipPath id={`wheel-clip-${i}`}>
                          <circle r={imgHalf} />
                        </clipPath>
                        <image
                          href={game.image}
                          x={-imgHalf}
                          y={-imgHalf}
                          width={imgHalf * 2}
                          height={imgHalf * 2}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#wheel-clip-${i})`}
                          className="select-none pointer-events-none"
                          onError={(e) => { (e.target as SVGImageElement).style.display = 'none'; }}
                        />
                      </>
                    ) : (
                      <circle
                        cx="0"
                        cy="0"
                        r={imgHalf}
                        fill={game.color}
                        opacity="0.8"
                        className="select-none pointer-events-none"
                      />
                    )}
                  </g>
                )}
                {settings.wheel.showGameNames && (
                  <g transform={`translate(${labelX}, ${labelY}) rotate(${textRotation})`}>
                    <text
                      fill={settings.wheel.textColor}
                      fontSize={fontSize}
                      fontWeight="900"
                      textAnchor={labelOutward !== flipped ? 'start' : 'end'}
                      dominantBaseline="middle"
                      y="0"
                      className="select-none pointer-events-none"
                      style={{ 
                        paintOrder: 'stroke',
                        stroke: settings.wheel.textStrokeColor,
                        strokeWidth: settings.wheel.textStrokeWidth
                      }}
                    >
                      {displayName}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {settings.wheel.showSectorLines && (
            <g style={{ opacity: settings.customization.sectorLineOpacity }}>
              {games.map((game, i) => {
                const sectorStartAngle = i * sectorAngle - 90;
                const x1 = 50 + 50 * Math.cos((sectorStartAngle * Math.PI) / 180);
                const y1 = 50 + 50 * Math.sin((sectorStartAngle * Math.PI) / 180);
                return (
                  <line 
                    key={`line-${game.id}`}
                    x1="50" 
                    y1="50" 
                    x2={x1} 
                    y2={y1} 
                    stroke="#1f2937" 
                    strokeWidth="0.2"
                  />
                );
              })}
            </g>
          )}
          {/* насечки-метки на границах — носик флаппера «катается» по ним.
              Маленькие треугольники, заходящие с обода внутрь, как на реальных колёсах */}
          <g className="select-none pointer-events-none">
            {games.map((game, i) => {
              const a = ((i * sectorAngle - 90) * Math.PI) / 180;
              const half = (0.55 * Math.PI) / 180;
              const tipX = 50 + 48.2 * Math.cos(a);
              const tipY = 50 + 48.2 * Math.sin(a);
              const b1x = 50 + 50.6 * Math.cos(a - half);
              const b1y = 50 + 50.6 * Math.sin(a - half);
              const b2x = 50 + 50.6 * Math.cos(a + half);
              const b2y = 50 + 50.6 * Math.sin(a + half);
              return (
                <path
                  key={`peg-${game.id}`}
                  d={`M ${tipX} ${tipY} L ${b1x} ${b1y} L ${b2x} ${b2y} Z`}
                  fill={settings.customization.wheelBorderColor}
                />
              );
            })}
          </g>
        </svg>
      </motion.div>

      {/* неподвижный блик: свет стоит на месте, колесо едет под ним */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none z-10"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.09), transparent 40%, transparent 60%, rgba(0,0,0,0.14))' }}
      />

      {/* декоративный хаб на мобилке — вторая кнопка спина не нужна */}
      <div
        aria-hidden
        className="lg:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[7%] h-[7%] min-w-[22px] min-h-[22px] max-w-[44px] max-h-[44px] rounded-full border-4 shadow-xl z-20"
        style={{
          borderColor: settings.customization.wheelBorderColor,
          background: 'radial-gradient(circle at 35% 30%, #475569, #0f172a 70%)'
        }}
      />
      <button
        data-spin-btn
        onClick={spin}
        disabled={isSpinning || games.length === 0}
        className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] min-w-[60px] min-h-[60px] max-w-[120px] max-h-[120px] rounded-full border-6 md:border-8 shadow-xl items-center justify-center font-bold hover:opacity-90 active:scale-95 transition-all z-20 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-lg"
        style={{ 
          borderColor: settings.customization.wheelBorderColor,
          backgroundColor: settings.spinButton.backgroundColor,
          color: settings.spinButton.textColor
        }}
      >
        {settings.spinButton.text}
      </button>
    </div>
    </div>
  );
};

export default FortuneWheel;
