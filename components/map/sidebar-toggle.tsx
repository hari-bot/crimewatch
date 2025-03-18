"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  className?: string;
}

export default function SidebarToggle({
  isOpen,
  toggleSidebar,
  className,
}: SidebarToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "fixed top-2 left-4  z-50 bg-background shadow-md border md:hidden",
        className
      )}
      onClick={toggleSidebar}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}
