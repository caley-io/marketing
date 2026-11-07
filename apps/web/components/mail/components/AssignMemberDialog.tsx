"use client";

import React, { useState } from "react";
import { UserCheck, UserPlus, X, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAtom } from "jotai";
import { emailAssignmentsAtom, teamMembersAtom } from "@/utils/store";
import { assignEmailToMember, unassignEmail, TeamMember } from "@/utils/emailAssignment";
import { toast } from "@/components/ui/use-toast";

interface AssignMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
}

export function AssignMemberDialog({
  open,
  onOpenChange,
  threadId,
}: AssignMemberDialogProps) {
  const [assignments, setAssignments] = useAtom(emailAssignmentsAtom);
  const [teamMembers] = useAtom(teamMembersAtom);

  const currentAssignment = assignments[threadId];
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(
    currentAssignment?.assignee || null,
  );
  const [notes, setNotes] = useState<string>(currentAssignment?.notes || "");

  React.useEffect(() => {
    if (open) {
      setSelectedMember(currentAssignment?.assignee || null);
      setNotes(currentAssignment?.notes || "");
    }
  }, [open, currentAssignment]);

  const handleSave = () => {
    if (!selectedMember) {
      // Unassign
      const updated = unassignEmail(assignments, threadId);
      setAssignments(updated);
      toast({
        title: "Assignment Removed",
        description: "This email thread is no longer assigned.",
      });
      onOpenChange(false);
      return;
    }

    const updated = assignEmailToMember(
      assignments,
      threadId,
      selectedMember,
      "You",
      notes || undefined,
    );
    setAssignments(updated);
    toast({
      title: "Email Assigned",
      description: `Thread assigned to ${selectedMember.name}.`,
    });
    onOpenChange(false);
  };

  const handleUnassign = () => {
    const updated = unassignEmail(assignments, threadId);
    setAssignments(updated);
    toast({
      title: "Assignment Removed",
      description: "This email thread is unassigned.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Assign Email to Teammate</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">
            Assign this conversation to a team member so they take ownership and receive notifications.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Select Teammate
            </label>
            <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
              {teamMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-medium text-sm leading-none flex items-center gap-1.5">
                          {member.name}
                          <Badge variant="outline" className="text-[10px] py-0 px-1">
                            {member.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Assignment Notes / Task Context (Optional)
            </label>
            <Input
              placeholder="e.g. Please reply with the revised SLA terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {currentAssignment ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUnassign}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              Unassign
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              {selectedMember ? "Assign" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
