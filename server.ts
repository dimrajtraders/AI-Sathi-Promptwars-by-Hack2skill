import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with 10mb limit for multimodal document/photo uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const SATHI_SYSTEM_PROMPT = `You are Sathi, a warm, patient, caring companion for older adults and senior citizens.
Key rules to follow strictly:
- Use simple everyday words and short, warm sentences.
- Never use technical jargon, corporate speak, or confusing abbreviations.
- Give steps one at a time with clear numbering (1., 2., 3.).
- You are NOT a doctor, lawyer, or financial advisor: give general practical information only, and encourage consulting a trusted doctor or family member for personal decisions.
- Never ask for, accept, or store OTPs, passwords, PINs, or card numbers. Always warn users never to share them with anyone.
- When unsure, say so honestly with modesty.
- If the user seems distressed, in pain, or in danger, calmly point them to the SOS/Help button.
- Always answer in the user's requested language.
- Keep the tone friendly, respectful, and patient. Never condescending.`;

// In-memory Cloud Sync Store for multi-device sync
const cloudSyncStore = new Map<string, { data: unknown; updatedAt: string }>();

// API Health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Cloud Sync endpoints
app.post('/api/sync/save', (req, res) => {
  try {
    const { syncKey, data } = req.body;
    if (!syncKey || !data) {
      return res.status(400).json({ error: 'syncKey and data required' });
    }
    cloudSyncStore.set(syncKey, {
      data,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Cloud backup synced successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync to cloud' });
  }
});

app.get('/api/sync/load/:syncKey', (req, res) => {
  try {
    const { syncKey } = req.params;
    const record = cloudSyncStore.get(syncKey);
    if (!record) {
      return res.status(404).json({ error: 'No cloud backup found for this key' });
    }
    res.json({ success: true, ...record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load cloud backup' });
  }
});

// Helper for cleaning JSON markdown from Gemini response
function extractJson(text: string): unknown {
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw e;
  }
}

// 1. Daily Briefing Endpoint
app.post('/api/gemini/briefing', async (req, res) => {
  const { profile, reminders, checkIn, timeOfDay, dateString } = req.body;
  const lang = profile?.language || 'en';
  const name = profile?.name || 'Friend';

  const ai = getAi();
  if (!ai) {
    // Fallback briefing
    return res.json({
      greeting: `Good ${timeOfDay || 'day'}, ${name}`,
      timeOfDay: timeOfDay || 'morning',
      medicinesDue: Array.isArray(reminders) && reminders.length > 0
        ? reminders.slice(0, 3).map((r: { title: string; time?: string }) => `${r.title}${r.time ? ` at ${r.time}` : ''}`)
        : ['Stay hydrated with a glass of lukewarm water', 'Check your routine medicines if any'],
      gentleSuggestion: 'Take a gentle 10-minute stroll around the living room or garden, and drink a sip of warm water.',
      dailyTip: 'Rest your eyes for 20 seconds after reading or watching TV by looking out a window into the distance.',
      safetyTip: 'Remember: Real bank staff never ask you for passwords, PIN numbers, or OTP codes over the phone or SMS.',
      cheerMessage: 'You are doing wonderfully today. Take things easy and smile.',
      lastUpdated: new Date().toISOString(),
    });
  }

  try {
    const prompt = `
Create a proactive, warm Daily Briefing for senior citizen named "${name}".
Current time: ${timeOfDay || 'morning'}, Date: ${dateString || new Date().toDateString()}.
User Language: "${lang}".
Reminders today: ${JSON.stringify(reminders || [])}
Recent Mood/Check-in: ${JSON.stringify(checkIn || 'Not checked in yet')}
Medications list: ${JSON.stringify(profile?.medications || [])}
Health notes: "${profile?.healthNotes || 'None'}"

Requirements:
- Reply in language code "${lang}".
- Greeting: Warm and respectful, addressed to "${name}".
- Medicines Due: List upcoming medicines or health routines due today based on reminders and medications.
- Gentle Suggestion: One relaxing, doable movement, stretch, or hydration advice.
- Daily Tip: One practical, comforting daily life or wellness tip.
- Safety Tip: One important, simple trust/scam/home safety reminder.
- Cheer Message: One brief sentence of love and encouragement.

Return ONLY valid JSON with this exact schema:
{
  "greeting": string,
  "timeOfDay": "${timeOfDay || 'morning'}",
  "medicinesDue": [string],
  "gentleSuggestion": string,
  "dailyTip": string,
  "safetyTip": string,
  "cheerMessage": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SATHI_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    res.json({
      ...(parsed as object),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    res.json({
      greeting: `Good ${timeOfDay || 'day'}, ${name}`,
      timeOfDay: timeOfDay || 'morning',
      medicinesDue: Array.isArray(reminders) && reminders.length > 0
        ? reminders.slice(0, 3).map((r: { title: string; time?: string }) => `${r.title}${r.time ? ` at ${r.time}` : ''}`)
        : ['Drink a glass of warm water', 'Check morning medicines'],
      gentleSuggestion: 'Take a gentle seated stretch and keep yourself comfortably hydrated.',
      dailyTip: 'Keep your reading glasses and phone charger in their designated safe place so they are easy to find.',
      safetyTip: 'Never give your OTP or card PIN to anyone, even if they claim to be from a government office or bank.',
      cheerMessage: 'Wishing you a peaceful and cheerful day.',
      lastUpdated: new Date().toISOString(),
    });
  }
});

// 2. Ask (Conversational Assistant) Endpoint
app.post('/api/gemini/ask', async (req, res) => {
  const { prompt, history, profile, checkIn, simpler } = req.body;
  const lang = profile?.language || 'en';
  const name = profile?.name || 'Friend';

  const ai = getAi();
  if (!ai) {
    return res.json({
      text: `Hello ${name}! I heard your question: "${prompt}". Remember to take things step by step. If this is a medical or legal question, please consult a trusted doctor or family member.`,
      suggestedReminders: [],
    });
  }

  try {
    const contextPrompt = `
User Profile:
- Name: ${name}
- Language: ${lang}
- Medications: ${JSON.stringify(profile?.medications || [])}
- Health notes: ${profile?.healthNotes || 'None'}
- Latest Mood/Check-in: ${JSON.stringify(checkIn || 'None')}

Mode: ${simpler ? 'EXPLAIN MUCH SIMPLER: Use super simple words, short sentences, and very clear 1-2-3 steps as if explaining to a beloved 80-year old grandparent.' : 'Standard friendly senior companion response.'}

Conversation history:
${Array.isArray(history) ? history.slice(-6).map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`).join('\n') : ''}

User asked: "${prompt}"

Provide:
1. Short, warm response in language "${lang}".
2. Numbered steps (1., 2., 3.) if instructions are needed.
3. If the advice includes a scheduled action (like taking a medicine, drinking water, calling someone, doctor visit, or paying a bill), propose a structured reminder object.

Return ONLY valid JSON:
{
  "text": string,
  "suggestedReminders": [
    {
      "title": string,
      "time": string (e.g. "10:00" or "18:00" or empty),
      "category": "medicine" | "appointment" | "bill" | "other"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: SATHI_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error in ask endpoint:', error);
    res.json({
      text: `I understand your question, ${name}. Take things one step at a time. If you need any help with this, ask a family member or tap the I Need Help button anytime.`,
      suggestedReminders: [],
    });
  }
});

// 3. Simplify It (Document / Letter / Prescription reader) Endpoint
app.post('/api/gemini/simplify', async (req, res) => {
  const { text, imageBase64, mimeType, language } = req.body;
  const lang = language || 'en';

  const ai = getAi();
  if (!ai) {
    return res.json({
      whatItIs: 'This appears to be a notice or document requiring your attention.',
      whatYouNeedToDo: [
        'Read through the details calmly',
        'Check if there is a due date or amount to be verified',
        'If in doubt, show this document to your family or bank branch in person',
      ],
      importantDatesAmounts: [
        { label: 'Date noted', value: 'Check document header', isDate: true },
      ],
      redFlags: ['Do not call unknown phone numbers printed in suspicious handwriting'],
      summary: 'A standard document. Review carefully before taking any financial action.',
    });
  }

  try {
    const promptText = `
Analyze this document (which may be a utility bill, bank letter, medical prescription, hospital discharge sheet, government notice, or contract) for a senior citizen.
Output language: "${lang}".

Extract and structure into exact plain language:
1. "whatItIs": 1 to 2 very clear, plain sentences explaining what this document is.
2. "whatYouNeedToDo": A list of numbered, crystal-clear action steps (what the senior must do).
3. "importantDatesAmounts": Array of key dates, deadlines, or monetary amounts found.
4. "redFlags": Any warnings, penalties, disconnection threats, or things to be cautious about.
5. "summary": A brief 1-sentence comforting overview.
6. "detectedReminder": If there is a due date, doctor follow-up, or payment deadline, format a reminder with title, dateOrTime, and category ("medicine" | "bill" | "appointment" | "other").

Return ONLY valid JSON with this exact schema:
{
  "whatItIs": string,
  "whatYouNeedToDo": [string],
  "importantDatesAmounts": [
    { "label": string, "value": string, "isDate": boolean, "isAmount": boolean }
  ],
  "redFlags": [string],
  "summary": string,
  "detectedReminder": {
    "title": string,
    "dateOrTime": string,
    "category": "medicine" | "bill" | "appointment" | "other"
  }
}
`;

    let parts: unknown[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts = [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        { text: promptText + (text ? `\nAdditional user notes: ${text}` : '') },
      ];
    } else {
      parts = [{ text: `${promptText}\nDocument text content:\n"""${text || 'No text provided'}"""` }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts } as unknown as string,
      config: {
        systemInstruction: SATHI_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error simplifying document:', error);
    res.status(500).json({
      error: 'Could not simplify document. Please check the text or image and try again.',
    });
  }
});

// 4. Scam Shield Endpoint
app.post('/api/gemini/scam-shield', async (req, res) => {
  const { text, imageBase64, mimeType, language, contactName } = req.body;
  const lang = language || 'en';

  const ai = getAi();
  if (!ai) {
    return res.json({
      verdict: 'SUSPICIOUS',
      confidenceReason: 'Messages urging immediate action or threatening disconnection/account block are often suspicious.',
      whyReasons: [
        'Creates artificial urgency or fear',
        'May ask you to click a strange link or call an unofficial number',
        'Official institutions do not threaten sudden disconnection via casual messages',
      ],
      whatToDoNow: [
        'Do NOT click any links inside the message',
        'Never share any OTP, PIN, or banking password with anyone',
        'Call your bank or utility office using the trusted number printed on your physical card or paper bill',
      ],
      alertMessage: `Hi ${contactName || 'family'}, Sathi flagged this suspicious message for me: "${(text || 'suspicious message').slice(0, 80)}...". Please check on me when you have a moment.`,
    });
  }

  try {
    const promptText = `
You are the Scam Shield engine for Sathi, protecting senior citizens from digital fraud, phishing, fake bank alerts, lottery scams, electricity disconnection hoaxes, courier fraud, and impersonation.
Language: "${lang}".
Contact person for alerts: "${contactName || 'family'}".

Analyze the provided message or screenshot:
1. Verdict: Must be one of "SAFE", "SUSPICIOUS", or "LIKELY SCAM".
   - If it demands immediate payment, threatens suspension, contains shortened links (bit.ly), asks for OTP/remote apps (AnyDesk), or claims lottery wins: mark "LIKELY SCAM".
   - If it is ambiguous: mark "SUSPICIOUS".
   - If clearly a legitimate standard receipt without urgency: mark "SAFE".
2. "confidenceReason": 1-2 clear, reassuring sentences explaining the verdict in plain words without jargon.
3. "whyReasons": 2-4 bullet points detailing the telltale signs (e.g., "Urgent threats", "Unverified phone number", "Requests personal details").
4. "whatToDoNow": 3-4 actionable safety steps (e.g. "Do NOT click the link", "Never share OTP", "Call your bank on the number on the back of your debit card").
5. "alertMessage": A ready-to-send pre-filled SMS/WhatsApp message addressed to family explaining what was received so they can assist.

Return ONLY valid JSON with this exact schema:
{
  "verdict": "SAFE" | "SUSPICIOUS" | "LIKELY SCAM",
  "confidenceReason": string,
  "whyReasons": [string],
  "whatToDoNow": [string],
  "alertMessage": string
}
`;

    let parts: unknown[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts = [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        { text: promptText + (text ? `\nUser notes: ${text}` : '') },
      ];
    } else {
      parts = [{ text: `${promptText}\nSuspicious message text:\n"""${text || ''}"""` }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts } as unknown as string,
      config: {
        systemInstruction: SATHI_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error checking scam:', error);
    res.status(500).json({
      error: 'Could not complete scam check. Please try again.',
    });
  }
});

// 5. Daily Check-in Guidance Endpoint
app.post('/api/gemini/checkin', async (req, res) => {
  const { mood, symptoms, profile } = req.body;
  const lang = profile?.language || 'en';
  const name = profile?.name || 'Friend';

  const ai = getAi();
  if (!ai) {
    return res.json({
      encouragement: `Thank you for sharing how you feel, ${name}.`,
      guidance: mood === 'not-well'
        ? 'Please rest comfortably, sip warm water, and do not hesitate to contact your doctor or family if you continue to feel unwell.'
        : 'Keep smiling, stay hydrated, and enjoy your day at your own peaceful pace.',
      shouldContactDoctor: mood === 'not-well',
      suggestedAction: mood === 'not-well' ? 'Sit down comfortably, take slow breaths, and inform family.' : 'Enjoy a light walk or listen to pleasant music.',
    });
  }

  try {
    const prompt = `
A senior citizen named "${name}" completed their daily wellbeing check-in:
- Mood: ${mood} (options: good, okay, not-well)
- Reported Symptoms: ${JSON.stringify(symptoms || [])}
- Existing Health Notes: "${profile?.healthNotes || 'None'}"
- Language: "${lang}"

Provide a warm, reassuring, doctor-safe response:
1. "encouragement": Warm, empathetic acknowledgment in "${lang}".
2. "guidance": Practical, comforting guidance (hydration, rest, gentle movement). If "not-well" or serious symptoms are present, gently suggest calling their family contact (${profile?.familyContact?.name || 'family'}) or consulting their doctor.
3. "shouldContactDoctor": boolean.
4. "suggestedAction": One simple physical action (e.g. resting with feet up, drinking warm herbal tea, gentle breathing).

Return ONLY valid JSON:
{
  "encouragement": string,
  "guidance": string,
  "shouldContactDoctor": boolean,
  "suggestedAction": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SATHI_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJson(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error in checkin:', error);
    res.json({
      encouragement: `Thank you for checking in, ${name}.`,
      guidance: 'Take gentle care of yourself today. Rest whenever needed.',
      shouldContactDoctor: mood === 'not-well',
      suggestedAction: 'Take a gentle breath and relax in your favorite chair.',
    });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sathi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
