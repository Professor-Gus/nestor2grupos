import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standard ESM relative paths fallback (safe for both CommonJS and ESM)
const _filename = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "";
const _dirname = _filename ? path.dirname(_filename) : "";

const app = express();
const portArgIndex = process.argv.indexOf("--port");
const argPort = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
const PORT = argPort || envPort || 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// API health endpoint for probes and dev server health verification
app.all(["/api/health", "/health"], (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Initialize Gemini SDK with telemetry User-Agent
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("System: Gemini SDK initialized successfully.");
  } else {
    console.warn("System WARNING: GEMINI_API_KEY is not defined. AI matching will be unavailable.");
  }
} catch (err) {
  console.error("System ERROR: Failed to initialize Gemini SDK:", err);
}

// REST route for matching natural user input with defined triggers
app.post("/api/gemini/analyze", async (req, res): Promise<any> => {
  const { input, triggers } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "O campo 'input' é obrigatório e deve ser texto." });
  }

  // Fallback / fast direct matching before waiting on external AI call
  const normalizedInput = input.trim().toLowerCase();
  const directMatched = triggers?.find((t: any) => {
    const phrase = t.phrase?.trim().toLowerCase();
    return phrase && (normalizedInput.includes(phrase) || phrase.includes(normalizedInput));
  });

  if (directMatched) {
    return res.json({
      matchedTriggerId: directMatched.id,
      confidence: 1.0,
      response: `Gatilho "${directMatched.phrase}" acionado.`
    });
  }

  if (!ai) {
    return res.json({
      matchedTriggerId: null,
      confidence: 0.0,
      response: "O canal de IA está indisponível. Diga ou clique em uma das quatro frases do grupo ativo."
    });
  }

  try {
    const triggerScenarios = triggers?.map((t: any) => `ID: "${t.id}" | Frase de ativação: "${t.phrase}" | Descrição do Canal: "${t.description || 'Nenhuma'}"`).join("\n") || "Nenhum trigger configurado.";

    const systemInstruction = `Você é o classificador semântico da plataforma "Assistentes da Natureza — Escola Nestor de Camargo" (Curso de Ambientes Inteligentes).
Sua única e exclusiva tarefa é classificar a fala/texto do usuário comparando-a de forma semântica com os gatilhos pré-configurados ("triggers") do grupo selecionado.
Você não deve inventar comandos, misturar outros grupos ou bater papo sobre outros assuntos alheios. Se o usuário disser algo que não se assemelhe a nenhum gatilho listado, você deve obrigatoriamente retornar matchedTriggerId: null.

Triggers cadastrados para o grupo ativo:
${triggerScenarios}

INSTRUÇÕES E REGRAS:
1. Examine a fala/texto do usuário. Compare a intenção com os gatilhos cadastrados. Atribua o matchedTriggerId correspondente apenas se a confiança / similaridade semântica for de pelo menos 0.70.
2. Se a similaridade for menor que 0.70 ou o assunto for diferente dos gatilhos do grupo, retorne obrigatoriamente matchedTriggerId como null e confiança de 0.0.
3. Elabore uma mensagem clara e concisa em português para "response". Se um trigger foi ativado, confirme brevemente a reprodução do vídeo correspondente. Se NÃO houver correspondência (matchedTriggerId is null), oriente o usuário a falar uma das quatro frases do grupo atual.`;

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Mensagem ou comando recebido do usuário: "${input}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchedTriggerId: {
                type: Type.STRING,
                description: "O ID do trigger semântica correspondente. Caso nenhuma se assemelhe na intenção com pontuação acima de 0.65, retorne null."
              },
              confidence: {
                type: Type.NUMBER,
                description: "Pontuação flutuante de confiança do casamento de intenção de 0.0 a 1.0."
              },
              response: {
                type: Type.STRING,
                description: "Mensagem clara e concisa em português confirmando a ação ou orientando o usuário."
              }
            },
            required: ["matchedTriggerId", "confidence", "response"]
          }
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI request timeout")), 5000))
    ]);

    const data = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      matchedTriggerId: data.matchedTriggerId || null,
      confidence: data.confidence || 0,
      response: data.response || "Tente falar novamente uma das frases do grupo ativo."
    });

  } catch (err: any) {
    console.error("System ERROR inside /api/gemini/analyze:", err);
    return res.json({
      matchedTriggerId: null,
      confidence: 0,
      response: "Não foi possível conectar ao classificador de IA. Fale ou clique em uma das frases do grupo ativo."
    });
  }
});

// Dedicated REST route for environmental assistant contextual Q&A
app.post("/api/gemini/assistant", async (req, res): Promise<any> => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "O campo 'question' é obrigatório." });
  }

  if (!ai) {
    return res.json({
      answer: "Olá! O sistema está operando localmente para a apresentação de Ambientes Inteligentes da Escola Nestor de Camargo."
    });
  }

  try {
    const systemInstruction = `Você é a assistente da plataforma "Assistentes da Natureza — Escola Nestor de Camargo" (Curso: Ambientes Inteligentes).
Instruções de resposta:
1. Responda de forma educativa, tecnológica, amigável e focada em IoT, inteligência artificial, monitoramento ambiental e nos biomas Pantanal e Amazônia.
2. Seja conciso (máximo de 3 frases).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Pergunta do operador humano: "${question}"`,
      config: {
        systemInstruction,
        maxOutputTokens: 250,
      }
    });

    const answerText = response.text?.trim() || "Análise computacional incompleta. Por favor, reinicie meu transmissor neural.";
    return res.json({
      answer: answerText
    });

  } catch (err: any) {
    console.error("System ERROR inside /api/gemini/assistant:", err);
    return res.status(500).json({
      answer: "Interferência eletromagnética detectada em meus circuitos analógicos de conversação. Repita a pergunta, por favor.",
      details: err.message
    });
  }
});

// Dedicated REST route for Mobile Audio Recording Transcription via Gemini
app.post("/api/transcribe-audio", async (req, res): Promise<any> => {
  const { audioData, mimeType } = req.body;

  if (!audioData || typeof audioData !== "string") {
    return res.status(400).json({ error: "O campo 'audioData' (base64) é obrigatório." });
  }

  if (!ai) {
    return res.status(503).json({
      error: "O módulo neural de IA do servidor não está conectado. Ative a chave de API.",
      transcript: ""
    });
  }

  try {
    const cleanBase64 = audioData.includes(",") ? audioData.split(",")[1] : audioData;
    const finalMime = mimeType || "audio/webm";

    // Transcribe with gemini-2.5-flash which natively processes audio inputs
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          inlineData: {
            mimeType: finalMime,
            data: cleanBase64,
          }
        },
        {
          text: "Você é um sistema transcritor de voz em português brasileiro (pt-BR). Transcreva com máxima precisão o que foi falado pelo usuário neste áudio. Retorne APENAS o texto da fala transcrita, sem introduções, sem formatações extras, sem aspas e sem pontuação desnecessária. Se não houver fala clara ou apenas ruído de fundo, retorne uma string vazia."
        }
      ]
    });

    const transcript = response.text?.trim() || "";
    return res.json({ transcript });
  } catch (err: any) {
    console.error("System ERROR inside /api/transcribe-audio:", err);
    return res.status(500).json({
      error: "Erro na transcrição de áudio via IA",
      details: err.message,
      transcript: ""
    });
  }
});

// Configure Vite middleware in development, or Static Files serving in Production
async function bootstrap() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("System: Vite Middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("System: Serving production static assets from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`System: Assistentes da Natureza Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
