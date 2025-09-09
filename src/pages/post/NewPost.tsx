import { useRef, useState } from "react";
import BasicInfoSection from "./newpost/BasicInfoSection";
import RecruitInfoSection from "./newpost/RecruitInfoSection";
import TechStackSection from "./newpost/TechStackSection";
import AttachImagesSection from "./newpost/AttachImagesSection";

import type { BasicInfo } from "./newpost/BasicInfoSection";
import type { RecruitInfo } from "./newpost/RecruitInfoSection";
import type { TechStack } from "./newpost/TechStackSection";
import type { AttachImages } from "./newpost/AttachImagesSection";
import type { SectionHandle } from "./newpost/types";

import { createRecruitment } from "../../api/post";
import { AREA_MAP, SKILL_MAP } from "../../constants/recruitmentEnums";

export default function NewPost() {
  const [basic, setBasic] = useState<BasicInfo>({ title: "", email: "", description: "" });
  const [recruit, setRecruit] = useState<RecruitInfo>({
    status: "",
    teamSizeHint: "",
    total: 6,
    recruiting: 3,
    startDate: null,
    endDate: null,
  });
  const [tech, setTech] = useState<TechStack>({ skills: [], areas: [] });
  const [images, setImages] = useState<AttachImages>([]);

  const basicRef = useRef<SectionHandle>(null);
  const recruitRef = useRef<SectionHandle>(null);
  const techRef = useRef<SectionHandle>(null);

  const handleSubmit = async () => {
    const errs = [
      ...(basicRef.current?.validate() ?? []),
      ...(recruitRef.current?.validate() ?? []),
      ...(techRef.current?.validate() ?? []),
    ];

    const toLocalISOString = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    return `${y}-${m}-${day}T${h}:${mi}:${s}`;
  };

    if (errs.length > 0) {
      alert(`모든 문항을 입력해주세요.\n\n누락/오류 항목:\n${errs.join("\n")}`);
      return;
    }

    try {
      const requestDto = {
      title: basic.title.trim(),
      content: basic.description.trim(),
      contactEmail: basic.email.trim(),
      startAt: recruit.startDate ? toLocalISOString(recruit.startDate) : null,
      endAt:   recruit.endDate   ? toLocalISOString(recruit.endDate)   : null,
      teamSizeTotal: recruit.total,
      recruitQuota: recruit.recruiting,
      fieldTags: tech.areas.map((a) => AREA_MAP[a] || "ETC"),
      languageTags: tech.skills.map((s) => SKILL_MAP[s] || "OTHER"),
    };

      console.log("=== requestDto to send ===", JSON.stringify(requestDto, null, 2));
      console.log("=== images to send ===", images.map(f => f.name));

      const result = await createRecruitment(requestDto, images);
      console.log("등록 성공:", result);
      alert("모집공고가 등록되었습니다!");
    } catch (err: any) {
  const msg = err?.response?.data?.message || err?.message || "알 수 없는 오류";
  console.error("등록 실패:", err?.response?.data || err);
  alert(`등록 실패: ${msg}`);
}
  };

  return (
    <div className="max-w-5xl p-6 mx-auto space-y-6">
      <header className="p-6 bg-white rounded-2xl">
        <h1 className="text-2xl font-bold text-gray-900">모집 공고 작성</h1>
        <p className="mt-1 text-gray-600">프로젝트 팀원을 모집하는 공고를 작성해보세요</p>
      </header>

      {/* ref 전달 */}
      <BasicInfoSection ref={basicRef} value={basic} onChange={setBasic} />
      <RecruitInfoSection ref={recruitRef} value={recruit} onChange={setRecruit} />
      <TechStackSection ref={techRef} value={tech} onChange={setTech} />
      <AttachImagesSection value={images} onChange={setImages} />

      <div className="sticky flex justify-end bottom-6">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 font-semibold text-white rounded-xl bg-sky-300 hover:bg-sky-400 focus:outline-none"
        >
          모집공고등록
        </button>
      </div>
    </div>
  );
}
