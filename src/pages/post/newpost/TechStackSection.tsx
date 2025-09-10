import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Tags } from "lucide-react";
import type { SectionHandle } from "./types";
export type TechStack = { skills: string[]; areas: string[]; };
type Props = { value: TechStack; onChange: (next: TechStack) => void; };

const SKILL_OPTIONS = ["JavaScript","TypeScript","Python","Java","Kotlin","Go","Rust","C++","C#","Swift","PHP","Ruby","R"];
const AREA_OPTIONS  = ["프론트엔드","백엔드","풀스택","안드로이드","IOS","데이터","AI","임베디드","게임","보안","기타"];

export default forwardRef<SectionHandle, Props>(function TechStackSection({ value, onChange }, ref) {
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs: string[] = [];
      if (value.skills.length < 1) errs.push("개발 언어/프레임워크 최소 1개 선택");
      if (value.areas.length < 1) errs.push("개발 분야 최소 1개 선택");
      setError(errs[0] ?? null);
      return errs;
    },
  }));

  const has = useMemo(() => (set: "skills" | "areas", v: string) => value[set].includes(v), [value]);
  const toggle = (set: "skills" | "areas", v: string) => {
    const picked = value[set].includes(v) ? value[set].filter((x) => x !== v) : [...value[set], v];
    onChange({ ...value, [set]: picked });
  };

  return (
    <section className="p-6 bg-white border border-gray-300 shadow-sm rounded-2xl">
      <div className="flex items-center gap-2 mb-4 text-blue-700">
        <Tags size={22} /><h2 className="text-xl font-semibold">기술 스택 및 분야</h2>
      </div>

      <div className="space-y-5">
        <FieldLabel title="개발 언어/프레임워크" />
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((s) => (
            <Chip key={s} active={has("skills", s)} onClick={() => toggle("skills", s)}>{s}</Chip>
          ))}
        </div>

        <FieldLabel title="개발 분야" className="pt-4" />
        <div className="flex flex-wrap gap-2">
          {AREA_OPTIONS.map((s) => (
            <Chip key={s} active={has("areas", s)} onClick={() => toggle("areas", s)}>{s}</Chip>
          ))}
        </div>

        {error && <p className="text-sm text-orange-400">{error}</p>}
      </div>
    </section>
  );
});

function FieldLabel({ title, className }: { title: string; className?: string }) {
  return <h3 className={`text-sm font-semibold text-gray-700 ${className ?? ""}`}>{title}</h3>;
}

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${active ? "border-sky-300 bg-sky-50 text-sky-700" : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"}`}
    >+ {children}</button>
  );
}
