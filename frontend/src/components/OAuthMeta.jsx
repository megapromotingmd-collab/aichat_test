import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function OAuthMeta() {
  const start = async () => {
    const res = await axios.get(`${API_BASE}/oauth/meta/start`);
    const url = res.data.url;
    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Meta OAuth</h3>
      <button onClick={start}>Connect Meta</button>
      <p style={{ color: '#666' }}>After approving, configure the webhook to POST to /api/webhooks/meta and set verify token.</p>
    </div>
  );
}
