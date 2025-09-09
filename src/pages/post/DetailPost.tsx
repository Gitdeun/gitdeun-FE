import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Text, Title, Badge, Group, Avatar, Loader } from "@mantine/core";
import { Calendar, Users } from "lucide-react";
import { AREA_MAP, SKILL_MAP, STATUS_LABELS } from "../../constants/recruitmentEnums";
import { getRecruitmentById } from "../../api/recruitments";
import { applyRecruitment } from "../../api/recruitments";         
import type { RecruitmentDetail } from "../../api/recruitments";    
import ApplyConfirmModal from "./detailpost/ApplyConfirmModal";     

const invert = (obj: Record<string, string>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));

const AREA_LABEL_MAP = invert(AREA_MAP);  
const SKILL_LABEL_MAP = invert(SKILL_MAP);

const statusColor: Record<string, string> = {
  FORTHCOMING: "gray",
  RECRUITING: "blue",
  CLOSED: "red",
  COMPLETED: "teal",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export default function DetailPost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<RecruitmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) throw new Error("잘못된 접근입니다.");
        const data = await getRecruitmentById(id);
        if (alive) setPost(data);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "상세 정보를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleApplyConfirm = async ({
    recruitmentId,
    appliedField,
    message,
  }: {
    recruitmentId: number | string;
    appliedField: string;
    message: string;
  }) => {
    try {
      setApplyLoading(true);
      await applyRecruitment(recruitmentId, {
        appliedField,          
        message,               
      });

      alert("지원이 완료되었습니다."); 
      setApplyOpen(false);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        alert("로그인이 필요합니다.");
      } else if (e?.response?.status === 400) {
        alert(e?.response?.data?.message ?? "요청 형식이 올바르지 않습니다.");
      } else {
        alert(e?.response?.data?.message ?? "지원에 실패했습니다.");
      }
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader />
      </div>
    );
  }

  if (error || !post) {
    return <Text>해당 게시글을 찾을 수 없습니다. {error ? `(${error})` : ""}</Text>;
  }

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
          {STATUS_LABELS[post.status] ?? post.status}
        </Badge>
      </div>

      <Group gap="xs" className="mt-2 mb-6 text-sm text-gray-600">
        <Avatar src={post.recruiterProfileImage ?? undefined} size="sm" radius="xl" />
        <Text>{post.recruiterNickname}</Text>
        {post.contactEmail ? (
          <>
            <span>·</span>
            <Text>{post.contactEmail}</Text>
          </>
        ) : null}
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
              {SKILL_LABEL_MAP[tag] ?? tag}
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
              {AREA_LABEL_MAP[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      {Array.isArray(post.images) && post.images.length > 0 && (
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
                className="object-contain w-full rounded-xl"
                style={{ height: 136 }}
              />
            ))}
          </div>
        </>
      )}

      <div className="text-center">
        <button
          className="px-6 py-2 font-semibold text-white bg-blue-400 rounded-xl hover:bg-blue-500"
          onClick={() => setApplyOpen(true)}
        >
          지원하기
        </button>
      </div>

      <ApplyConfirmModal
        opened={applyOpen}
        onClose={() => setApplyOpen(false)}
        recruitmentId={post.id}
        title={post.title}
        fieldCandidates={post.fieldTags}           
        fieldLabelMap={AREA_LABEL_MAP}            
        onConfirm={handleApplyConfirm}
        loading={applyLoading}
      />
    </div>
  );
}
