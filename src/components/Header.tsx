import { useState } from "react";
import logo from "../assets/images/ic_logo.svg";
import LoginModal from "./modal/LoginModal";

export default function Header() {
  const [showModal, setShowModal] = useState(false);

  return (
    <header className="w-full flex justify-between items-center px-[60px] py-[30px]">
      <div className="flex items-center space-x-1">
        <img src={logo} alt="Gitdeun logo" className="w-8 h-8" />
        <span className="text-2xl font-bold text-sky-900">깃든</span>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="bg-sky-300 text-white px-[24px] py-[12px] rounded-full text-lg font-bold hover:scale-105 transition-transform duration-200 ease-in-out"
      >
        로그인
      </button>

      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </header>
  );
}
