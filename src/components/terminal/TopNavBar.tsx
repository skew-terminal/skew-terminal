import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Settings, User, ExternalLink, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavBarProps {
  onSearchOpen?: () => void;
}

export const TopNavBar = ({ onSearchOpen }: TopNavBarProps) => {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="font-mono text-lg font-black text-primary">~</span>
          <span className="font-mono text-lg font-black tracking-tight text-foreground">SKEW</span>
        </div>
        <span className="hidden sm:inline-block font-sans text-[10px] text-muted-foreground border-l border-border pl-2 ml-1">
          The Prediction Markets Terminal
        </span>
      </Link>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-secondary/50 hover:bg-secondary transition-colors group"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 text-left font-mono text-xs text-muted-foreground">
            Search markets...
          </span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[9px] text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" asChild>
          <a href="https://docs.skew.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-[10px]">
            Docs
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Button>
        
        <div className="h-5 w-px bg-border mx-1" />
        
        <Button variant="outline" size="sm" className="h-8 px-3 font-mono text-[10px]">
          Sign In
        </Button>
        
        <Button size="sm" className="h-8 px-3 font-mono text-[10px] bg-primary text-primary-foreground hover:bg-primary/90">
          Get Pro
        </Button>
      </div>
    </header>
  );
};
