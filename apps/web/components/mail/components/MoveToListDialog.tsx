"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderPlus, Check } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import {
  openMoveToListModalAtom,
  customListsAtom,
  focusedThreadAtom,
} from "@/utils/store";
import { toast } from "@/components/ui/use-toast";

export const MoveToListDialog = () => {
  const [open, setOpen] = useAtom(openMoveToListModalAtom);
  const [customLists, setCustomLists] = useAtom(customListsAtom);
  const focusedThread = useAtomValue(focusedThreadAtom);

  const handleMoveToList = (listId: string) => {
    if (!focusedThread?.id) {
      toast({
        title: "No email selected",
        description: "Select an email first to move it to a list.",
      });
      setOpen(false);
      return;
    }

    const updatedLists = customLists.map((list) => {
      if (list.id === listId) {
        const ids = list.manualThreadIds || [];
        if (!ids.includes(focusedThread.id)) {
          return { ...list, manualThreadIds: [...ids, focusedThread.id] };
        }
      }
      return list;
    });

    setCustomLists(updatedLists);
    const targetList = customLists.find((l) => l.id === listId);
    setOpen(false);

    toast({
      title: "Moved to list",
      description: `Email added to "${targetList?.name || "list"}".`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="h-5 w-5 text-sky-500" />
            Move Email to List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          {customLists.map((list) => {
            const alreadyInList =
              focusedThread?.id &&
              list.manualThreadIds?.includes(focusedThread.id);

            return (
              <Button
                key={list.id}
                variant="outline"
                className="w-full justify-between h-9 text-xs"
                onClick={() => handleMoveToList(list.id)}
              >
                <span>{list.name}</span>
                {alreadyInList && (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
