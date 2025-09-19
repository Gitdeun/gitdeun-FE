// constants/recruitmentEnums.ts
export const AREA_MAP: Record<string, string> = {
  "프론트엔드": "FRONTEND",
  "백엔드": "BACKEND",
  "풀스택": "FULLSTACK",
  "안드로이드": "ANDROID",
  "IOS": "IOS",
  "데이터": "DATA",
  "DevOps": "DEVOPS",
  "AI": "AI",
  "임베디드": "EMBEDDED",
  "게임": "GAME",
  "보안": "SECURITY",
  "기타": "ETC",
};

export const SKILL_MAP: Record<string, string> = {
  "JavaScript": "JAVASCRIPT",
  "TypeScript": "TYPESCRIPT",
  "Python": "PYTHON",
  "Java": "JAVA",
  "Kotlin": "KOTLIN",
  "Go": "GO",
  "Rust": "RUST",
  "C++": "CPP",
  "C#": "CSHARP",
  "Swift": "SWIFT",
  "Dart": "DART",
  "PHP": "PHP",
  "Ruby": "RUBY",
  "R": "R",
};

export const STATUS_LABELS: Record<string, string> = {
  FORTHCOMING: "모집 예정",
  RECRUITING: "모집 중",
  CLOSED: "마감",
  COMPLETED: "완료",
};