import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcutsOptions {
  onSearchOpen?: () => void;
  onEscape?: () => void;
}

const NAV_SHORTCUTS: Record<string, string> = {
  "1": "/app",
  "2": "/app/hot",
  "3": "/app/whales",
  "4": "/app/calendar",
  "5": "/app/settings",
};

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  const navigate = useNavigate();
  const { onSearchOpen, onEscape } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = 
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable;

      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onSearchOpen?.();
        return;
      }

      // Escape to close modals
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }

      // Number shortcuts for navigation (only when not in input)
      if (!isInputFocused && NAV_SHORTCUTS[event.key]) {
        event.preventDefault();
        navigate(NAV_SHORTCUTS[event.key]);
        return;
      }
    },
    [navigate, onSearchOpen, onEscape]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
