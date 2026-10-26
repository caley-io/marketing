"tsx";
import React, { useState } from "react";

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground"
      >
        <span>Personal Workspace</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-popover text-popover-foreground border">
          <div className="py-1">
            <button className="block w-full text-left px-4 py-2 text-sm hover:bg-accent">
              Personal Workspace
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm hover:bg-accent text-primary">
              + Create Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
