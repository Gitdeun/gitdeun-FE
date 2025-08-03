import Github from "../../assets/images/ic_github.png";
import Google from "../../assets/images/ic_google.png";
import { X } from "lucide-react";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white px-[60px] py-[80px] rounded-lg shadow-lg relative min-w-[400px]">
        <button
          onClick={onClose}
          className="absolute text-gray-500 top-5 right-5 hover:text-black"
        >
          <X />
        </button>
        <div className="flex flex-col gap-[40px]">
          <div className="flex flex-col text-left">
            <span className="font-bold text-[40px]">Login</span>
            <span className="text-2xl font-medium">깃든에 오신 것을 환영합니다.</span>
          </div>
          <div className="flex flex-col gap-[22px]">
            <button className="border-sky-400 border font-medium flex gap-[16px] items-center rounded-md px-[60px] py-[8px] text-sky-400 w-[350px]"
             onClick={() => {
              window.location.href = "http://localhost:8080/oauth2/authorization/google";
            }}>
              <img src={Google} alt="Google logo" className="w-[28px] h-[28px]" />
              Google 계정으로 로그인
            </button>
            <button className="font-medium flex gap-[16px] items-center rounded-md px-[60px] py-[8px] text-white bg-black w-[350px]"
            onClick={() => {
              window.location.href = "http://localhost:8080/oauth2/authorization/github";
            }}>
              
              <img src={Github} alt="Github logo" className="w-[28px] h-[28px]" />
              Github 계정으로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
