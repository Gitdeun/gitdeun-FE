import { Modal, Chip, Group, Textarea } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

type ApplyConfirmModalProps = {
  opened: boolean;
  onClose: () => void;
  recruitmentId: number | string;
  title: string;
  /** 상세에서 내려준 필드 후보들 (예: ["BACKEND","FRONTEND"]) */
  fieldCandidates: string[];
  /** "BACKEND" -> "백엔드" 같은 표시용 라벨 맵 */
  fieldLabelMap?: Record<string, string>;
  /** 확인 클릭 시 상위에서 실제 API 호출 */
  onConfirm: (payload: {
    recruitmentId: number | string;
    appliedField: string;
    message: string;
  }) => void | Promise<void>;
  loading?: boolean;
  noteText?: string;
  /** 메시지 최대 길이 */
  maxMessageLen?: number;
};

export default function ApplyConfirmModal({
  opened,
  onClose,
  recruitmentId,
  title,
  fieldCandidates,
  fieldLabelMap,
  onConfirm,
  loading,
  noteText = "지원 후 프로젝트 팀장이 연락드릴 예정입니다.",
  maxMessageLen = 300,
}: ApplyConfirmModalProps) {
  // 기본 선택: 첫 번째 후보
  const [appliedField, setAppliedField] = useState<string>("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (opened) {
      setAppliedField(fieldCandidates?.[0] ?? "");
      setMessage("");
    }
  }, [opened, fieldCandidates]);

  const canSubmit = !!appliedField && message.trim().length > 0 && !loading;
  const leftChars = useMemo(
    () => Math.max(0, maxMessageLen - message.length),
    [message.length, maxMessageLen]
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton
      radius="lg"
      size="lg"
      overlayProps={{ backgroundOpacity: 0.3, blur: 2 }}
      styles={{ header: { paddingBottom: 0 }, title: { width: "100%", textAlign: "center" } }}
      title={<span className="text-xl font-extrabold text-gray-900">프로젝트 지원</span>}
    >
      {/* 상단 강조 박스 */}
      <div className="px-5 py-6 text-center rounded-2xl bg-sky-50">
        <div className="mb-2 text-lg font-bold text-gray-900">“{title}”</div>
        <div className="text-sky-700">프로젝트에 지원하시겠습니까?</div>
      </div>

      {/* 안내 문구 */}
      <p className="mt-6 text-center text-gray-600">{noteText}</p>

      {/* 개발 분야 선택 */}
      <div className="mt-6">
        <div className="mb-2 text-sm font-semibold text-gray-700">개발 분야</div>
        {fieldCandidates?.length ? (
          <Group gap="xs" wrap="wrap">
            {fieldCandidates.map((value) => (
              <Chip
                key={value}
                value={value}
                checked={appliedField === value}
                onChange={() => setAppliedField(value)}
                radius="xl"
                classNames={{
                  label:
                    "px-3 py-1 text-sm rounded-full border border-gray-200 data-[checked=true]:bg-blue-300 data-[checked=true]:text-white",
                  input: "hidden",
                }}
              >
                {fieldLabelMap?.[value] ?? value}
              </Chip>
            ))}
          </Group>
        ) : (
          <div className="text-sm text-gray-500">선택 가능한 분야가 없습니다.</div>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">지원 메시지</span>
          <span className="text-xs text-gray-500">{leftChars}자 남음</span>
        </div>
        <Textarea
          value={message}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setMessage(v.length > maxMessageLen ? v.slice(0, maxMessageLen) : v);
          }}
          autosize
          minRows={3}
          maxRows={6}
          placeholder="간단한 자기소개, 경험, 협업 가능 시간 등을 적어주세요."
          classNames={{
            input:
              "rounded-xl border-gray-200 focus:border-sky-300 focus:ring-0 placeholder:text-gray-400",
          }}
        />
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between w-full gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="w-1/2 px-4 py-3 font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          취소
        </button>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            onConfirm({
              recruitmentId,
              appliedField,
              message: message.trim(),
            })
          }
          className="w-1/2 px-4 py-3 font-semibold text-white bg-blue-400 rounded-xl hover:bg-blue-500 disabled:opacity-60"
        >
          지원하기
        </button>
      </div>
    </Modal>
  );
}
