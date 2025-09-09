import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export type AttachImages = File[];

type Props = {
  value: AttachImages;
  onChange: (files: AttachImages) => void;
};

export default function AttachImagesSection({ value, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    onChange([...(value ?? []), ...images]);
  };

  return (
    <section className="p-6 bg-white border border-gray-300 shadow-sm rounded-2xl">
      <div className="flex items-center gap-2 mb-4 text-blue-700">
        <Upload size={22} />
        <h2 className="text-xl font-semibold">첨부 이미지</h2>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[140px] items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center
        ${dragOver ? "border-sky-300 bg-sky-50" : "border-gray-300 bg-gray-50"}
        `}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="space-y-1">
          <p className="text-gray-700">프로젝트 관련 이미지</p>
          <p className="text-sm text-gray-500">
            이미지 파일을 선택하거나 드래그해주세요
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          multiple
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
      </div>

      {value && value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
          {value.map((f, idx) => {
            const url = URL.createObjectURL(f);
            return (
              <div
                key={idx}
                className="overflow-hidden bg-white border border-gray-300 rounded-xl"
                title={f.name}
              >
                <img
                  src={url}
                  alt={f.name}
                  className="object-cover w-full h-28"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <div className="px-2 py-1 text-xs text-gray-600 truncate">
                  {f.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
