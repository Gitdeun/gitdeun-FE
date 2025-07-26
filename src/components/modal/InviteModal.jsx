import PropTypes from "prop-types";

export function InviteModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{background: "rgba(0,0,0,0.5)", position:"fixed", top:0,left:0,right:0,bottom:0}}>
      <div style={{background:"#fff", margin:"100px auto", padding:20, width:300}}>
        <h2>초대하기</h2>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}


InviteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
