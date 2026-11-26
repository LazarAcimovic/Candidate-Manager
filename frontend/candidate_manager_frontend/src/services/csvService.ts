import type { Candidate } from "../models/CandidateModel";

const HEADERS = [
  "Full Name",
  "Date of Birth",
  "Email",
  "Contact Number",
  "Skills",
];

const escapeCell = (value: string): string => {
  // Spreadsheets run cells starting with these characters as formulas.
  // A leading tab keeps them as text, including "+381..." phone numbers.
  const safe = /^[=+\-@\t\r]/.test(value) ? `\t${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

// Turns a search filter into text that is safe to use in a filename.
const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/#/g, "sharp")
    .replace(/\+/g, "p")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");

export const csvService = {
  buildFileName: (filters: string[]): string => {
    // Capped so that many filters cannot make the filename too long.
    const filterPart = filters.map(toSlug).filter(Boolean).join("-").slice(0, 80);
    // The "sv-SE" locale formats the local date as YYYY-MM-DD.
    const date = new Date().toLocaleDateString("sv-SE");

    return `${["candidates", filterPart, date].filter(Boolean).join("-")}.csv`;
  },

  buildCandidatesCsv: (candidates: Candidate[]): string => {
    const rows = candidates.map((c) => [
      c.fullName,
      c.dateOfBirth,
      c.email,
      c.contactNumber,
      c.skillNames.join("; "),
    ]);

    return [HEADERS, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");
  },

  downloadCandidates: (candidates: Candidate[], filters: string[]): void => {
    // The byte order mark makes Excel read the file as UTF-8 (č, ć, š, ž).
    const csv = csvService.buildCandidatesCsv(candidates);
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = csvService.buildFileName(filters);
    link.click();

    URL.revokeObjectURL(url);
  },
};
