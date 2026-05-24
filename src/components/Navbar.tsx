import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, AreaChart, ShieldAlert, Settings, LogOut, Search, Sun, Moon, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/store/useTheme";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/analytics", label: "Sensor Analytics" },
    { href: "/security", label: "Security Logs" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-background/95 backdrop-blur border-b border-border z-50 flex items-center justify-between px-4 md:px-8">
      {/* Left: Brand */}
      <div className="flex items-center gap-0 md:w-64">
        <img src="/logo.png" alt="CoreShield Logo" className="w-10 h-10 md:w-11 md:h-11 object-contain" />
        <h1 className="text-lg md:text-xl font-bold text-primary ml-2">CoreShield</h1>
      </div>

      {/* Mobile Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Center: Navigation Pill (Desktop Only) */}
      <nav className="hidden md:flex items-center bg-card border border-border p-1.5 rounded-full shadow-sm">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Utilities (Desktop Only) */}
      <div className="hidden md:flex items-center gap-4 w-64 justify-end">
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 rounded-full bg-card border-border shadow-sm text-sm"
            placeholder="Search logs..."
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full border-border bg-card hover:bg-accent shadow-sm shrink-0"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-primary" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleLogout}
          className="w-10 h-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 bg-card border-b border-border shadow-lg md:hidden p-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-md font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          
          <div className="h-px bg-border my-2" />
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleTheme} className="flex-1 justify-start">
              {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="flex-1 justify-start">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
