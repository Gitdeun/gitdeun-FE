import { useEffect, useState } from "react";
import { Modal, Button, Textarea, Avatar, Loader } from "@mantine/core";
import { CheckCircle2, XCircle } from "lucide-react";
import { getApplicationById, acceptApplication, rejectApplication } from "../../../api/userRecruitments";

export interface ApplicationDetail {
  applicationId: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  applicantNickname: string;
  applicantProfileImage?: string | null;
  recruitmentId: number;
  recruitmentTitle: string;
  recruiterName: string;
  appliedField: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ApplicantDetailModal({
  opened,
  applicationId,
  onClose,
  onDecide,
}: {
  opened: boolean;
  applicationId: number | null;
  onClose: () => void;
  onDecide: (id: number, action: "APPROVE" | "REJECT", reason: string) => void;
}) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!opened || applicationId == null) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getApplicationById(applicationId);
        if (!alive) return;

        const normalizedStatus: ApplicationDetail["status"] =
          data.status === "ACCEPTED" ? "APPROVED" : (data.status as ApplicationDetail["status"]);

        setDetail({ ...data, status: normalizedStatus });
      } catch {
        setLoadError("상세 정보를 불러오지 못했습니다.");
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [opened, applicationId]);

  useEffect(() => {
    if (opened) {
      setAction("APPROVE");
      setReason("");
      setError("");
    }
  }, [opened]);

  const submit = async () => {
    if (!detail) return;

    try {
      if (action === "APPROVE") {
        await acceptApplication(detail.applicationId);
        onDecide(detail.applicationId, "APPROVE", "");
      } else {
        if (!reason.trim()) {
          setError("거절 사유를 입력해주세요.");
          return;
        }
        await rejectApplication(detail.applicationId, reason.trim());
        onDecide(detail.applicationId, "REJECT", reason.trim());
      }
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "처리에 실패했습니다.");
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton
      centered
      title={<div className="font-bold">지원자 상세 정보</div>}
    >
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      )}

      {!loading && loadError && (
        <div className="py-8 text-sm text-center text-red-600">{loadError}</div>
      )}

      {!loading && !loadError && detail && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar src={detail.applicantProfileImage ?? undefined} radius="xl" size={52} />
            <div>
              <div className="text-lg font-semibold">{detail.applicantName}</div>
              <div className="text-sm text-gray-600">@{detail.applicantNickname}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              <div className="mb-1 font-semibold text-gray-900">이메일</div>
              <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                {detail.applicantEmail}
              </div>
            </div>
            <div className="text-sm text-gray-700">
              <div className="mb-1 font-semibold text-gray-900">지원 메시지</div>
              <div className="px-3 py-3 whitespace-pre-wrap border border-gray-200 rounded-lg bg-gray-50">
                {detail.message ?? "(메시지 없음)"}
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-3">
            <div className="text-[15px] font-semibold">지원서 검토</div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-pressed={action === "APPROVE"}
                onClick={() => { setAction("APPROVE"); setError(""); setReason(""); }}
                className={`group inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold transition
                  rounded-[14px] border focus-visible:outline-none
                  ${action === "APPROVE"
                    ? "border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-300"
                    : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-200"
                  }`}
              >
                <CheckCircle2 size={18} strokeWidth={2.2} className="shrink-0" />
                승인
              </button>

              <button
                type="button"
                aria-pressed={action === "REJECT"}
                onClick={() => setAction("REJECT")}
                className={`group inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold transition
                  rounded-[14px] border focus-visible:outline-none
                  ${action === "REJECT"
                    ? "border-red-500 bg-red-100 text-red-700 shadow-sm focus-visible:ring-2 focus-visible:ring-red-300"
                    : "border-red-300 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-200"
                  }`}
              >
                <XCircle size={18} strokeWidth={2.2} className="shrink-0" />
                거절
              </button>
            </div>

            {action === "REJECT" && (
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-900">
                  거절 사유 *
                </label>
                <Textarea
                  placeholder="거절하는 이유를 입력해주세요..."
                  autosize
                  minRows={3}
                  value={reason}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && reason.trim()) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  onChange={(e) => {
                    setReason(e.currentTarget.value);
                    if (error) setError("");
                  }}
                />
                <div className="mt-1">
                  {error ? (
                    <span className="text-xs text-red-600">{error}</span>
                  ) : (
                    <span className="text-xs text-gray-500">사유는 지원자에게 전달됩니다.</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="default" className="!rounded-xl" onClick={onClose}>
                취소
              </Button>
              <Button
                className={`!rounded-xl text-white ${
                  action === "APPROVE"
                    ? "!bg-emerald-500 hover:!bg-emerald-600"
                    : "!bg-red-500 hover:!bg-red-600"
                }`}
                onClick={submit}
                disabled={action === "REJECT" && !reason.trim()}
              >
                {action === "APPROVE" ? "승인하기" : "거절하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
