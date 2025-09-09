// src/pages/post/PostList.tsx
import { useEffect, useMemo, useState } from "react";
import { Chip, Group, Loader, TextInput, Tooltip, Badge } from "@mantine/core";
import { Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import PostCard from "./postlist/PostCard";
import { AREA_MAP, SKILL_MAP, STATUS_LABELS } from "../../constants/recruitmentEnums";
import { getRecruitments, getRecommendedRecruitments } from "../../api/recruitments";
import type { Page, Recruitment } from "../../api/recruitments";

const invert = (obj: Record<string, string>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));

const AREA_LABEL_MAP = invert(AREA_MAP);
const SKILL_LABEL_MAP = invert(SKILL_MAP);

export default function PostList() {
  const [mode, setMode] = useState<"all" | "rec">("all");
  const base = "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition border";
  const active = "bg-sky-300 text-white border-sky-300 shadow-sm";
  const inactive = "bg-white text-gray-700 border-gray-200 hover:border-gray-300";

  const [status, setStatus] = useState<keyof typeof STATUS_LABELS | "">("");
  const [fields, setFields] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [data, setData] = useState<Page<Recruitment> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qDebounced, setQDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const areaOptions = useMemo(
    () => Object.entries(AREA_MAP).map(([ko, en]) => ({ label: ko, value: en })),
    []
  );
  const skillOptions = useMemo(
    () => Object.entries(SKILL_MAP).map(([ko, en]) => ({ label: ko, value: en })),
    []
  );

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        if (mode === "rec") {
          const result = await getRecommendedRecruitments({ page, size });
          setData(result);
        } else {
          const result = await getRecruitments({
            status: status || undefined,
            field: fields.length ? fields : undefined,
            language: skills.length ? skills : undefined,
            q: qDebounced || undefined,
            page,
            size,
          });
          setData(result);
        }
      } catch (e: any) {
        setError(e?.message ?? "불러오기 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [mode, status, fields, skills, qDebounced, page, size]);

  const totalFound = data?.totalElements ?? 0;

  return (
    <div className="w-full max-w-6xl px-4 py-8 mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">웹 개발 프로젝트 모집</h1>
        <p className="mt-2 text-sm text-gray-500">
          함께 성장할 팀원을 찾고 있나요? 다양한 프로젝트에 참여해보세요!
        </p>

        <div className="max-w-3xl mx-auto mt-5">
          <TextInput
            value={query}
            onChange={(e) => {
              setPage(0);
              setQuery(e.currentTarget.value);
            }}
            placeholder="프로젝트 제목이나 기술 스택으로 검색하세요..."
            leftSection={<Search size={18} />}
            classNames={{
              input:
                "rounded-2xl border border-gray-200 focus:border-sky-300 focus:ring-0",
            }}
            disabled={mode === "rec"} 
          />
          {mode === "rec" && (
            <div className="mt-2 text-xs text-gray-500">
              추천 모드에서는 검색/필터가 적용되지 않을 수 있어요.
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            type="button"
            onClick={() => setMode('all')}
            className={`${base} ${mode === 'all' ? active : inactive}`}
            aria-pressed={mode === 'all'}
          >
            전체 목록
          </button>
          <button
            type="button"
            onClick={() => setMode('rec')}
            className={`${base} ${mode === 'rec' ? active : inactive}`}
            aria-pressed={mode === 'rec'}
          >
            추천 모집글
          </button>
        </div>
      </div>

      <div className="items-center justify-end hidden mb-4 md:flex">
        <Link
          to="/post/new"
          className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-white transition shadow-sm rounded-xl bg-sky-300 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <Plus size={18} />
          팀원 공고 작성하기
        </Link>
      </div>

      <section className="mb-4">
        <div className="mb-2 text-sm font-semibold text-gray-700">모집 상태</div>
        <Group gap="xs" wrap="wrap" className={mode === "rec" ? "opacity-60" : ""}>
          {[
            { label: "모든 상태", value: "" },
            { label: "모집 예정", value: "FORTHCOMING" },
            { label: "모집 중", value: "RECRUITING" },
            { label: "모집 마감", value: "CLOSED" },
            { label: "완료", value: "COMPLETED" },
          ].map((opt) => (
            <button
              key={opt.value || "ALL"}
              onClick={() => {
                setPage(0);
                setStatus(opt.value as any);
              }}
              className={[
                "px-3 py-1.5 rounded-full text-sm",
                "border",
                mode === "rec" ? "pointer-events-none" : "",
                status === opt.value
                  ? "bg-sky-300 border-sky-300 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </Group>
      </section>

      <section className="mb-4">
        <div className="mb-2 text-sm font-semibold text-gray-700">카테고리</div>
        <Group gap="xs" wrap="wrap" className={mode === "rec" ? "opacity-60" : ""}>
          <Chip
            checked={fields.length === 0}
            onChange={() => {
              setPage(0);
              setFields([]);
            }}
            radius="xl"
            classNames={{
              label:
                "px-3 py-1 text-sm rounded-full border data-[checked=true]:bg-blue-300 data-[checked=true]:text-white",
              input: "hidden",
            }}
            disabled={mode === "rec"}
          >
            전체
          </Chip>
          {areaOptions.map((a) => (
            <Chip
              key={a.value}
              checked={fields.includes(a.value)}
              onChange={(checked) => {
                setPage(0);
                setFields((prev) =>
                  checked ? [...prev, a.value] : prev.filter((v) => v !== a.value)
                );
              }}
              radius="xl"
              classNames={{
                label:
                  "px-3 py-1 text-sm rounded-full border border-gray-200 data-[checked=true]:bg-blue-300 data-[checked=true]:text-white",
                input: "hidden",
              }}
              disabled={mode === "rec"}
            >
              {a.label}
            </Chip>
          ))}
        </Group>
      </section>

      <section className="mb-6">
        <div className="mb-2 text-sm font-semibold text-gray-700">기술 스택</div>
        <Group gap="xs" wrap="wrap" className={mode === "rec" ? "opacity-60" : ""}>
          {skillOptions.map((s) => (
            <Chip
              key={s.value}
              checked={skills.includes(s.value)}
              onChange={(checked) => {
                setPage(0);
                setSkills((prev) =>
                  checked ? [...prev, s.value] : prev.filter((v) => v !== s.value)
                );
              }}
              radius="xl"
              classNames={{
                label:
                  "px-3 py-1 text-sm rounded-full border border-gray-200 data-[checked=true]:bg-sky-300 data-[checked=true]:text-white",
                input: "hidden",
              }}
              disabled={mode === "rec"}
            >
              {s.label}
            </Chip>
          ))}
        </Group>
      </section>

      <div className="flex items-center gap-3 mb-3">
        <div className="text-sm text-gray-600">
          총{" "}
          <span className="font-semibold text-gray-800">{totalFound}</span>
          개의 프로젝트를 찾았습니다
        </div>
        {mode === "rec" && (
          <Badge color="blue" variant="light" className="ml-auto">
            추천 순 정렬
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader />
        </div>
      ) : error ? (
        <div className="px-4 py-3 text-orange-600 border border-orange-300 rounded-xl bg-orange-50">
          목록을 불러오지 못했어요. {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {data?.content.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              thumbnailUrl={post.thumbnailUrl}
              status={post.status}
              startAt={post.startAt}
              endAt={post.endAt}
              recruitQuota={post.recruitQuota}
              viewCount={post.viewCount}
              fieldTags={post.fieldTags}
              languageTags={post.languageTags}
              AREA_LABEL_MAP={AREA_LABEL_MAP}
              SKILL_LABEL_MAP={SKILL_LABEL_MAP}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-6">
        <Tooltip label="이전 페이지">
          <button
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={data?.first || loading}
          >
            이전
          </button>
        </Tooltip>
        <span className="text-sm text-gray-600">
          {data ? data.number + 1 : 0} / {data?.totalPages ?? 0}
        </span>
        <Tooltip label="다음 페이지">
          <button
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40"
            onClick={() =>
              setPage((p) =>
                data ? Math.min(data.totalPages - 1, p + 1) : p + 1
              )
            }
            disabled={data?.last || loading}
          >
            다음
          </button>
        </Tooltip>
      </div>

      <Link
        to="/post/new"
        aria-label="팀원 공고 작성하기"
        className="fixed z-50 inline-flex items-center justify-center text-white transition rounded-full shadow-lg md:hidden bottom-6 right-6 h-14 w-14 bg-sky-300 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        <Plus size={22} />
      </Link>
    </div>
  );
}
