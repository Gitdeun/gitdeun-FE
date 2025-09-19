import React from "react";
import { Button, Avatar } from "@mantine/core";
import { CalendarClock, Eye, User2 } from "lucide-react";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApplicationSummary {
  applicationId: number;
  applicantName: string;
  applicantNickname: string;
  applicantProfileImage?: string | null;
  recruitmentTitle: string;
  appliedField: string;
  status: ApplicationStatus;
  createdAt: string;
}

const fieldLabel: Record<string, string> = {
  FULLSTACK: "풀스택",
  FRONTEND: "프론트엔드",
  BACKEND: "백엔드",
  DESIGN: "디자인",
  MOBILE: "모바일",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { hour12: false });

const StatusChip: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const styleMap: Record<ApplicationStatus, string> = {
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };
  const labelMap: Record<ApplicationStatus, string> = {
    PENDING: "대기중",
    APPROVED: "승인됨",
    REJECTED: "거절됨",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${styleMap[status]}`}
      style={{ width: "fit-content" }}
    >
      <span className="w-2 h-2 bg-current rounded-full opacity-70" />
      {labelMap[status]}
    </span>
  );
};

export default function ApplicantCard({
  item,
  onOpen,
}: {
  item: ApplicationSummary;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between w-full p-5 bg-white border border-gray-200 rounded-2xl">
      <div className="flex items-center gap-4">
        <Avatar src={item.applicantProfileImage ?? undefined} radius="xl" size={56} className="shadow-sm" />
        <div className="flex flex-col gap-2">
          <div className="text-lg font-bold leading-tight">{item.applicantName}</div>
          <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
            <User2 size={16} />
            <span>@{item.applicantNickname}</span>
            <span className="mx-1">·</span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
              {fieldLabel[item.appliedField] ?? item.appliedField}
            </span>
            <span className="mx-1">·</span>
            <CalendarClock size={16} />
            <span>{fmt(item.createdAt)}</span>
          </div>
          <StatusChip status={item.status} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          color="blue"
          radius="md"
          leftSection={<Eye size={16} />}
          onClick={() => onOpen(item.applicationId)}
        >
          자세히 보기
        </Button>
      </div>
    </div>
  );
}
