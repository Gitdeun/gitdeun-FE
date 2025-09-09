import { forwardRef, useImperativeHandle, useState } from "react";
import { TextInput, Textarea } from "@mantine/core";
import { Mail, Info, Heading } from "lucide-react";
import type { SectionHandle } from "./types";

export type BasicInfo = { title: string; email: string; description: string; };
type Props = { value: BasicInfo; onChange: (next: BasicInfo) => void; };

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default forwardRef<SectionHandle, Props>(function BasicInfoSection({ value, onChange }, ref) {
  const [errors, setErrors] = useState<{title?: string; email?: string; description?: string}>({});

  useImperativeHandle(ref, () => ({
    validate: () => {
      const e: typeof errors = {};
      if (!value.title.trim()) e.title = "제목을 입력해주세요.";
      if (!value.email.trim() || !isEmail(value.email)) e.email = "올바른 이메일을 입력해주세요.";
      if (!value.description.trim()) e.description = "설명을 입력해주세요.";
      setErrors(e);
      return Object.values(e);
    },
  }));

  return (
    <section className="p-6 bg-white border border-gray-300 shadow-sm rounded-2xl">
      <div className="flex items-center gap-2 mb-4 text-blue-700">
        <Info size={22} /><h2 className="text-xl font-semibold">기본 정보</h2>
      </div>

      <div className="grid gap-5">
        <TextInput
          label="모집 공고 제목 *"
          leftSection={<Heading size={16} />}
          error={errors.title}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.currentTarget.value })}
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
        <TextInput
          label="이메일 주소 *"
          leftSection={<Mail size={16} />}
          error={errors.email}
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.currentTarget.value })}
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
        <Textarea
          label="프로젝트 설명 *"
          error={errors.description}
          minRows={4}
          autosize
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.currentTarget.value })}
          classNames={{ label:"text-gray-700", input:"rounded-xl border-gray-300 focus:border-blue-300 focus:ring-0" }}
        />
      </div>
    </section>
  );
});
