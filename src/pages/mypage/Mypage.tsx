import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { TechStackModal } from "../../components/modal/TechStackModal";
import { User, Mail, Code, Edit3, FileText, Send } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserInfo } from "../../api/auth";
import { skillList } from "../../api/userSkill";
import JobPostCard, { type RecruitmentCard } from "./JobPostCard";
import { getMyRecruitments, getMyApplications, type Recruitment, type MyApplication } from "../../api/userRecruitments";

const APP_STATUS_KO: Record<string, string> = {
  PENDING: "대기",
  ACCEPTED: "승인",
  REJECTED: "거절",
  CANCELLED: "취소",
};

export function MyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openTechModal, setOpenTechModal] = useState<boolean>(Boolean(location.state?.showTechStackModal));

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; profileImage: string } | null>(null);

  const [myRecruitments, setMyRecruitments] = useState<RecruitmentCard[]>([]);
  const [appliedRecruitments, setAppliedRecruitments] = useState<RecruitmentCard[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [loadingApplied, setLoadingApplied] = useState(false);
  const [errorMy, setErrorMy] = useState<string | null>(null);
  const [errorApplied, setErrorApplied] = useState<string | null>(null);

  // 사용자 기본정보
  useEffect(() => {
    const token = localStorage.getItem("accessToken")?.trim();
    if (!token) {
      setUser(null);
      return;
    }
    getUserInfo()
      .then(({ name, email, profileImage }) => setUser({ name, email, profileImage }))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    skillList().then(setSelectedLanguages).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.showTechStackModal) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    setLoadingMy(true);
    setErrorMy(null);
    getMyRecruitments({ page: 0, size: 10 })
      .then(({ content }) => {
        const mapped = content.map(mapRecruitmentApiToCard);
        setMyRecruitments(mapped);
      })
      .catch((e) => setErrorMy(e?.message ?? "내 공고를 불러오지 못했습니다."))
      .finally(() => setLoadingMy(false));
  }, []);

  useEffect(() => {
    setLoadingApplied(true);
    setErrorApplied(null);
    getMyApplications({ page: 0, size: 10 })
      .then(({ content }) => {
        const mapped = content.map(mapApplicationApiToCard);
        setAppliedRecruitments(mapped);
      })
      .catch((e) => setErrorApplied(e?.message ?? "신청 목록을 불러오지 못했습니다."))
      .finally(() => setLoadingApplied(false));
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-sky-50 to-blue-100">
      <div className="mx-auto max-w-7xl">
        <div className="py-8 text-center">
          <h1 className="mb-2 text-sky-800">마이페이지</h1>
          <p className="text-sky-600">프로필 정보를 확인하고 관심 언어를 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg h-full min-h-[500px]">
              <CardHeader className="pb-6 text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.profileImage ?? ""} alt={user?.name ?? "profile"} />
                    <AvatarFallback className="text-2xl text-white bg-sky-500">
                      {(user?.name?.[0] ?? "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="flex items-center justify-center gap-2 text-sky-800">
                  <User className="w-5 h-5" />
                  사용자 프로필
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-center space-y-6">
                <div className="p-4 border rounded-lg bg-sky-50 border-sky-200">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-sky-600" />
                    <div>
                      <label className="block mb-1 text-sky-700">가입 이메일</label>
                      <p className="text-sky-800">{user?.email ?? "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-sky-50 border-sky-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Code className="w-5 h-5 text-sky-600" />
                      <label className="text-sky-700">관심있는 언어</label>
                    </div>
                    <Button
                      onClick={() => setOpenTechModal(true)}
                      variant="outline"
                      size="sm"
                      className="border-sky-300 text-sky-700 hover:bg-sky-100 hover:border-sky-400"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      변경
                    </Button>
                  </div>

                  {selectedLanguages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedLanguages.map((language) => (
                        <Badge
                          key={language}
                          variant="secondary"
                          className="bg-sky-100 text-sky-800 border-sky-300"
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="italic text-sky-600">관심 언어를 선택해주세요.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg h-full min-h-[600px]">
              <CardHeader>
                <CardTitle className="text-sky-800">모집공고 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="my-posts" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 border bg-sky-100/50 border-sky-200">
                    <TabsTrigger value="my-posts" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white text-sky-700">
                      <FileText className="w-4 h-4 mr-2" />
                      작성한 공고
                    </TabsTrigger>
                    <TabsTrigger value="applied" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white text-sky-700">
                      <Send className="w-4 h-4 mr-2" />
                      신청한 공고
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="my-posts" className="mt-6">
                    {loadingMy ? (
                      <div className="p-6 text-center text-gray-500">불러오는 중…</div>
                    ) : errorMy ? (
                      <div className="p-6 text-center text-red-500 border rounded-xl bg-red-50">{errorMy}</div>
                    ) : myRecruitments.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 border rounded-xl bg-gray-50">
                        아직 작성한 공고가 없어요.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myRecruitments.map((post) => (
                          <JobPostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="applied" className="mt-6">
                    {loadingApplied ? (
                      <div className="p-6 text-center text-gray-500">불러오는 중…</div>
                    ) : errorApplied ? (
                      <div className="p-6 text-center text-red-500 border rounded-xl bg-red-50">{errorApplied}</div>
                    ) : appliedRecruitments.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 border rounded-xl bg-gray-50">
                        신청한 공고가 아직 없어요.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {appliedRecruitments.map((post) => (
                          <JobPostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TechStackModal
        isOpen={openTechModal}
        onClose={() => setOpenTechModal(false)}
        onSelectionChange={({ languages }) => setSelectedLanguages(languages)}
      />
    </div>
  );
}


function mapRecruitmentApiToCard(r: Recruitment): RecruitmentCard {
  return {
    id: r.id,
    title: r.title,
    thumbnailUrl: r.thumbnailUrl,
    status: r.status,
    languageTags: r.languageTags,
    fieldTags: r.fieldTags,
    startAt: r.startAt,
    endAt: r.endAt,
    viewCount: r.viewCount,
    recruitQuota: r.recruitQuota,
  };
}

function mapApplicationApiToCard(a: MyApplication): RecruitmentCard {
  return {
    id: a.applicationId,
    title: a.recruitmentTitle,
    thumbnailUrl: null,                 // API에 썸네일이 없으므로 비움
    status: APP_STATUS_KO[a.status] ?? a.status, // "대기/승인/거절/취소"로 한글화
    languageTags: [],                   // 필요 시 백엔드 확장 후 연결
    fieldTags: [a.appliedField],        // 신청 분야만 표시
    startAt: a.createdAt,               // 생성일만 있으므로 기간의 시작으로 사용
    endAt: undefined,
    viewCount: undefined,
    recruitQuota: undefined,
  };
}
