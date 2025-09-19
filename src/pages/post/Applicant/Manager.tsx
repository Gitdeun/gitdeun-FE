import { useEffect, useState } from "react";
import ApplicantCard from "./Card";
import type { ApplicationSummary } from "./Card";
import ApplicantDetailModal from "./DetailModal";
import { getRecruitmentApplicants  } from "../../../api/userRecruitments";
import type { RecruitmentApplication } from "../../../api/userRecruitments";

export default function ApplicantsManager({ recruitmentId }: { recruitmentId: number }) {
  const [list, setList] = useState<ApplicationSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const closeModal = () => setActiveId(null);

  const handleDecide = (id: number, action: "APPROVE" | "REJECT", _reason: string) => {
    setList(prev =>
      prev.map(it =>
        it.applicationId === id
          ? { ...it, status: action === "APPROVE" ? "APPROVED" : "REJECTED" }
          : it
      )
    );
    closeModal();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const page = await getRecruitmentApplicants(recruitmentId, { page: 0, size: 10 });
        if (!alive) return;
        
        const mapped: ApplicationSummary[] = page.content.map((it: RecruitmentApplication) => ({
          applicationId: it.applicationId,
          applicantName: it.applicantName,
          applicantNickname: it.applicantNickname,
          applicantProfileImage: it.applicantProfileImage,
          recruitmentTitle: it.recruitmentTitle,
          appliedField: it.appliedField,
          status:
            it.status === "ACCEPTED" ? "APPROVED"
            : (it.status as ApplicationSummary["status"]), // PENDING/APPROVED/REJECTED
          createdAt: it.createdAt,
        }));

        setList(mapped);
      } catch (e) {
        console.error("신청자 목록 조회 실패:", e);
        setList([]);
      }
    })();
    return () => { alive = false; };
  }, [recruitmentId]);

  return (
    <div className="max-w-5xl px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="text-2xl font-extrabold">
          지원자 관리 <span className="ml-2 text-sm font-medium text-gray-600">총 {list.length}명</span>
        </div>
      </div>

      <div className="space-y-4">
        {list.map(item => (
          <ApplicantCard key={item.applicationId} item={item} onOpen={setActiveId} />
        ))}
      </div>

      <ApplicantDetailModal
        opened={!!activeId}
        applicationId={activeId}
        onClose={closeModal}
        onDecide={handleDecide}
      />
    </div>
  );
}
