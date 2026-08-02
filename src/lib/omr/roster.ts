/**
 * Minimal CSV parser + validator for the batch roster import feature —
 * deliberately no external CSV library dependency, matching the original
 * desktop app (kept as-is in the port for consistency, not because pkg
 * bundle size matters here anymore). Ported verbatim from OMNI OMR Suite's
 * roster.js. Only handles what a roster file actually needs: two columns
 * (name, roll number), optionally quoted fields, comma-separated.
 */

// Parses one CSV line into an array of field strings, honoring basic
// double-quote quoting ("a, b" -> one field "a, b"; "" inside a quoted
// field -> a literal quote). Good enough for roster files exported by
// Excel/Google Sheets/Google Forms, not a full RFC 4180 implementation.
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

const NAME_HEADER_ALIASES = ["name", "studentname", "student name", "student"];
const ROLL_HEADER_ALIASES = ["rollnumber", "roll number", "rollno", "roll no", "roll"];

function findColumnIndex(headerRow: string[], aliases: string[]): number {
  const normalized = headerRow.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

export type RosterEntry = { name: string; rollNumber: string };
export type RosterParseResult = { roster: RosterEntry[]; errors: string[] };

/**
 * Parses + validates a roster CSV's raw text.
 * Expects a header row containing a name column and a roll-number column
 * (flexible naming — see the alias lists above), then one row per student.
 * rollNumber is normalized to an 8-digit, zero-padded string on success.
 * If there are any errors, roster is still returned (for preview) but the
 * caller should refuse to generate a batch until errors is empty.
 */
export function parseRosterCsv(rawText: string): RosterParseResult {
  const lines = rawText.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  if (lines.length === 0) {
    return { roster: [], errors: ["The CSV file is empty."] };
  }

  const header = parseCsvLine(lines[0]);
  const nameIdx = findColumnIndex(header, NAME_HEADER_ALIASES);
  const rollIdx = findColumnIndex(header, ROLL_HEADER_ALIASES);
  if (nameIdx === -1 || rollIdx === -1) {
    return {
      roster: [],
      errors: [
        `Couldn't find both a "Name" and a "Roll Number" column in the header row (found: ${header.join(", ") || "(empty)"}). ` +
          `Download the template for the exact column names to use.`,
      ],
    };
  }

  const roster: RosterEntry[] = [];
  const seenRolls = new Map<string, number>(); // rollNumber -> first row number it appeared on

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // 1-based, matching what a spreadsheet would show
    const fields = parseCsvLine(lines[i]);
    const name = (fields[nameIdx] || "").trim();
    const rollRaw = (fields[rollIdx] || "").trim();

    if (!name) {
      errors.push(`Row ${rowNum}: name is blank.`);
      continue;
    }
    if (!/^\d{1,8}$/.test(rollRaw)) {
      errors.push(`Row ${rowNum} (${name}): roll number "${rollRaw}" must be numeric, 1-8 digits.`);
      continue;
    }
    const rollNumber = rollRaw.padStart(8, "0");
    if (seenRolls.has(rollNumber)) {
      errors.push(`Row ${rowNum} (${name}): roll number ${rollRaw} is a duplicate of row ${seenRolls.get(rollNumber)}.`);
      continue;
    }
    seenRolls.set(rollNumber, rowNum);
    roster.push({ name, rollNumber });
  }

  if (roster.length === 0 && errors.length === 0) {
    errors.push("No student rows found below the header.");
  }

  return { roster, errors };
}

export const TEMPLATE_CSV = "Name,Roll Number\nAnita Sharma,10234501\nRavi Kumar,10234502\n";
