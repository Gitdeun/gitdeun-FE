import { Calendar, Users, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export type RecruitmentCard = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  status: "FORTHCOMING" | "RECRUITING" | "CLOSED" | "COMPLETED" | string;
  languageTags?: string[];
  fieldTags?: string[];
  startAt?: string;
  endAt?: string;
  viewCount?: number;
  recruitQuota?: number;
};

const STATUS_KO: Record<string, string> = {
  FORTHCOMING: "모집 예정",
  RECRUITING: "모집 중",
  CLOSED: "모집 마감",
  COMPLETED: "완료",
};

const fmt = (iso?: string) => (iso ? iso.split("T")[0].replaceAll("-", ".") : "");
const fmtRange = (start?: string, end?: string) => {
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `${s} ~ ${e}`;
  return s || e || "";
};

export default function JobPostCard({ post }: { post: RecruitmentCard }) {
  const thumb = post.thumbnailUrl ?? null;
  const statusKo = STATUS_KO[post.status] ?? post.status ?? "";
  const langs = post.languageTags ?? [];
  const fields = post.fieldTags ?? [];
  const dateStr = fmtRange(post.startAt, post.endAt);

  const hasMeta =
    !!dateStr || typeof post.viewCount === "number" || !!post.recruitQuota;

  return (
    <Link
      to={`/post/${post.id}`}
      aria-label={`${post.title} 상세 보기`}
      className="block group focus:outline-none"
    >
      <div
        className={[
          "border border-gray-200 rounded-2xl p-5 bg-white shadow-sm",
          "transition-all cursor-pointer",
          "group-hover:shadow-md group-focus-visible:shadow-md",
          "group-focus-visible:ring-2 group-focus-visible:ring-sky-300",
          thumb ? "grid grid-cols-[160px_1fr] gap-5" : "flex flex-col gap-4",
        ].join(" ")}
      >
        {thumb && (
          <img
            src={thumb}
            alt="thumbnail"
            className="w-[160px] h-[110px] object-cover rounded-xl bg-gray-100"
            loading="lazy"
          />
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[22px] font-semibold text-gray-900 leading-snug">
              {post.title}
            </h4>
            {statusKo && (
              <span
                className={[
                  "shrink-0 rounded-full px-3 py-1 text-sm font-medium border",
                  statusKo === "모집 중"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : statusKo === "모집 마감"
                    ? "bg-gray-100 text-gray-800 border-gray-200"
                    : statusKo === "모집 예정"
                    ? "bg-sky-100 text-sky-800 border-sky-200"
                    : "bg-violet-100 text-violet-800 border-violet-200",
                ].join(" ")}
              >
                {statusKo}
              </span>
            )}
          </div>

          {(fields.length > 0 || langs.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {fields.map((f) => (
                <span
                  key={`field-${f}`}
                  className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs border border-blue-100"
                >
                  {f}
                </span>
              ))}
              {langs.map((l) => (
                <span
                  key={`lang-${l}`}
                  className="rounded-md bg-pink-50 text-pink-700 px-2 py-0.5 text-xs border border-pink-100"
                >
                  {l}
                </span>
              ))}
            </div>
          )}

          {hasMeta && (
            <div className="flex flex-wrap items-center mt-1 text-gray-600 gap-x-6 gap-y-2">
              {dateStr && (
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-[15px]">{dateStr}</span>
                </span>
              )}
              {typeof post.viewCount === "number" && (
                <span className="inline-flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span className="text-[15px]">조회 {post.viewCount}</span>
                </span>
              )}
              {post.recruitQuota && (
                <span className="inline-flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-[15px]">모집 {post.recruitQuota}명</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
