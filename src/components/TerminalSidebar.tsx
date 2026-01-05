import { Link, useLocation } from "react-router-dom";
import { Scan, Users, Calendar, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Scan, label: "Scanner", path: "/app" },
  { icon: Users, label: "Whales", path: "/app/whales" },
  { icon: Calendar, label: "Calendar", path: "/app/calendar" },
];

export const TerminalSidebar = () => {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-16 flex-col border-r border-border bg-sidebar lg:w-56">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-border lg:justify-start lg:px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-primary [-webkit-transform:skewX(-10deg)] [transform:skewX(-10deg)]">
            <Zap className="h-5 w-5 text-primary-foreground [transform:skewX(10deg)]" />
          </div>
          <span className="hidden font-mono text-lg font-bold tracking-wider text-foreground lg:block">
            SKEW
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 rounded px-3 py-3 font-mono text-sm transition-all duration-200 lg:px-4",
                isActive
                  ? "bg-primary/20 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="hidden lg:block">{item.label}</span>
              {isActive && (
                <div className="ml-auto hidden h-2 w-2 rounded-full bg-primary animate-pulse lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="border-t border-border p-2">
        <Link
          to="/app/settings"
          className="flex items-center gap-3 rounded px-3 py-3 font-mono text-sm text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground lg:px-4"
        >
          <Settings className="h-5 w-5" />
          <span className="hidden lg:block">Settings</span>
        </Link>
      </div>
    </aside>
  );
};
