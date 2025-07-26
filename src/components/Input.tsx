// components/input.tsx
import { useState } from "react";

interface CommentInputProps {
  onSubmit: (text: string) => void;
}

export function CommentInput({ onSubmit }: CommentInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSubmit(text);
      setText("");
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="댓글 입력..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleSend}>전송</button>
    </div>
  );
}
