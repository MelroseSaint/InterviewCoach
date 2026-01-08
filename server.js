const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/generate', async (req, res) => {
    const { input, config } = req.body;
    const { role = "professional", industry = "corporate", experience = "mid" } = config || {};

    const prompt = `You are a real-time interview coach. Provide a concise answer (3-5 sentences, under 75 words) to this interview question: "${input}". The candidate is applying for ${role} in ${industry}, with ${experience} level experience. Answer professionally and directly. Keep it short and natural.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
            res.json({ response: data.candidates[0].content.parts[0].text.trim() });
        } else {
            res.status(500).json({ error: "Failed to generate response" });
        }
    } catch (error) {
        console.error('AI call failed:', error);
        res.status(500).json({ error: "Error generating response" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});