import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Scan, 
  Users, 
  Calendar, 
  FileText,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Terminal", path: "/app" },
  { icon: Scan, label: "Scanner", path: "/app/scanner" },
  { icon: Users, label: "Whales", path: "/app/whales" },
  { icon: Calendar, label: "Calendar", path: "/app/calendar" },
  { icon: FileText, label: "Docs", path: "/app/docs" },
];

export const IconSidebar = () => {
  const location = useLocation();

  return (
    <aside className="flex h-full w-12 flex-col border-r border-border bg-card">
      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/app" && location.pathname === "/app");
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded transition-all duration-150",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-mono text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="border-t border-border py-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to="/app/settings"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded text-muted-foreground transition-all duration-150 hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-4.5 w-4.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
};
