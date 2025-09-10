import { forwardRef, useImperativeHandle, useState } from "react";
import { NumberInput, Select } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { Users, Calendar } from "lucide-react";
import type { SectionHandle } from "./types";

export type RecruitInfo = {
  status: "모집예정" | "진행중" | "마감" | "";
  teamSizeHint: string;
  total: number;
  recruiting: number;
  startDate: Date | null;
  endDate: Date | null;
};

type Props = {
  value: RecruitInfo;
  onChange: (next: RecruitInfo) => void;
  constraints?: { recruitMax?: number; startMax?: Date; endMin?: Date; };
};

const computeStatus = (s: Date|null, e: Date|null): RecruitInfo["status"] => {
  if (!s || !e) return "";
  const now = new Date();
  if (now < s) return "모집예정";
  if (now > e) return "마감";
  return "진행중";
};

export default forwardRef<SectionHandle, Props>(function RecruitInfoSection({ value, onChange, constraints }, ref) {
  const [errors, setErrors] = useState<{total?: string; recruiting?: string; start?: string; end?: string; status?: string}>({});
  const recruitMax = constraints?.recruitMax ?? Math.max(0, (value.total ?? 0) - 1);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const e: typeof errors = {};
      if (value.total == null || value.total < 1) e.total = "총 인원은 1명 이상이어야 합니다.";
      if (value.recruiting == null || value.recruiting < 0) e.recruiting = "모집 인원은 0 이상이어야 합니다.";
      if (value.recruiting > recruitMax) e.recruiting = `모집 인원은 최대 ${recruitMax}명까지입니다.`;
      if (!value.startDate) e.start = "시작일을 선택해주세요.";
      if (!value.endDate) e.end = "마감일을 선택해주세요.";
      if (value.startDate && value.endDate && value.startDate > value.endDate) e.start = "시작일은 마감일보다 늦을 수 없습니다.";
      const auto = computeStatus(value.startDate, value.endDate);
      if (auto && value.status !== auto) onChange({ ...value, status: auto });
      setErrors(e);
      return Object.values(e);
    },
  }));

  return (
    <section className="p-6 bg-white border border-gray-300 shadow-sm rounded-2xl">
      <div className="flex items-center gap-2 mb-4 text-blue-700">
        <Users size={22} /><h2 className="text-xl font-semibold">모집 정보</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <NumberInput
          label="총 인원"
          value={value.total}
          min={1}
          error={errors.total}
          clampBehavior="strict"
          onChange={(n) => onChange({ ...value, total: Number(n ?? 0) || 0 })}
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
        <NumberInput
          label={`모집 인원 (최대 ${recruitMax}명)`}
          value={value.recruiting}
          min={0}
          max={recruitMax}
          error={errors.recruiting}
          clampBehavior="strict"
          onChange={(n) => {
            const next = Math.max(0, Math.min(Number(n ?? 0), recruitMax));
            onChange({ ...value, recruiting: next });
          }}
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
        <DatePickerInput
          label="모집 시작일"
          value={value.startDate}
          error={errors.start}
          onChange={(d: Date | null) => onChange({ ...value, startDate: d })}
          leftSection={<Calendar size={16} />}
          valueFormat="YYYY-MM-DD"
          maxDate={constraints?.startMax}
          className="md:col-span-1"
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
        <DatePickerInput
          label="모집 마감일"
          value={value.endDate}
          error={errors.end}
          onChange={(d: Date | null) => onChange({ ...value, endDate: d })}
          leftSection={<Calendar size={16} />}
          valueFormat="YYYY-MM-DD"
          minDate={constraints?.endMin}
          className="md:col-span-1"
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
        <Select
          label="모집 상태"
          data={[{value:"모집예정",label:"모집예정"},{value:"진행중",label:"진행중"},{value:"마감",label:"마감"}]}
          value={value.status || null}
          onChange={(v) => onChange({ ...value, status: (v ?? "") as RecruitInfo["status"] })}
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
      </div>
    </section>
  );
});
