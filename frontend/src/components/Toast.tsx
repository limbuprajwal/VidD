"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  onClose: () => void;
}

export default function Toast({
  message,
  type = "error",
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    error: "from-red-600/90 to-red-800/90 border-red-500/30",
    success: "from-emerald-600/90 to-emerald-800/90 border-emerald-500/30",
    info: "from-blue-600/90 to-blue-800/90 border-blue-500/30",
  };

  const icons = {
    error: "✕",
    success: "✓",
    info: "ℹ",
  };

  return (
    <div
      className={`fixed top-6 right-6 z-50 max-w-sm transition-all duration-300 ${
        visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8"
      }`}
    >
      <div
        className={`flex items-start gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r ${colors[type]} border backdrop-blur-xl shadow-2xl`}
      >
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
          {icons[type]}
        </span>
        <p className="text-sm text-white leading-relaxed flex-1">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
