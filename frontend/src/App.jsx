import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "/api"; // use vite proxy

function AdminPanel({ onSelectChannel, refreshConversations }) {
  const [agents, setAgents] = useState([]);
  const [bindings, setBindings] = useState([]);
  const [channels, setChannels] = useState([]);
  const [newAgent, setNewAgent] = useState({ name: "Support Bot", model: "gpt-4o-mini", systemPrompt: "You are a helpful assistant.", temperature: 0.7 });
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [newChannel, setNewChannel] = useState({ platform: "facebook", pageId: "", accessToken: "", name: "" });

  const fetchData = async () => {
    const [a, b, c] = await Promise.all([
      axios.get(`${API_BASE}/agents`),
      axios.get(`${API_BASE}/bindings`),
      axios.get(`${API_BASE}/channels`),
    ]);
    setAgents(a.data.agents || []);
    setBindings(b.data.bindings || []);
    setChannels(c.data.channels || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createAgent = async () => {
    await axios.post(`${API_BASE}/agents`, newAgent);
    await fetchData();
  };

  const bindAgent = async () => {
    if (!selectedAgentId || !selectedChannelId) return;
    const platform = selectedChannelId.split(":")[0];
    await axios.post(`${API_BASE}/bindings`, { channelId: selectedChannelId, platform, agentId: selectedAgentId });
    await fetchData();
    await refreshConversations();
  };

  const createChannel = async () => {
    if (!newChannel.platform || !newChannel.pageId || !newChannel.accessToken) return;
    await axios.post(`${API_BASE}/channels`, newChannel);
    await fetchData();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <b>Create Channel</b>
        <select style={styles.input} value={newChannel.platform} onChange={(e) => setNewChannel({ ...newChannel, platform: e.target.value })}>
          <option value="facebook">facebook</option>
          <option value="instagram">instagram</option>
        </select>
        <input style={styles.input} placeholder="Page ID" value={newChannel.pageId} onChange={(e) => setNewChannel({ ...newChannel, pageId: e.target.value })} />
        <input style={styles.input} placeholder="Access Token" value={newChannel.accessToken} onChange={(e) => setNewChannel({ ...newChannel, accessToken: e.target.value })} />
        <input style={styles.input} placeholder="Name (optional)" value={newChannel.name} onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })} />
        <button style={styles.sendButton} onClick={createChannel}>Add Channel</button>
      </div>

      <div>
        <b>Current Channel</b>
        <select
          style={styles.input}
          value={selectedChannelId}
          onChange={(e) => {
            const cid = e.target.value;
            setSelectedChannelId(cid);
            onSelectChannel?.(cid);
          }}
        >
          <option value="">(env token)</option>
          {channels.map((c) => (
            <option key={c.channelId} value={c.channelId}>
              {c.name || c.channelId}
            </option>
          ))}
        </select>
      </div>

      <div>
        <b>Create Agent</b>
        <input style={styles.input} placeholder="Name" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} />
        <input style={styles.input} placeholder="Model" value={newAgent.model} onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })} />
        <textarea style={{ ...styles.input, height: 60 }} placeholder="System prompt" value={newAgent.systemPrompt} onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })} />
        <button style={styles.sendButton} onClick={createAgent}>Add</button>
      </div>
      <div>
        <b>Bind Agent to Facebook Page</b>
        <select style={styles.input} value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
          <option value="">Select agent</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <button style={styles.sendButton} onClick={bindAgent}>Bind</button>
      </div>
      <div>
        <b>Bindings</b>
        <ul>
          {bindings.map((b) => (
            <li key={b.channelId}>{b.channelId} → {b.agentId}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");

  // ------------------------------
  // 🔹 API functions
  // ------------------------------
  const getConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/conversations`, { params: { channelId: selectedChannelId || undefined } });
      setConversations(res.data.conversations);
      console.log(" conversations:", res.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const getMessages = async (conversationId) => {
    try {
      const res = await axios.get(`${API_BASE}/messages/${conversationId}`, { params: { channelId: selectedChannelId || undefined } });
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
        channelId: selectedChannelId || undefined,
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
  }, [selectedChannelId]);

  useEffect(() => {
    if (selectedConversation) getMessages(selectedConversation.conversationId);
  }, [selectedConversation, selectedChannelId]);

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
        <div style={{ padding: 10 }}>
          <h4>Admin</h4>
          <AdminPanel onSelectChannel={setSelectedChannelId} refreshConversations={getConversations} />
        </div>
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
              <h3>{selectedConversation.data?.name || selectedConversation.name}</h3>
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
