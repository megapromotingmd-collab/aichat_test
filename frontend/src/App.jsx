import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000"; // backend URL

function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  // ------------------------------
  // 🔹 API functions
  // ------------------------------
  const getConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/conversations`);
      setConversations(res.data.conversations);
      console.log(" conversations:", res.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const getMessages = async (conversationId) => {
    try {
      const res = await axios.get(`${API_BASE}/messages/${conversationId}`);
      setMessages(res.data.messages.reverse());
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (recipientId, text) => {
    try {
      await axios.post(`${API_BASE}/send-message`, {
        recipientId,
        message: text,
      });

      // Add the new message to the chat view
      setMessages((prev) => [...prev, { from: "You", text }]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // ------------------------------
  // 🔹 Lifecycle effects
  // ------------------------------
  useEffect(() => {
    getConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) getMessages(selectedConversation.conversationId);
  }, [selectedConversation]);

  // ------------------------------
  // 🔹 Handlers
  // ------------------------------
  const handleConversationSelect = (conv) => {
    setSelectedConversation(conv);
    setMessages([]); // reset before loading new messages
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessage(selectedConversation.data.id, messageText);
    setMessageText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // ------------------------------
  // 🔹 UI
  // ------------------------------
  return (
    <div style={styles.container}>
      {/* Left: Conversations */}
      <div style={styles.sidebar}>
        <h2 style={styles.header}>Conversations</h2>
        {conversations.map((conv) => (
          <div
            key={conv.conversationId}
            onClick={() => handleConversationSelect(conv)}
            style={{
              ...styles.conversationItem,
              backgroundColor:
                selectedConversation?.conversationId === conv.conversationId
                  ? "#eee"
                  : "#fff",
            }}
          >
            <b>{conv.data.name}</b>
            <p style={styles.snippet}>{conv.snippet}</p>
          </div>
        ))}
      </div>

      {/* Right: Chat */}
      <div style={styles.chatPanel}>
        {selectedConversation ? (
          <>
            <div style={styles.chatHeader}>
              <h3>{selectedConversation.name}</h3>
            </div>

            <div style={styles.messagesContainer}>
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  style={{
                    ...styles.message,
                    textAlign: msg.from === "You" ? "right" : "left",
                  }}
                >
                  <div
                    style={{
                      ...styles.bubble,
                      backgroundColor:
                        msg.from === "You" ? "#0078FF" : "#E4E6EB",
                      color: msg.from === "You" ? "#fff" : "#000",
                      alignSelf: msg.from === "You" ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.inputContainer}>
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={styles.input}
              />
              <button onClick={handleSend} style={styles.sendButton}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={styles.placeholder}>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

//
// 💅 Styles
//
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: 300,
    borderRight: "1px solid #ccc",
    overflowY: "auto",
  },
  header: {
    padding: 10,
    margin: 0,
    borderBottom: "1px solid #ccc",
  },
  conversationItem: {
    padding: 10,
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0",
  },
  snippet: {
    color: "#555",
    fontSize: 12,
    margin: 0,
  },
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  chatHeader: {
    padding: 10,
    borderBottom: "1px solid #ccc",
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    backgroundColor: "#f9f9f9",
  },
  message: {
    margin: "5px 0",
    display: "flex",
  },
  bubble: {
    maxWidth: "70%",
    padding: "8px 12px",
    borderRadius: 16,
  },
  inputContainer: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #ccc",
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    padding: "10px 20px",
    fontSize: 16,
    backgroundColor: "#0078FF",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  placeholder: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};
