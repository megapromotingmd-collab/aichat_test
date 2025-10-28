import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");

  const load = async () => {
    const res = await axios.get(`${API_BASE}/agents`);
    setAgents(res.data.agents);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    await axios.post(`${API_BASE}/agents`, { name, systemPrompt });
    setName("");
    await load();
  };

  const remove = async (id) => {
    await axios.delete(`${API_BASE}/agents/${id}`);
    await load();
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Agents</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="System prompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} style={{ flex: 1 }} />
        <button onClick={create}>Create</button>
      </div>
      <ul>
        {agents.map(a => (
          <li key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{a.name}</span>
            <span style={{ color: '#666' }}>{a.model}</span>
            <button onClick={() => remove(a.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
