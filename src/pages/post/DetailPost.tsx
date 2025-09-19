// src/pages/post/DetailPost.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Text, Title, Badge, Group, Avatar, Loader, Modal, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Calendar, Users } from "lucide-react";
import { AREA_MAP, SKILL_MAP, STATUS_LABELS } from "../../constants/recruitmentEnums";
import { getRecruitmentById, applyRecruitment } from "../../api/recruitments";
import type { RecruitmentDetail, ApplyResponse } from "../../api/recruitments";
import ApplyConfirmModal from "./detailpost/ApplyConfirmModal";
import { getUserInfo } from "../../api/auth";
import ApplicantsManager from "./Applicant/Manager";
import { withdrawApplication } from "../../api/userRecruitments";

type Me = {
  userId: number;
  name: string;
  email: string;
  nickname: string;
  profileImage?: string | null;
  role: string;
};

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

// 로컬: 어떤 모집공고에 지원했는지 + 매핑(철회용)
const APPLIED_KEY = "appliedRecruitmentIds";
const APPLIED_MAP_KEY = "appliedRecruitmentApplicationMap";

const loadAppliedIds = (): number[] => {
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveAppliedIds = (ids: number[]) => {
  localStorage.setItem(APPLIED_KEY, JSON.stringify(ids));
};

const loadAppliedMap = (): Record<number, number> => {
  try {
    const raw = localStorage.getItem(APPLIED_MAP_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return typeof obj === "object" && obj ? obj : {};
  } catch {
    return {};
  }
};

const saveAppliedMap = (map: Record<number, number>) => {
  localStorage.setItem(APPLIED_MAP_KEY, JSON.stringify(map));
};

const gmailCompose = (to: string, subject: string, body?: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}${
    body ? `&body=${encodeURIComponent(body)}` : ""
  }`;

export default function DetailPost() {
  const { id } = useParams<{ id: string }>();

  // ✅ StrictMode 중복 호출 방지용 타이머 ref
  const fetchTimerRef = useRef<number | null>(null);

  const [post, setPost] = useState<RecruitmentDetail | null>(null);

  const [me, setMe] = useState<Me | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const [hasApplied, setHasApplied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [myApplicationId, setMyApplicationId] = useState<number | null>(null);

  // ✅ 상세 조회(StrictMode 대응: setTimeout으로 한 틱 지연)
  useEffect(() => {
    if (!id) return;

    // 기존 예약된 요청 취소
    if (fetchTimerRef.current != null) {
      clearTimeout(fetchTimerRef.current);
    }

    setLoading(true);
    setError(null);

    fetchTimerRef.current = window.setTimeout(async () => {
      try {
        const data = await getRecruitmentById(id);
        setPost(data);
      } catch (e: any) {
        setError(e?.message ?? "상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => {
      if (fetchTimerRef.current != null) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, [id]);

  // 현재 사용자
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setUserLoading(true);
        const data = await getUserInfo();
        if (alive) setMe(data);
      } catch {
        if (alive) setMe(null);
      } finally {
        if (alive) setUserLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 공고 로드 후 로컬 상태 반영(이미 지원 여부 + applicationId)
  useEffect(() => {
    if (!post) return;
    const ids = loadAppliedIds();
    setHasApplied(ids.includes(post.id));

    const map = loadAppliedMap();
    setMyApplicationId(typeof map[post.id] === "number" ? map[post.id] : null);
  }, [post?.id]);

  // 지원하기
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
      const res: ApplyResponse = await applyRecruitment(recruitmentId, {
        appliedField,
        message,
      });

      // 로컬 “이미 지원함” 표시
      const rid = Number(recruitmentId);
      const ids = loadAppliedIds();
      if (!ids.includes(rid)) {
        saveAppliedIds([...ids, rid]);
      }
      setHasApplied(true);

      // 응답에 applicationId 있으면 철회 맵 저장
      const appId =
        res && typeof (res as any).applicationId === "number"
          ? ((res as any).applicationId as number)
          : null;

      if (appId != null) {
        const map = loadAppliedMap();
        map[rid] = appId;
        saveAppliedMap(map);
        setMyApplicationId(appId);
      }

      notifications.show({
        color: "teal",
        title: "지원 완료",
        message: "성공적으로 지원되었습니다.",
      });
      setApplyOpen(false);
    } catch (e: any) {
      notifications.show({
        color: "red",
        title: "지원 실패",
        message: e?.response?.data?.message ?? "지원에 실패했습니다.",
      });
    } finally {
      setApplyLoading(false);
    }
  };

  // 신청 철회
  const handleWithdraw = async () => {
    if (!post) return;

    if (myApplicationId == null) {
      notifications.show({
        color: "yellow",
        title: "철회 불가",
        message: "신청 정보가 확인되지 않았습니다. 다시 시도해 주세요.",
      });
      return;
    }

    try {
      setWithdrawing(true);
      await withdrawApplication(myApplicationId);

      // 로컬 동기화
      const ids = loadAppliedIds().filter((x) => x !== post.id);
      saveAppliedIds(ids);

      const map = loadAppliedMap();
      delete map[post.id];
      saveAppliedMap(map);

      setHasApplied(false);
      setMyApplicationId(null);
      setWithdrawOpen(false);

      notifications.show({
        color: "teal",
        title: "철회 완료",
        message: "신청이 철회되었습니다.",
      });
    } catch (e: any) {
      notifications.show({
        color: "red",
        title: "철회 실패",
        message: e?.response?.data?.message ?? "신청 철회에 실패했습니다.",
      });
    } finally {
      setWithdrawing(false);
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

  const isOwner = !!me && me.name === post.recruiterNickname;

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
            <a
              href={gmailCompose(post.contactEmail, `[${post.title}] 공고 문의드립니다`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline"
            >
              {post.contactEmail}
            </a>
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
              <Text fw={700} className="mb-2">팀 규모</Text>
              <div className="text-gray-700">
                <div>총 인원: {post.teamSizeTotal}명</div>
                <div>모집: {post.recruitQuota}명</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card withBorder padding="lg" radius="lg" className="mb-8 shadow-none">
        <Text fw={700} className="mb-3">프로젝트 소개</Text>
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
              className="px-3 py-1 text-sm border rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              {AREA_LABEL_MAP[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      {Array.isArray(post.images) && post.images.length > 0 && (
        <>
          <Text fw={700} className="mb-3">프로젝트 이미지</Text>
          <div className="grid grid-cols-2 gap-5 mb-10 sm:grid-cols-3 lg:grid-cols-4">
            {post.images.map((img) => (
              <img
                key={img.imageId}
                src={img.imageUrl}
                alt="프로젝트 이미지"
                className="h-[136px] w-full rounded-xl object-contain"
              />
            ))}
          </div>
        </>
      )}

      {isOwner ? (
        <div className="mt-6">
          <ApplicantsManager recruitmentId={post.id} />
        </div>
      ) : (
        <>
          {hasApplied ? (
            <>
              <Card withBorder padding="lg" radius="lg" className="shadow-none">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <div className="text-center sm:text-left">
                    <div className="font-semibold text-blue-700">이미 지원했습니다</div>
                    <div className="text-sm text-gray-600">
                      마감일 {fmt(post.endAt)} · 필요 시 신청을 철회할 수 있어요.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                      disabled
                    >
                      지원 완료
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800"
                      onClick={() => setWithdrawOpen(true)}
                    >
                      신청 철회
                    </button>
                  </div>
                </div>
              </Card>

              <Modal
                opened={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                centered
                title={<div className="font-bold">신청을 철회하시겠습니까?</div>}
              >
                <div className="space-y-3">
                  <Text className="text-gray-700">철회 후 다시 신청할 수 있습니다.</Text>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="default"
                      className="!rounded-xl"
                      onClick={() => setWithdrawOpen(false)}
                    >
                      유지
                    </Button>
                    <Button
                      color="red"
                      className="!rounded-xl"
                      onClick={handleWithdraw}
                      loading={withdrawing}
                      loaderProps={{ type: "dots" }}
                    >
                      철회하기
                    </Button>
                  </div>
                </div>
              </Modal>
            </>
          ) : (
            <>
              <div className="text-center">
                <button
                  className="px-6 py-2 font-semibold text-white bg-blue-400 rounded-xl hover:bg-blue-500"
                  onClick={() => setApplyOpen(true)}
                  disabled={userLoading}
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
            </>
          )}
        </>
      )}
    </div>
  );
}
