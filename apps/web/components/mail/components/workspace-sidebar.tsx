```tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { openCreateWorkspaceOpenAtom } from "@/utils/store";
import { useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { WorkspaceSelector } from "./workspace-selector";

const userNavigation = [
  { name: "Usage"