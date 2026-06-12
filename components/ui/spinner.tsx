"use client";

import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 5, className = "text-zinc-400" }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={`h-${size} w-${size} animate-spin ${className}`} />
    </div>
  );
}