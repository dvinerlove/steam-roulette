import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { Game, Settings } from '../types';

interface FortuneWheelProps {
  games: Game[];
  onResult: (game: Game) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  settings: Settings;
  onSpinStart?: () => void;
  isWinPopupOpen?: boolean;
}

const FortuneWheel: React.FC<FortuneWheelProps> = ({ 
  games, 
  onResult, 
  isSpinning, 
  setIsSpinning,
  settings,
  onSpinStart,
  isWinPopupOpen
}) => {
  const controls = useAnimation();
  const [totalRotation, setTotalRotation] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const currentRotationRef = useRef(0);

  useEffect(() => {
    currentRotationRef.current = totalRotation;
    controls.set({ rotate: totalRotation });
  }, [totalRotation, controls]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isSpinning && !isWinPopupOpen && settings.wheel.idleSpin && games.length > 0 && !reducedMotion) {
      lastTimeRef.current = performance.now();
      
      const animateIdle = (time: number) => {
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;
        
        const degreesToAdd = (deltaTime / 1000) * 6;
        
        currentRotationRef.current -= degreesToAdd;
        controls.set({ rotate: currentRotationRef.current });
        
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
  }, [isSpinning, settings.wheel.idleSpin, games.length, controls, isWinPopupOpen]);

  const spin = async () => {
    if (isSpinning || games.length === 0) return;

    if (onSpinStart) onSpinStart();
    setIsSpinning(true);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Use cryptographically secure random
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const random = randomArray[0] / 0xFFFFFFFF; // Convert to 0-1
    
    const spinDegrees = 1800 + random * 360;
    const newRotation = currentRotationRef.current - spinDegrees;
    
    await controls.start({
      rotate: newRotation,
      transition: { duration: settings.wheel.spinDuration, ease: [0.22, 1, 0.36, 1] }
    });

    setTotalRotation(newRotation);
    setIsSpinning(false);

    // Pointer is on RIGHT (0 degrees), adjust calculation accordingly!
    const normalizedRotation = (-newRotation) % 360;
    const adjustedRotation = (normalizedRotation + 90) % 360; // because we have -90 offset in sector angles
    const sectorAngle = 360 / games.length;
    let winningIndex = Math.floor(adjustedRotation / sectorAngle);
    if (winningIndex < 0) winningIndex += games.length;
    if (winningIndex >= games.length) winningIndex = 0;
    onResult(games[winningIndex]);
  };

  const sectorAngle = 360 / games.length;
  
  const getTextRadius = () => {
    switch (settings.wheel.textPosition) {
      case 'inner': return 22;
      case 'middle': return 30;
      case 'outer': return 38;
      case 'far-outer': default: return 42;
    }
  };

  const textRadius = getTextRadius();

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
    const radial = Math.max(textRadius - 6, 12);
    const maxLen = Math.max(1, ...games.map(g => truncateName(g.name).length));
    return Math.min(base, radial / (0.62 * maxLen));
  })();

  return (
    <div className="mx-auto w-fit p-8 -m-8 overflow-clip">
    <div className="relative w-[min(90vw,70vh,700px)] h-[min(90vw,70vh,700px)] mx-auto">
      <div 
        className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 z-10 w-14 h-10 md:w-16 md:h-12 shadow-xl border-2"
        style={{ 
          clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)', 
          backgroundColor: settings.customization.pointerColor,
          borderColor: settings.customization.wheelBorderColor
        }} 
      />
      
      <motion.div
        animate={controls}
        initial={{ rotate: 0 }}
        className="w-full h-full rounded-full border-8 md:border-12 shadow-2xl relative will-change-transform"
        style={{ 
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

            // Переворачиваем текст на левой половине колеса, чтобы он не был вверх ногами
            const midDeg = ((sectorMidAngle % 360) + 360) % 360;
            const flip = midDeg > 90 && midDeg < 270;
            const textRotation = flip ? sectorMidAngle + 180 : sectorMidAngle;

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
                {settings.wheel.showImages && (
                  <g transform={`translate(${textX}, ${textY}) rotate(${textRotation})`}>
                    {game.image ? (
                      <image
                        href={game.image}
                        x="-6"
                        y="-6"
                        width="12"
                        height="12"
                        preserveAspectRatio="xMidYMid slice"
                        className="select-none pointer-events-none"
                        style={{ borderRadius: '50%' }}
                        onError={(e) => { (e.target as SVGImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <circle
                        cx="0"
                        cy="0"
                        r="6"
                        fill={game.color}
                        opacity="0.8"
                        className="select-none pointer-events-none"
                      />
                    )}
                  </g>
                )}
                {settings.wheel.showGameNames && (
                  <g transform={`translate(${textX}, ${textY}) rotate(${textRotation})`}>
                    <text
                      fill={settings.wheel.textColor}
                      fontSize={fontSize}
                      fontWeight="900"
                      textAnchor={flip ? 'start' : 'end'}
                      dominantBaseline={settings.wheel.showImages && game.image ? "hanging" : "middle"}
                      y={settings.wheel.showImages && game.image ? "7" : "0"}
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
        </svg>
      </motion.div>

      <button
        onClick={spin}
        disabled={isSpinning || games.length === 0}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] min-w-[60px] min-h-[60px] max-w-[120px] max-h-[120px] rounded-full border-6 md:border-8 shadow-xl flex items-center justify-center font-bold hover:opacity-90 active:scale-95 transition-all z-20 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-lg"
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
