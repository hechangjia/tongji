"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

interface StepperProps {
  id: string;
  name: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
  label?: string;
}

export function Stepper({
  id,
  name,
  defaultValue = 0,
  min = 0,
  max,
  onChange,
  label,
}: StepperProps) {
  const [value, setValue] = useState(defaultValue);
  const controls = useAnimation();

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleIncrement = () => {
    const newValue = max !== undefined ? Math.min(value + 1, max) : value + 1;
    setValue(newValue);
    onChange?.(newValue);
    controls.start({ scale: [1, 1.1, 1] });
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - 1, min);
    setValue(newValue);
    onChange?.(newValue);
    controls.start({ scale: [1, 0.9, 1] });
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="flex h-[58px] items-center rounded-[24px] border border-slate-200 bg-white/60 p-1.5 shadow-sm transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100">
        <button
          type="button"
          onClick={handleDecrement}
          aria-controls={id}
          disabled={value <= min}
          className="flex h-full w-12 items-center justify-center rounded-[18px] bg-slate-50 text-slate-600 transition hover:bg-slate-100 active:scale-90 disabled:opacity-30"
          aria-label="减少"
        >
          <svg width="14" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="flex-1 text-center">
          <motion.input
            animate={controls}
            id={id}
            name={name}
            type="number"
            value={value}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setValue(val);
              onChange?.(val);
            }}
            className="w-full bg-transparent text-center font-display text-2xl font-semibold text-slate-950 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          aria-controls={id}
          disabled={max !== undefined && value >= max}
          className="flex h-full w-12 items-center justify-center rounded-[18px] bg-slate-950 text-white transition hover:bg-cyan-800 active:scale-90 disabled:opacity-30"
          aria-label="增加"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
