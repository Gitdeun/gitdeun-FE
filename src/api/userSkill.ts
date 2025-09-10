import httpClient from "./httpClient";

interface UpdateSkillsPayload {
  categorizedSkills: { LANGUAGE: string[] };
}

const normalizeToSelectedNames = (raw: any): string[] => {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v === "string") {
      out.push(v);
    } else if (v && typeof v === "object") {
      if ("selected" in v) {
        if (v.selected && typeof v.name === "string") out.push(v.name);
      } else if (typeof v.name === "string") {
        out.push(v.name);
      }
    }
  }
  return Array.from(new Set(out));
};

export const skillList = async (): Promise<string[]> => {
  const res = await httpClient.get("/skills/me");
  const raw = res.data?.categorizedSkills?.LANGUAGE ?? [];
  return normalizeToSelectedNames(raw);
};

export const fetchSkills = async (): Promise<string[]> => {
  const res = await httpClient.get("/skills");
  const raw = res.data?.categorizedSkills?.LANGUAGE ?? [];
  return normalizeToSelectedNames(raw);
};

export const updateUserSkills = async (languages: string[]): Promise<void> => {
  const payload: UpdateSkillsPayload = { categorizedSkills: { LANGUAGE: languages } };
  await httpClient.post("/skills/me", payload);
};
