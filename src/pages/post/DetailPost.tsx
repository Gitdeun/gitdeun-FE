import { useParams } from "react-router-dom";
import { Card, Text, Title, Badge, Group, Avatar } from "@mantine/core";
import { Calendar, Users } from "lucide-react";
import { postsData } from "../../data/postsData";

const toKoreanStatus: Record<string, string> = {
  FORTHCOMING: "모집예정",
  RECRUITING: "모집중",
  CLOSED: "마감",
  COMPLETED: "완료",
};

const statusColor: Record<string, string> = {
  FORTHCOMING: "gray",
  RECRUITING: "blue",
  CLOSED: "red",
  COMPLETED: "teal",
};

const LANGUAGE_LABELS: Record<string, string> = {
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  PYTHON: "Python",
  JAVA: "Java",
  KOTLIN: "Kotlin",
  GO: "Go",
  RUST: "Rust",
  CPP: "C++",
  CSHARP: "C#",
  SWIFT: "Swift",
  DART: "Dart",
  PHP: "PHP",
  RUBY: "Ruby",
  R: "R",
};
const FIELD_LABELS: Record<string, string> = {
  FRONTEND: "프론트엔드",
  BACKEND: "백엔드",
  FULLSTACK: "풀스택",
  ANDROID: "안드로이드",
  IOS: "iOS",
  DATA: "데이터",
  DEVOPS: "DevOps",
  AI: "AI/ML",
  EMBEDDED: "임베디드",
  GAME: "게임",
  SECURITY: "보안",
  ETC: "기타",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export default function DetailPost() {
  const { id } = useParams();
  const post = postsData.find((p) => p.id.toString() === id);

  if (!post) return <Text>해당 게시글을 찾을 수 없습니다.</Text>;

  return (
    <div className="max-w-5xl px-6 py-10 mx-auto">
      <div className="flex items-start justify-between gap-3">
        <Title order={1} className="!text-3xl !font-extrabold !leading-tight">
          {post.title}
        </Title>
        <Badge
          variant="light"
          color={statusColor[post.status] ?? "gray"}
          size="xl" 
          radius="xl"
        >
          {toKoreanStatus[post.status] ?? post.status}
        </Badge>
      </div>

      <Group gap="xs" className="mt-2 mb-6 text-sm text-gray-600">
        <Avatar src={post.recruiterProfileImage} size="sm" radius="xl" />
        <Text>{post.recruiterNickname}</Text>
        <span>·</span>
        <Text>2171123@hansung.ac.kr</Text>
      </Group>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <Card withBorder padding="lg" radius="lg" className="shadow-none">
          <div className="flex items-start gap-3">
            <Calendar size={20} className="mt-1" />
            <div>
              <Text fw={700} className="mb-2">
                모집 기간
              </Text>
              <div className="text-gray-700">
                <div>시작: {fmt(post.startAt)}</div>
                <div>마감: {fmt(post.endAt)}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card withBorder padding="lg" radius="lg" className="shadow-none">
          <div className="flex items-start gap-3">
            <Users size={20} className="mt-1" />
            <div>
              <Text fw={700} className="mb-2">
                팀 규모
              </Text>
              <div className="text-gray-700">
                <div>총 인원: {post.teamSizeTotal}명</div>
                <div>모집: {post.recruitQuota}명</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card withBorder padding="lg" radius="lg" className="mb-8 shadow-none">
        <Text fw={700} className="mb-3">
          프로젝트 소개
        </Text>
        <Text className="leading-7 text-gray-800">{post.content}</Text>
      </Card>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px]">🔷</span>
          <Text fw={700}>개발 언어</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {post.languageTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm text-blue-700 border border-blue-200 rounded-full bg-blue-50"
            >
              {LANGUAGE_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px]">🟢</span>
          <Text fw={700}>개발 분야</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {post.fieldTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm border rounded-full bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              {FIELD_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      {post.images?.length > 0 && (
        <>
          <Text fw={700} className="mb-3">
            프로젝트 이미지
          </Text>
          <div className="grid grid-cols-2 gap-5 mb-10 sm:grid-cols-3 lg:grid-cols-4">
            {post.images.map((img) => (
              <img
                key={img.imageId}
                src={img.imageUrl}
                alt="프로젝트 이미지"
                className="object-contain w-full h-34 rounded-xl"
              />
            ))}
          </div>
        </>
      )}

      <div className="text-center">
        <button className="px-6 py-2 font-semibold text-white bg-blue-400 rounded-xl hover:bg-blue-500">
          지원하기
        </button>
      </div>
    </div>
  );
}
