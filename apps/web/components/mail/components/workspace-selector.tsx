```tsx
"use client";

import { cn } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface WorkspaceSelectorProps {
  onSelect: (workspaceId: string) => void;
}

export function WorkspaceSelector({ onSelect }: WorkspaceSelectorProps) {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function loadWorkspaces() {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0) {
          setWorkspaceId(data[0].id);
          onSelect(data[0].id);
        }
      }
    }
    loadWorkspaces();
  }, [onSelect]);

  return (
    <Select
      defaultValue={workspaceId}
      onValueChange={setWorkspaceId}
      className="w-full"
    >
      <SelectTrigger
        className="flex items-center gap-2"
        aria-label="Select workspace"
      >
        <SelectValue placeholder="Select a workspace">
          {workspaceId ? (
            <span>
              {workspaces.find((w) => w.id === workspaceId)?.name ?? ""}
            </span>
          ) : (
            <span>Select workspace</span>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {workspaces.map((ws) => (
          <SelectItem key={ws.id} value={ws.id}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{ws.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```