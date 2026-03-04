import React, { useRef, useState } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;

    let finalX = dx;
    let finalY = dy;

    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      finalX = Math.cos(angle) * maxDistance;
      finalY = Math.sin(angle) * maxDistance;
    }

    setKnobPos({ x: finalX, y: finalY });
    const normalizedX = finalX / maxDistance;
    const normalizedY = finalY / maxDistance;
    
    onMove(normalizedX, normalizedY);
  };

  const handleEnd = () => {
    setKnobPos({ x: 0, y: 0 });
    setIsDragging(false);
    onMove(0, 0);
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (isDragging) return; // Prevent multiple starts
    setIsDragging(true);
    handleMove(clientX, clientY);
  };

  return (
    <div
      ref={joystickRef}
      className="w-32 h-32 rounded-full bg-stone-400/70 border-4 border-stone-600 flex items-center justify-center touch-none select-none cursor-pointer"
      onMouseDown={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isDragging) return;
        
        handleStart(e.clientX, e.clientY);
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
          moveEvent.preventDefault();
          handleMove(moveEvent.clientX, moveEvent.clientY);
        };
        
        const handleMouseUp = (upEvent: MouseEvent) => {
          upEvent.preventDefault();
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          handleEnd();
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
      onTouchStart={(e: React.TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e: React.TouchEvent) => {
        e.preventDefault();
        if (isDragging && e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={(e: React.TouchEvent) => {
        e.preventDefault();
        handleEnd();
      }}
    >
      <div
        className="w-16 h-16 rounded-full bg-stone-700 shadow-lg pointer-events-none"
        style={{ 
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
      />
    </div>
  );
};
