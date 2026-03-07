require('dotenv').config();
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const app = express();
const PORT = process.env.PORT || 56628;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'renderer')));

app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'テキストが必要です' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `以下の日記を読んで、感情分析とアドバイスをしてください。
以下のJSON形式のみで返してください（説明不要）：
{"emotion": "感情ラベル（例：嬉しい・悲しい・不安・怒り・穏やか・疲れ）", "score": 感情の強さ0〜100, "advice": "一言アドバイス（50文字以内）"}

日記：
${text}`,
      }],
    });
    const result = JSON.parse(completion.choices[0].message.content.trim());
    res.json(result);
  } catch (err) {
    console.error('AI分析エラー:', err.message);
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`サーバー起動中: http://localhost:${PORT}`));
}

module.exports = app;
