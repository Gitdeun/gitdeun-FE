import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { TechStackModal } from "../../components/modal/TechStackModal.tsx";
import { User, Mail, Code, Edit3, FileText, Send, Calendar, MapPin, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserInfo } from "../../api/auth";
import { skillList } from "../../api/userSkill";

interface JobPost {
  id: number;
  title: string;
  company: string;
  location: string;
  date: string;
  status: string;
  languages: string[];
  applicants?: number;
}

interface UserData {
  name: string;
  email: string;
  profileImage: string;
}

export function MyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openTechModal, setOpenTechModal] = useState<boolean>(Boolean(location.state?.showTechStackModal));

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken")?.trim();
    if (!token) {
      setUser(null);
      return;
    }

    getUserInfo()
      .then(({ name, email, profileImage }) => {
        setUser({ name, email, profileImage });
      })
      .catch((err) => {
        console.warn("❗ 사용자 정보를 불러오지 못했습니다:", err);
        setUser(null);
      });
  }, []);

  useEffect(() => {
    skillList()
      .then((languages) => {
        setSelectedLanguages(languages);
      })
      .catch((err) => {
        console.error("❗ 관심 언어 목록을 불러오는 데 실패했습니다:", err);
      });
  }, []);

  useEffect(() => {
    if (location.state?.showTechStackModal) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const [myPosts] = useState<JobPost[]>([
    {
      id: 1,
      title: "프론트엔드 개발자 모집",
      company: "테크스타트업",
      location: "서울 강남구",
      date: "2024-12-01",
      status: "모집중",
      languages: ["React", "TypeScript", "JavaScript"],
      applicants: 12,
    },
  ]);

  const [appliedPosts] = useState<JobPost[]>([
    {
      id: 3,
      title: "백엔드 개발자",
      company: "핀테크 회사",
      location: "서울 여의도",
      date: "2024-12-03",
      status: "지원완료",
      languages: ["Java", "Spring", "MySQL"],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "모집중":
        return "bg-green-100 text-green-800 border-green-300";
      case "마감":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "지원완료":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "서류통과":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "면접대기":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-sky-100 text-sky-800 border-sky-300";
    }
  };

  const handleSelectionChange = (selection: { languages: Array<string | { name: string }> }) => {
    const names = selection.languages.map((l) => (typeof l === "string" ? l : l?.name)).filter(Boolean) as string[];
    setSelectedLanguages(names);
  };

  const JobPostCard = ({ post, showApplicants = false }: { post: JobPost; showApplicants?: boolean }) => (
    <div className="p-4 transition-shadow border rounded-lg bg-sky-50 border-sky-200 hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="mb-1 text-sky-800">{post.title}</h4>
          <div className="flex items-center gap-4 mb-2 text-sky-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {post.company}
            </span>
            <span>{post.location}</span>
          </div>
        </div>
        <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {post.languages.map((lang) => (
            <Badge key={lang} variant="outline" className="text-xs border-sky-300 text-sky-700">
              {lang}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sky-600">
          {showApplicants && post.applicants && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {post.applicants}명
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {post.date}
          </span>
        </div>
      </div>
    </div>
  );

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
                    <TabsTrigger
                      value="my-posts"
                      className="data-[state=active]:bg-sky-500 data-[state=active]:text-white text-sky-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      작성한 공고
                    </TabsTrigger>
                    <TabsTrigger
                      value="applied"
                      className="data-[state=active]:bg-sky-500 data-[state=active]:text-white text-sky-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      신청한 공고
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="my-posts" className="mt-6">
                    <div className="space-y-4">
                      {myPosts.map((post) => (
                        <JobPostCard key={post.id} post={post} showApplicants />
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="applied" className="mt-6">
                    <div className="space-y-4">
                      {appliedPosts.map((post) => (
                        <JobPostCard key={post.id} post={post} />
                      ))}
                    </div>
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
        onSelectionChange={handleSelectionChange} 
      />
    </div>
  );
}
