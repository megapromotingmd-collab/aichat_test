// backend/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Get list of conversations
app.get("/conversations", async (req, res) => {
    try {
        /*const response = await axios.get(
            `https://graph.facebook.com/v20.0/me/conversations?access_token=${PAGE_ACCESS_TOKEN}`
        );*/

        const response = await axios.get(
            `https://graph.facebook.com/v20.0/me/conversations?fields=participants.limit(10){id,name}&access_token=${PAGE_ACCESS_TOKEN}`
        );

        // Optional: extract only id and snippet
        const conversations = response.data.data.map((conv) => ({
            conversationId: conv.id,
            data: conv.participants.data[0],//name, email, id
            snippet: conv.snippet,
        }));
        console.error("conversations:", response.data);
        res.json({ conversations });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// Send message endpoint (same as before)
app.post("/send-message", async (req, res) => {
    const { recipientId, message } = req.body;

    if (!recipientId || !message) {
        return res.status(400).json({ error: "recipientId and message are required" });
    }

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            {
                messaging_type: "RESPONSE",
                recipient: { id: recipientId },
                message: { text: message },
            }
        );

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Get all messages in a conversation
app.get("/messages/:conversationId", async (req, res) => {
    const { conversationId } = req.params;
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v20.0/${conversationId}/messages?fields=from,message,created_time&access_token=${PAGE_ACCESS_TOKEN}`
        );

        const messages = response.data.data.map(msg => ({
            id: msg.id,
            from: msg.from.name,
            fromId: msg.from.id,
            text: msg.message,
            time: msg.created_time
        }));

        res.json({ messages });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});
