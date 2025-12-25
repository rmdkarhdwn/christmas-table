import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import './App.css'

function App() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedFood, setSelectedFood] = useState("🍗");

  const foodIcons = ["🍗", "🍕", "🍔", "🍣", "🍰", "🍷", "🍝", "🥨", "🍮", "🥗", "🥪", "🍩", "🍪", "🦃", "🥧", "🎂", "🧁", "🍫", "🍬", "☕️"];

  const fetchData = async () => {
    try {
      const q = query(collection(db, "message"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 중복 체크
    const myPosts = JSON.parse(localStorage.getItem("myFoodPosts") || "[]");
    if (myPosts.length >= 1) return alert("이미 음식을 올리셨어요! 😊");

    const badWords = ["시발", "씨발", "병신", "존나", "개새끼"]; // 필요시 추가
    if (badWords.some(word => newName.includes(word) || newMessage.includes(word))) {
      return alert("예쁜 말을 사용해 주세요! 😊");
    }

    if (!newName.trim() || !newMessage.trim()) return alert("모두 입력해주세요!");

    const authorCode = Math.random().toString(36).substring(2, 11);
    try {
      await addDoc(collection(db, "message"), {
        name: newName,
        food: selectedFood,
        message: newMessage,
        authorId: authorCode,
        createdAt: new Date()
      });
      localStorage.setItem("myFoodPosts", JSON.stringify([authorCode]));
      setNewName(""); setNewMessage(""); setShowForm(false);
      fetchData();
    } catch (err) { alert("전송 실패"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 이 음식을 치울까요?")) {
      await deleteDoc(doc(db, "message", id));
      localStorage.removeItem("myFoodPosts"); // 다시 작성 가능하게 삭제
      setSelected(null);
      fetchData();
    }
  };

  const isMyPost = (postAuthorId) => {
    const myPosts = JSON.parse(localStorage.getItem("myFoodPosts") || "[]");
    const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";
    return myPosts.includes(postAuthorId) || isAdmin;
  };

  return (
    <div className="room-container">
      <h1>🎄 우리들의 크리스마스 식탁 🎄</h1>
      <div className="white-table">
        <div className="centerpiece">Merry<br/>Christmas</div>
        {messages.map((item) => (
          <div key={item.id} className="plate" onClick={() => setSelected(item)}>
            <span className="food-icon">{item.food}</span>
            <span className="owner-name">{item.name}</span>
          </div>
        ))}
      </div>
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