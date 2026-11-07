"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ListPlus } from "lucide-react";
import { useAtom } from "jotai";
import { openCreateListModalAtom, customListsAtom, tabAtom } from "@/utils/store";
import { CustomEmailList, EmailListRule } from "@/utils/emailLists";
import { toast } from "@/components/ui/use-toast";

export const CreateListDialog = () => {
  const [open, setOpen] = useAtom(openCreateListModalAtom);
  const [customLists, setCustomLists] = useAtom(customListsAtom);
  const [, setSelectedTab] = useAtom(tabAtom);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<EmailListRule[]>([
    { type: "sender", value: "" },
  ]);

  const handleAddRule = () => {
    setRules([...rules, { type: "sender", value: "" }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (
    index: number,
    field: keyof EmailListRule,
    value: string,
  ) => {
    const updated = [...rules];
    (updated[index] as any)[field] = value;
    setRules(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for your custom list.",
      });
      return;
    }

    const validRules = rules.filter((r) => r.value.trim().length > 0);

    const newList: CustomEmailList = {
      id: `list-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      rules: validRules,
      manualThreadIds: [],
    };

    setCustomLists([...customLists, newList]);
    setSelectedTab(`List: ${newList.name}` as any);
    setOpen(false);

    // Reset form
    setName("");
    setDescription("");
    setRules([{ type: "sender", value: "" }]);

    toast({
      title: "List created",
      description: `Created list "${newList.name}" with ${validRules.length} matching rule(s).`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-sky-500" />
            Create Custom Email List
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="list-name">List Name</Label>
            <Input
              id="list-name"
              placeholder="e.g. Investor, VIP Clients, News"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="list-desc">Description (Optional)</Label>
            <Input
              id="list-desc"
              placeholder="What emails belong in this list?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>List Rules</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRule}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Rule
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Define rules to automatically match emails into this list.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select
                    value={rule.type}
                    onValueChange={(val) =>
                      handleRuleChange(idx, "type", val as any)
                    }
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sender">Sender</SelectItem>
                      <SelectItem value="domain">Domain</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="keyword">Keyword</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder={
                      rule.type === "domain"
                        ? "e.g. acme.com"
                        : rule.type === "sender"
                        ? "e.g. john@fund.com"
                        : "value"
                    }
                    value={rule.value}
                    onChange={(e) =>
                      handleRuleChange(idx, "value", e.target.value)
                    }
                    className="h-8 text-xs flex-1"
                  />

                  {rules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRule(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create List</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
