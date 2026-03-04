import React, { useRef, useState, useCallback } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;

    if (distance <= maxDistance) {
      setKnobPos({ x: dx, y: dy });
      onMove(dx / maxDistance, dy / maxDistance);
    } else {
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * maxDistance;
      const y = Math.sin(angle) * maxDistance;
      setKnobPos({ x, y });
      onMove(x / maxDistance, y / maxDistance);
    }
  }, [onMove]);

  const handleEnd = useCallback(() => {
    setKnobPos({ x: 0, y: 0 });
    setIsDragging(false);
    onMove(0, 0);
  }, [onMove]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    handleMove(clientX, clientY);
  }, [handleMove]);

  return (
    <div
      ref={joystickRef}
      className="w-32 h-32 rounded-full bg-stone-300/50 border-4 border-stone-400/50 flex items-center justify-center touch-none select-none"
      onTouchStart={(e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        if (isDragging) {
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleEnd();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        handleStart(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (isDragging) {
          handleMove(e.clientX, e.clientY);
        }
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div
        className="w-16 h-16 rounded-full bg-stone-600 shadow-lg pointer-events-none transition-transform"
        style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
      />
    </div>
  );
};
