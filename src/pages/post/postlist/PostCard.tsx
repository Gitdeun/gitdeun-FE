import { Badge } from "@mantine/core";
import { Link } from "react-router-dom";
import { Calendar, Users, Eye } from "lucide-react";
import { STATUS_LABELS } from "../../../constants/recruitmentEnums";

const statusColor = (status: string) => {
  switch (status) {
    case "RECRUITING":
      return "bg-sky-300 text-white";
    case "FORTHCOMING":
      return "bg-blue-300 text-white";
    case "COMPLETED":
      return "bg-gray-400 text-white";
    case "CLOSED":
    default:
      return "bg-gray-500 text-white";
  }
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

type PostCardProps = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  startAt: string;
  endAt: string;
  recruitQuota: number;
  viewCount: number;
  fieldTags: string[];
  languageTags: string[];
  AREA_LABEL_MAP: Record<string, string>;
  SKILL_LABEL_MAP: Record<string, string>;
};

export default function PostCard({
  id,
  title,
  thumbnailUrl,
  status,
  startAt,
  endAt,
  recruitQuota,
  viewCount,
  fieldTags,
  languageTags,
  AREA_LABEL_MAP,
  SKILL_LABEL_MAP,
}: PostCardProps) {
  return (
    <article className="relative overflow-hidden transition bg-white border border-gray-200 shadow-sm cursor-pointer rounded-2xl hover:shadow-md group">
      <div className="relative">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="object-cover w-full h-48 md:h-56"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-sky-100 md:h-56" />
        )}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(
              status
            )}`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:underline">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Calendar size={16} />
            {fmtDate(startAt)} ~ {fmtDate(endAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={16} />
            {recruitQuota}명
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={16} />
            {viewCount}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {fieldTags.map((f) => (
            <Badge
              key={`field-${f}`}
              radius="sm"
              className="text-blue-700 bg-blue-50"
              variant="light"
            >
              {AREA_LABEL_MAP[f] ?? f}
            </Badge>
          ))}
          {languageTags.map((l) => (
            <Badge
              key={`lang-${l}`}
              radius="sm"
              className="bg-sky-50 text-sky-700"
              variant="light"
            >
              {SKILL_LABEL_MAP[l] ?? l}
            </Badge>
          ))}
        </div>
      </div>

      <Link
        to={`/post/${id}`}
        aria-label={title}
        className="absolute inset-0 z-10"
      />
    </article>
  );
}
