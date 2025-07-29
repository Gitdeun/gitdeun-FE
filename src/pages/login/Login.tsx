import login1 from "../../assets/images/ic_visualize.svg";
import login2 from "../../assets/images/ic_collaborate.svg";
import login3 from "../../assets/images/ic_suggest.svg";

export default function Login() {

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col items-center w-full mt-[120px] gap-6">
        <div className="text-[40px] font-medium text-center">
          <span className="font-bold">하나의 깃허브 링크</span>로<br />
          모든 아이디어가 확장됩니다.
        </div>
        <button className="bg-sky-100 text-sky-600 font-bold text-lg px-[24px] py-[12px] rounded-full hover:scale-105 transition-transform duration-200">
          마인드맵 만들러가기
        </button>
      </div>

      <div className="flex gap-[28px] mt-[150px]">
        <div className="flex flex-col gap-6 w-[330px] items-center justify-between text-center">
          <img src={login1} alt="visualize icon" className="w-11 h-11" />
          <div className="text-2xl font-bold">visualize</div>
          <div className="font-normal text-base">한 줄의 링크가<br/>코드의 구조를 시각으로 바꿔줍니다</div>
        </div>
        <div className="w-px h-[172px] bg-gray-400"></div>
        <div className="flex flex-col gap-6 w-[330px] items-center justify-between text-center">
          <img src={login2} alt="visualize icon" className="w-11 h-11" />
          <div className="text-2xl font-bold">collaborate</div>
          <div className="font-normal text-base">코드를 함께 보고<br/>생각을 자연스럽게 나눕니다</div>
        </div>
        <div className="w-px h-[172px] bg-gray-400"></div>
        <div className="flex flex-col gap-6 w-[330px] items-center justify-between text-center">
          <img src={login3} alt="visualize icon" className="w-11 h-11" />
          <div className="text-2xl font-bold">suggest</div>
          <div className="font-normal text-base">회의에서 나눈 이야기들이<br/>AI의 코드 추천으로 이어집니다</div>
        </div>
      </div>
    </div>
  );
}
