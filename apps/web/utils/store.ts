import { mails } from "@/components/mail/data";
import { GMailMessage, GMailThread } from "@/utils/gmail/types";
import { atom, useAtom } from "jotai";

type Config = {
  mail: GMailThread | null;
  selected: GMailThread["id"] | null;
};

export const configAtom = atom<Config>({
  mail: null,
  selected: null,
});
