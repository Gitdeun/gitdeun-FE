import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
});

interface UpdateSkillsPayload {
  categorizedSkills: {
    LANGUAGE: string[];
  };
}


export const fetchSkills = async (): Promise<string[]> => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error("인증 토큰을 찾을 수 없습니다.");
  }

  const response = await API.get('/skills', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return response.data.categorizedSkills.LANGUAGE;
};

export const updateUserSkills = async (languages: string[]): Promise<void> => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error("인증 토큰을 찾을 수 없습니다.");
  }

  const payload: UpdateSkillsPayload = {
    categorizedSkills: {
      LANGUAGE: languages,
    },
  };

  await API.post('/skills/me', payload, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
};

