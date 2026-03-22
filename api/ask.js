export default async function handler(req, res) {
  try {
    const { query, data } = req.body;

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are Infinity AI, an intelligent assistant built into OpenDots.
Always respond in a single <div>.
User query: ${query}
Data: ${JSON.stringify(data || {})}
                    `,
                },
              ],
            },
          ],
        }),
      },
    );

    const j = await r.json();

    if (!r.ok) {
      return res.status(500).json({ error: j.error?.message });
    }

    const reply = j.candidates?.[0]?.content?.parts?.[0]?.text;

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
