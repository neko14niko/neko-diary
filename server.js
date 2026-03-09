require('dotenv').config();
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const app = express();
const PORT = process.env.PORT || 56628;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'renderer')));

app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
});

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

// チャット
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'メッセージが必要です' });
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'あなたは日記を書く手助けをする優しいAIアシスタントです。ユーザーの話を聞いて、今日あったことや気持ちを引き出してください。日本語で話してください。' },
        ...messages,
      ],
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('チャットエラー:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 会話を日記に要約
app.post('/api/summarize', async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'メッセージが必要です' });
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `以下の会話をもとに、日記の文章として自然にまとめてください。一人称（私）で書き、です・ます調で。会話の要点を押さえて200文字程度にしてください。説明や前置きは不要です。

会話：
${messages.map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`).join('\n')}`,
      }],
    });
    res.json({ summary: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error('要約エラー:', err.message);
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`サーバー起動中: http://localhost:${PORT}`));
}

module.exports = app;
