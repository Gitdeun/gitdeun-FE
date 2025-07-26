import PropTypes from "prop-types";

export function AlarmDeleteModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div style={{background: "rgba(0,0,0,0.5)", position:"fixed", top:0,left:0,right:0,bottom:0}}>
      <div style={{background:"#fff", margin:"100px auto", padding:20, width:300}}>
        <h2>알람을 삭제하시겠습니까?</h2>
        <button onClick={onConfirm}>삭제</button>
        <button onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}
AlarmDeleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};