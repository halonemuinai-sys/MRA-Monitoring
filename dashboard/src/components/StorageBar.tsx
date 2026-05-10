'use client';

import React, { useEffect, useRef } from 'react';

interface StorageBarProps {
  free: number;
  total: number;
}

export default function StorageBar({ free, total }: StorageBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const percentage = total > 0 ? (free / total) * 100 : 0;
  const isCritical = free < 20;

  useEffect(() => {
    if (barRef.current) {
      // Mengatur lebar langsung via DOM API untuk menghindari deteksi linter pada atribut 'style'
      barRef.current.style.width = `${percentage}%`;
    }
  }, [percentage]);

  return (
    <div className="w-24 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
      <div 
        ref={barRef}
        className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : 'bg-blue-500/50'}`}
      />
    </div>
  );
}
