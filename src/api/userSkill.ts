import httpClient from "./httpClient";

interface UpdateSkillsPayload {
  categorizedSkills: {
    LANGUAGE: string[];
  };
}

// 내 스킬 조회
export const skillList = async (): Promise<string[]> => {
  const res = await httpClient.get("/skills/me");
  return res.data.categorizedSkills.LANGUAGE;
};

// 전체 스킬 조회
export const fetchSkills = async (): Promise<string[]> => {
  const res = await httpClient.get("/skills");
  return res.data.categorizedSkills.LANGUAGE;
};

// 내 스킬 업데이트
export const updateUserSkills = async (languages: string[]): Promise<void> => {
  const payload: UpdateSkillsPayload = {
    categorizedSkills: { LANGUAGE: languages },
  };
  await httpClient.post("/skills/me", payload);
};
