import { useEffect, useState } from "react";
import axios from "axios";

const DEFAULT_MODELS = [
  { id: "gpt-4o-mini", label: "gpt-4o-mini (fast, affordable)" },
  { id: "gpt-4o", label: "gpt-4o" },
];

export default function AssistantManager({
  apiBase = "http://localhost:5000",
  selectedAssistantId,
  onSelectAssistant,
}) {
  const [assistants, setAssistants] = useState([]);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [model, setModel] = useState(DEFAULT_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAssistants = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/assistants`);
      setAssistants(res.data.assistants || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !instructions.trim()) return;
    setLoading(true);
    setError("");
    try {
      await axios.post(`${apiBase}/api/assistants`, {
        name,
        instructions,
        model,
      });
      setName("");
      setInstructions("");
      setModel(DEFAULT_MODELS[0].id);
      await loadAssistants();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.createPanel}>
        <h3>Create Assistant</h3>
        <form onSubmit={handleCreate} style={styles.form}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sales Helper"
          />

          <label style={styles.label}>Instructions</label>
          <textarea
            style={{ ...styles.input, height: 120 }}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Be concise, friendly, and helpful..."
          />

          <label style={styles.label}>Model</label>
          <select
            style={styles.input}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {DEFAULT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Assistant"}
          </button>
          {error && <div style={styles.error}>{error}</div>}
        </form>
      </div>

      <div style={styles.listPanel}>
        <h3>Assistants</h3>
        <div style={styles.list}>
          {assistants.length === 0 && (
            <div style={styles.empty}>No assistants yet. Create one above.</div>
          )}
          {assistants.map((a) => (
            <div
              key={a.id}
              onClick={() => onSelectAssistant?.(a)}
              style={{
                ...styles.assistantItem,
                borderColor: selectedAssistantId === a.id ? "#0078FF" : "#ddd",
                background: selectedAssistantId === a.id ? "#f0f7ff" : "#fff",
              }}
            >
              <div style={styles.assistantTitle}>{a.name}</div>
              <div style={styles.assistantMeta}>{a.model}</div>
              <div style={styles.assistantInstr} title={a.instructions}>
                {a.instructions}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: 24,
  },
  createPanel: {
    width: 400,
  },
  listPanel: {
    flex: 1,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    color: "#444",
  },
  input: {
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    padding: "10px 16px",
    background: "#0078FF",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  error: {
    marginTop: 8,
    color: "#b00020",
    fontSize: 13,
  },
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  },
  empty: {
    padding: 12,
    color: "#666",
  },
  assistantItem: {
    padding: 12,
    border: "2px solid #ddd",
    borderRadius: 10,
    cursor: "pointer",
  },
  assistantTitle: {
    fontWeight: 700,
  },
  assistantMeta: {
    color: "#555",
    fontSize: 12,
    marginTop: 2,
  },
  assistantInstr: {
    marginTop: 8,
    color: "#333",
    fontSize: 13,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
};
