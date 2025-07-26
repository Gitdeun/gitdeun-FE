
interface AlarmProps {
  message: string;
  onDelete: () => void;
}

export function Alarm({ message, onDelete }: AlarmProps) {
  return (
    <div style={{border: '1px solid red', padding: 8, marginBottom: 5}}>
      {message}
      <button onClick={onDelete} style={{marginLeft: 10}}>삭제</button>
    </div>
  );
}
