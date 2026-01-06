import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Flame, 
  Users, 
  Calendar, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Terminal", path: "/app", shortcut: "1" },
  { icon: Flame, label: "Hot", path: "/app/hot", shortcut: "2" },
  { icon: Users, label: "Whales", path: "/app/whales", shortcut: "3" },
  { icon: Calendar, label: "Calendar", path: "/app/calendar", shortcut: "4" },
];

export const IconSidebar = () => {
  const location = useLocation();

  return (
    <aside className="flex h-full w-10 flex-col border-r border-border bg-card">
      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-0.5 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/app" && location.pathname === "/app");
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-sm transition-all duration-150",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-mono text-[10px]">
                <span>{item.label}</span>
                <kbd className="ml-2 rounded bg-secondary px-1 py-0.5 text-[9px] text-muted-foreground">
                  {item.shortcut}
                </kbd>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="border-t border-border py-1">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to="/app/settings"
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-all duration-150 hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-[10px]">
            <span>Settings</span>
            <kbd className="ml-2 rounded bg-secondary px-1 py-0.5 text-[9px] text-muted-foreground">5</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
};
