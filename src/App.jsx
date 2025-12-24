import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import './App.css'

function App() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null); // 상세보기 모달
  const [showForm, setShowForm] = useState(false); // 음식 추가 모달

  // 입력 폼 상태
  const [newName, setNewName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedFood, setSelectedFood] = useState("🍗");

  const foodIcons = [
    "🍗", "🍕", "🍔", "🍣", "🍰", "🍷",
    "🍝", "🥨", "🍮", "🥗", "🥪", "🍩",
    // 🎄 Christmas vibes
    "🍪", // 크리스마스 쿠키
    "🦃", // 터키
    "🥧", // 파이
    "🎂", // 케이크
    "🧁", // 컵케이크
    "🍫", // 초콜릿
    "🍬", // 사탕
    "☕️", // 핫초코 / 따뜻한 음료 느낌
];

  // 데이터 불러오기 (최신순)
  const fetchData = async () => {
    try {
      const q = query(collection(db, "message"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    } catch (err) {
      console.error("데이터 로드 에러:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 등록 로직 (금지어 포함)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. 금지어 필터링
    const badWords = ["시발", "씨발", "병신", "존나", "개새끼", "이기야", "노무", "운지", "섹스", "자지", "보지", "엠창"];
    const cleanName = newName.replace(/\s+/g, "");
    const cleanMessage = newMessage.replace(/\s+/g, "");
    const isBad = badWords.some(word => cleanName.includes(word) || cleanMessage.includes(word));

    if (isBad) return alert("식탁에 어울리지 않는 예쁜 말을 사용해 주세요! 😊");
    if (!newName.trim() || !newMessage.trim()) return alert("이름과 메시지를 입력해주세요!");

    // 2. 작성자 고유 ID 생성 (삭제 권한용)
    const authorCode = Math.random().toString(36).substring(2, 11);

    try {
      await addDoc(collection(db, "message"), {
        name: newName,
        food: selectedFood,
        message: newMessage,
        authorId: authorCode,
        createdAt: new Date()
      });

      // 내 브라우저 저장소에 작성 권한 코드 저장
      const myPosts = JSON.parse(localStorage.getItem("myFoodPosts") || "[]");
      myPosts.push(authorCode);
      localStorage.setItem("myFoodPosts", JSON.stringify(myPosts));

      // 성공 후 초기화
      setNewName(""); setNewMessage(""); setSelectedFood("🍗");
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert("전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 삭제 로직
  const handleDelete = async (id) => {
    if (window.confirm("정말 이 음식을 식탁에서 치울까요?")) {
      await deleteDoc(doc(db, "message", id));
      setSelected(null);
      fetchData();
    }
  };

  // 본인 확인 (로컬 스토리지 대조)
  const isMyPost = (postAuthorId) => {
    const myPosts = JSON.parse(localStorage.getItem("myFoodPosts") || "[]");
    const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";
    return myPosts.includes(postAuthorId) || isAdmin;
  };

  return (
    <div className="room-container">
      <h1>🎄 우리들의 크리스마스 식탁 🎄</h1>
      
      <div className="white-table">
        {/* 중앙 장식 문구 */}
        <div className="centerpiece">Merry<br/>Christmas</div>
        
        {messages.map((item) => (
          <div key={item.id} className="plate" onClick={() => setSelected(item)}>
            <span className="food-icon">{item.food || "🎁"}</span>
            <span className="owner-name">{item.name}</span>
          </div>
        ))}
      </div>

      {/* 우측 하단 플러스 버튼 */}
      <button className="floating-add-btn" onClick={() => setShowForm(true)}>+</button>

      {/* [모달 1] 음식 추가 폼 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🍽️ 내 음식 올리기</h2>
            <form onSubmit={handleSubmit} className="form-style">
              <label>작성자 이름</label>
              <input 
                className="form-input" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="이름을 입력하세요"
                maxLength={8}
              />
              
              <label>음식 아이콘</label>
              <div className="icon-grid">
                {foodIcons.map(icon => (
                  <span 
                    key={icon} 
                    className={selectedFood === icon ? "icon-item active" : "icon-item"} 
                    onClick={() => setSelectedFood(icon)}
                  >
                    {icon}
                  </span>
                ))}
              </div>

              <label>메시지</label>
              <textarea 
                className="form-input" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="친구들에게 남길 한마디"
                maxLength={100}
              />
              
              <div className="btn-group">
                <button type="submit" className="submit-btn">식탁에 올리기</button>
                <button type="button" className="close-btn" onClick={() => setShowForm(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* [모달 2] 상세 보기 및 삭제 */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{fontSize: '4.5rem', marginBottom: '10px'}}>{selected.food}</div>
            <h2 style={{color: '#333'}}>{selected.name}님의 음식</h2>
            <p className="msg-text">"{selected.message}"</p>
            
            <div className="btn-group">
              <button className="close-btn" onClick={() => setSelected(null)}>닫기</button>
              {isMyPost(selected.authorId) && (
                <button className="delete-btn" onClick={() => handleDelete(selected.id)}>치우기</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;