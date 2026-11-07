/**
 * Natural Language Understanding (NLU) utility for date detection in email composition.
 * Detects relative ("today", "tomorrow", "this Friday", "next Monday", "in 3 days")
 * and absolute date expressions ("Nov 15th", "December 25", "2026-11-10").
 */

export interface DateEntity {
  text: string;              // The matched phrase in the text (e.g. "tomorrow", "next Friday")
  targetDate: string;        // ISO format YYYY-MM-DD
  formattedDisplay: string;  // Human friendly, e.g. "Friday, Nov 13, 2026"
  confidence: number;        // Score from 0.0 to 1.0
  index: number;             // Character index where the phrase starts
}

const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function formatIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatFriendlyDate(dateStr: string): string {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Extracts date expressions from text and resolves them to exact YYYY-MM-DD target dates.
 */
export function extractDateEntities(
  text: string,
  referenceDate: Date = new Date(),
): DateEntity[] {
  if (!text || typeof text !== "string") return [];

  const entities: DateEntity[] = [];
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  // 1. "day after tomorrow"
  const dayAfterTomorrowRegex = /\b(the\s+)?day\s+after\s+tomorrow\b/gi;
  let match: RegExpExecArray | null;
  while ((match = dayAfterTomorrowRegex.exec(text)) !== null) {
    const target = new Date(ref);
    target.setDate(target.getDate() + 2);
    const iso = formatIsoDate(target);
    entities.push({
      text: match[0],
      targetDate: iso,
      formattedDisplay: formatFriendlyDate(iso),
      confidence: 0.98,
      index: match.index,
    });
  }

  // 2. "today", "tonight"
  const todayRegex = /\b(today|tonight)\b/gi;
  while ((match = todayRegex.exec(text)) !== null) {
    const iso = formatIsoDate(ref);
    entities.push({
      text: match[0],
      targetDate: iso,
      formattedDisplay: formatFriendlyDate(iso),
      confidence: 0.95,
      index: match.index,
    });
  }

  // 3. "tomorrow" (excluding "day after tomorrow")
  const tomorrowRegex = /\b(?<!after\s+)tomorrow\b/gi;
  while ((match = tomorrowRegex.exec(text)) !== null) {
    // Check if part of "day after tomorrow"
    const isPartOfDayAfter = entities.some(
      (e) =>
        e.text.toLowerCase().includes("day after tomorrow") &&
        match!.index >= e.index &&
        match!.index < e.index + e.text.length,
    );
    if (!isPartOfDayAfter) {
      const target = new Date(ref);
      target.setDate(target.getDate() + 1);
      const iso = formatIsoDate(target);
      entities.push({
        text: match[0],
        targetDate: iso,
        formattedDisplay: formatFriendlyDate(iso),
        confidence: 0.95,
        index: match.index,
      });
    }
  }

  // 4. "yesterday"
  const yesterdayRegex = /\byesterday\b/gi;
  while ((match = yesterdayRegex.exec(text)) !== null) {
    const target = new Date(ref);
    target.setDate(target.getDate() - 1);
    const iso = formatIsoDate(target);
    entities.push({
      text: match[0],
      targetDate: iso,
      formattedDisplay: formatFriendlyDate(iso),
      confidence: 0.9,
      index: match.index,
    });
  }

  // 5. "in N days" or "in a day"
  const inDaysRegex = /\bin\s+(\d+|a|an)\s+days?\b/gi;
  while ((match = inDaysRegex.exec(text)) !== null) {
    const countStr = match[1].toLowerCase();
    const count = countStr === "a" || countStr === "an" ? 1 : parseInt(countStr, 10);
    const target = new Date(ref);
    target.setDate(target.getDate() + count);
    const iso = formatIsoDate(target);
    entities.push({
      text: match[0],
      targetDate: iso,
      formattedDisplay: formatFriendlyDate(iso),
      confidence: 0.92,
      index: match.index,
    });
  }

  // 6. "in N weeks" or "in a week"
  const inWeeksRegex = /\bin\s+(\d+|a|an)\s+weeks?\b/gi;
  while ((match = inWeeksRegex.exec(text)) !== null) {
    const countStr = match[1].toLowerCase();
    const count = countStr === "a" || countStr === "an" ? 1 : parseInt(countStr, 10);
    const target = new Date(ref);
    target.setDate(target.getDate() + count * 7);
    const iso = formatIsoDate(target);
    entities.push({
      text: match[0],
      targetDate: iso,
      formattedDisplay: formatFriendlyDate(iso),
      confidence: 0.9,
      index: match.index,
    });
  }

  // 7. Days of week: e.g. "this Monday", "next Friday", "on Tuesday", "coming Wednesday", or just "Friday"
  const dowPattern = Object.keys(DAYS_OF_WEEK).join("|");
  const dowRegex = new RegExp(
    `\\b(this|next|coming|on)?\\s*(${dowPattern})\\b`,
    "gi",
  );
  while ((match = dowRegex.exec(text)) !== null) {
    const prefix = (match[1] || "").toLowerCase().trim();
    const dayName = match[2].toLowerCase();
    const targetDayOfWeek = DAYS_OF_WEEK[dayName];

    if (targetDayOfWeek !== undefined) {
      const currentDayOfWeek = ref.getDay();
      let diff = targetDayOfWeek - currentDayOfWeek;
      const nearestUpcoming = diff <= 0 ? diff + 7 : diff;

      if (prefix === "next") {
        diff = nearestUpcoming + 7;
      } else {
        diff = nearestUpcoming;
      }

      const target = new Date(ref);
      target.setDate(target.getDate() + diff);
      const iso = formatIsoDate(target);
      entities.push({
        text: match[0].trim(),
        targetDate: iso,
        formattedDisplay: formatFriendlyDate(iso),
        confidence: 0.88,
        index: match.index,
      });
    }
  }

  // 8. Month + Day: e.g. "Nov 15", "November 15th", "Nov 15th, 2026", "15th of November"
  const monthPattern = Object.keys(MONTHS).join("|");
  // Pattern A: "Nov 15th" or "November 15, 2026"
  const monthDayRegex = new RegExp(
    `\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`,
    "gi",
  );
  while ((match = monthDayRegex.exec(text)) !== null) {
    const monthName = match[1].toLowerCase();
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : ref.getFullYear();
    const month = MONTHS[monthName];

    if (month !== undefined && day >= 1 && day <= 31) {
      const target = new Date(year, month, day);
      const iso = formatIsoDate(target);
      entities.push({
        text: match[0],
        targetDate: iso,
        formattedDisplay: formatFriendlyDate(iso),
        confidence: 0.95,
        index: match.index,
      });
    }
  }

  // Pattern B: "15th of November" or "15 Nov"
  const dayMonthRegex = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthPattern})(?:,?\\s*(\\d{4}))?\\b`,
    "gi",
  );
  while ((match = dayMonthRegex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const year = match[3] ? parseInt(match[3], 10) : ref.getFullYear();
    const month = MONTHS[monthName];

    if (month !== undefined && day >= 1 && day <= 31) {
      const target = new Date(year, month, day);
      const iso = formatIsoDate(target);
      entities.push({
        text: match[0],
        targetDate: iso,
        formattedDisplay: formatFriendlyDate(iso),
        confidence: 0.95,
        index: match.index,
      });
    }
  }

  // 9. ISO or Numeric: "2026-11-15" or "11/15/2026"
  const numericDateRegex = /\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;
  while ((match = numericDateRegex.exec(text)) !== null) {
    if (match[1] && match[2] && match[3]) {
      // YYYY-MM-DD
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const d = parseInt(match[3], 10);
      const target = new Date(y, m, d);
      const iso = formatIsoDate(target);
      entities.push({
        text: match[0],
        targetDate: iso,
        formattedDisplay: formatFriendlyDate(iso),
        confidence: 0.99,
        index: match.index,
      });
    } else if (match[4] && match[5]) {
      // MM/DD or MM/DD/YYYY
      const m = parseInt(match[4], 10) - 1;
      const d = parseInt(match[5], 10);
      let y = match[6] ? parseInt(match[6], 10) : ref.getFullYear();
      if (y < 100) y += 2000;
      if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
        const target = new Date(y, m, d);
        const iso = formatIsoDate(target);
        entities.push({
          text: match[0],
          targetDate: iso,
          formattedDisplay: formatFriendlyDate(iso),
          confidence: 0.9,
          index: match.index,
        });
      }
    }
  }

  // Deduplicate and resolve overlaps by prioritizing longer and earlier matches
  entities.sort((a, b) => a.index - b.index || b.text.length - a.text.length);

  const nonOverlapping: DateEntity[] = [];
  for (const entity of entities) {
    const overlaps = nonOverlapping.some((existing) => {
      const existingEnd = existing.index + existing.text.length;
      const entityEnd = entity.index + entity.text.length;
      return (
        (entity.index >= existing.index && entity.index < existingEnd) ||
        (existing.index >= entity.index && existing.index < entityEnd)
      );
    });

    if (!overlaps) {
      nonOverlapping.push(entity);
    }
  }

  return nonOverlapping;
}

/**
 * Returns formatted availability proposal text ready to be inserted into an email draft.
 */
export function generateAvailabilitySnippet(
  targetDate: string,
  freeTimeSlots: string[] = ["10:00 AM - 11:30 AM", "2:00 PM - 4:00 PM"],
): string {
  const friendly = formatFriendlyDate(targetDate);
  if (freeTimeSlots.length === 0) {
    return `I am available anytime on ${friendly}. Let me know what time works best for you!`;
  }
  return `I am available on ${friendly} during the following times:\n${freeTimeSlots.map((s) => `• ${s}`).join("\n")}\nDoes any of these work for you?`;
}
