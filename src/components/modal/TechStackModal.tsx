"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
// 💡 새로 만든 api 파일에서 두 함수 모두 가져옵니다.
import { fetchSkills, updateUserSkills } from "../../api/userSkill.ts";

// --- 타입 정의 ---
interface TechStackModalProps {
    onSelectionChange?: (selection: { languages: string[] }) => void;
    onClose?: () => void;
    isOpen?: boolean;
}

interface TechStackSectionProps {
    title: string;
    items: string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    selectedCount: number;
    totalCount: number;
    theme: 'sky' | 'cyan';
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-5 h-5"} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);


// --- UI 섹션 컴포넌트 ---
function TechStackSection({ title, items, selectedItems, onToggle, selectedCount, totalCount, theme }: TechStackSectionProps) {
    // 💡 3. 그라데이션과 그림자 효과를 추가합니다.
    const selectedClasses = theme === 'sky'
        ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg"
        : "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg";

    const unselectedClasses = theme === 'sky'
        ? "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200"
        : "bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100";

    return (
        <div>
            <h3 className={`mb-6 pb-3 border-b border-border text-2xl font-semibold ${theme === 'sky' ? 'text-sky-800' : 'text-cyan-800'}`}>
                {title} ({selectedCount}/{totalCount})
            </h3>
            <div className="flex flex-wrap gap-4">
                {items.map((item) => {
                    const isSelected = selectedItems.includes(item);
                    return (
                        <Button
                            key={item}
                            variant={isSelected ? "default" : "outline"}
                            // 💡 2. 동적인 호버 효과와 아이콘을 위한 flex 스타일을 추가합니다.
                            className={`rounded-full px-7 py-3 text-lg transition-transform duration-200 hover:-translate-y-1 flex items-center gap-2 ${isSelected ? selectedClasses : unselectedClasses}`}
                            onClick={() => onToggle(item)}
                        >
                            {isSelected && <CheckIcon />}
                            {item}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export function TechStackModal({ onSelectionChange, onClose, isOpen }: TechStackModalProps) {
    const [languages, setLanguages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setError(null);

            fetchSkills()
                .then(fetchedLanguages => {
                    setLanguages(fetchedLanguages);
                })
                .catch(err => {
                    console.error("Failed to fetch skills:", err);
                    setError("기술 스택 목록을 불러오는 데 실패했습니다.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen]);

    const handleLanguageToggle = (language: string) => {
        const newSelection = selectedLanguages.includes(language)
            ? selectedLanguages.filter(l => l !== language)
            : [...selectedLanguages, language];
        setSelectedLanguages(newSelection);

        onSelectionChange?.({ languages: newSelection });
    };

    const handleClose = () => {
        onClose?.();
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await updateUserSkills(selectedLanguages);
            onClose?.();
        } catch (err) {
            console.error("Failed to update skills:", err);
            setError("선택 항목을 저장하는 데 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex-1 flex justify-center items-center text-xl">로딩 중...</div>;
        }
        if (error) {
            return <div className="flex-1 flex justify-center items-center text-red-500 text-xl">{error}</div>;
        }
        return (
            <>
                <ScrollArea className="pr-4 -mr-4"> {/* 스크롤바가 콘텐츠를 가리지 않도록 음수 마진 추가 */}
                    <div className="space-y-8">
                        <TechStackSection
                            title="개발 언어"
                            items={languages}
                            selectedItems={selectedLanguages}
                            onToggle={handleLanguageToggle}
                            selectedCount={selectedLanguages.length}
                            totalCount={languages.length}
                            theme="sky"
                        />
                    </div>
                </ScrollArea>
                <div className="flex justify-center gap-6 pt-6 border-border mt-8">
                    <Button variant="outline" onClick={handleClose} className="px-8 w-40 h-14 text-lg transition-transform duration-200 hover:-translate-y-1">
                        취소
                    </Button>
                    <Button
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="px-8 bg-sky-500 hover:bg-sky-600 w-40 h-14 text-lg transition-transform duration-200 hover:-translate-y-1"
                    >
                        {isSubmitting ? "저장 중..." : "선택완료"}
                    </Button>
                </div>
            </>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="bg-white max-w-6xl min-h-[60vh] flex flex-col justify-center p-10">
                <DialogHeader className="flex-row items-center justify-between space-y-0 pb-6">
                    <div>
                        <DialogTitle className="text-3xl font-bold">
                            관심있는 개발 언어 선택
                        </DialogTitle>
                        <DialogDescription className="text-lg text-slate-500 mt-2">
                            관심 분야를 선택해주시면, 맞춤형 경험을 제공해 드려요.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}

