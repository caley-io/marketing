import { mails } from "@/components/mail/data";
import { GMailMessage } from "@/utils/gmail/types";
import { atom, useAtom } from "jotai";

type Config = {
  mail: GMailMessage;
  selected: GMailMessage["id"] | null;
};

export const configAtom = atom<Config>({
  mail: mails[0] as GMailMessage,
  selected: mails[0].id,
});
