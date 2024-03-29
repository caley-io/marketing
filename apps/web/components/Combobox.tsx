"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Combobox(props: {
  options: { value: string; label: string }[];
  placeholder: string;
  emptyText: string;
  value: string;
  onChangeValue: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  const { value, onChangeValue, search, onSearch, placeholder, emptyText } =
    props;
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState(props.options);

  // Remove duplicate values
  React.useEffect(() => {
    const values = new Set(props.options.map((option) => option.value));
    setData(
      Array.from(values).map((value) => ({
        value,
        label: props.options.find((option) => option.value === value)?.label!,
      })),
    );
  }, [props]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[500px] justify-between"
        >
          {value
            ? data.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-2">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={onSearch}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          {data.length ? (
            <CommandGroup>
              {data.map((options) => (
                <CommandItem
                  key={options.value}
                  value={options.value}
                  onSelect={(currentValue) => {
                    onChangeValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === options.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {options.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
