"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";

interface SearchCampaignsProps {
  value: string;
  onSearch: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchCampaigns({
  value,
  onSearch,
  placeholder = "Search campaigns...",
  debounceMs = 400,
}: SearchCampaignsProps) {
  const [input, setInput] = useState(value);

  // Sync external value changes
  useEffect(() => {
    setInput(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input !== value) {
        onSearch(input.trim());
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [input, debounceMs, onSearch, value]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(input.trim());
    },
    [input, onSearch]
  );

  const handleClear = useCallback(() => {
    setInput("");
    onSearch("");
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 h-10 bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
      />
      {input && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}