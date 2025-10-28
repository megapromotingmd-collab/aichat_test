import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function Bindings() {
  const [bindings, setBindings] = useState([]);
  const [platform, setPlatform] = useState("facebook");
  const [pageId, setPageId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [agents, setAgents] = useState([]);

  const load = async () => {
    const [b, a] = await Promise.all([
      axios.get(`${API_BASE}/bindings`),
      axios.get(`${API_BASE}/agents`),
    ]);
    setBindings(b.data.bindings);
    setAgents(a.data.agents);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!platform || !agentId) return;
    await axios.post(`${API_BASE}/bindings`, { platform, pageId, threadId, agentId });
    setPageId("");
    setThreadId("");
    await load();
  };

  const remove = async (id) => {
    await axios.delete(`${API_BASE}/bindings/${id}`);
    await load();
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Bindings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        <select value={platform} onChange={e => setPlatform(e.target.value)}>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
        </select>
        <input placeholder="Page ID (optional)" value={pageId} onChange={e => setPageId(e.target.value)} />
        <input placeholder="Thread ID (user PSID)" value={threadId} onChange={e => setThreadId(e.target.value)} />
        <select value={agentId} onChange={e => setAgentId(e.target.value)}>
          <option value="">Select agent</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <button onClick={create}>Create Binding</button>
      </div>
      <ul>
        {bindings.map(b => (
          <li key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{b.platform}</span>
            <span>page {b.pageId || '-'}</span>
            <span>thread {b.threadId || '-'}</span>
            <span>agent {b.agentId}</span>
            <button onClick={() => remove(b.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
