export interface ParsedScreenshotRow {
  nickname: string;
  kills: number;
  deaths: number;
  assists: number;
  mvp_status: boolean;
  damage: number;
}

const GEMINI_MODEL = process.env.GEMINI_OCR_MODEL || 'gemini-2.0-flash';

const getGeminiKey = (): string =>
  (
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();

const cleanJsonText = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1).trim();
  }
  return text.trim();
};

const normalizeParsedRow = (item: any): ParsedScreenshotRow => ({
  nickname: String(item?.nickname || '').trim(),
  kills: Math.max(0, Number(item?.kills || 0)),
  deaths: Math.max(0, Number(item?.deaths || 0)),
  assists: Math.max(0, Number(item?.assists || 0)),
  mvp_status: Boolean(item?.mvp_status),
  damage: Math.max(0, Number(item?.damage || 0))
});

const validateRows = (rows: ParsedScreenshotRow[]) =>
  rows.filter((row) => row.nickname.length > 0);

export const parseMatchScreenshotWithGemini = async (
  imageBuffer: Buffer,
  mimeType: string
): Promise<ParsedScreenshotRow[]> => {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!imageBuffer || !imageBuffer.length) {
    throw new Error('Image buffer is required');
  }

  // Keep SDK dynamic to avoid compile-time module type coupling.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = [
    'You are an OCR parser for esports scoreboard screenshots.',
    'Return ONLY a JSON array. No markdown. No commentary.',
    'Each item format:',
    '{ "nickname": string, "kills": number, "deaths": number, "assists": number, "mvp_status": boolean, "damage": number }',
    'If a field is missing on screenshot, use 0 for numbers and false for mvp_status.'
  ].join('\n');

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType || 'image/jpeg'
      }
    },
    prompt
  ]);

  const responseText = String(result?.response?.text?.() || '').trim();
  if (!responseText) {
    throw new Error('Gemini returned empty OCR response');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJsonText(responseText));
  } catch (error) {
    throw new Error('Gemini OCR response is not valid JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini OCR response must be a JSON array');
  }

  const normalized = validateRows(parsed.map(normalizeParsedRow));
  if (!normalized.length) {
    throw new Error('No valid players detected in screenshot');
  }
  console.info(`[ocr-ai] provider=gemini model=${GEMINI_MODEL} rows=${normalized.length}`);

  return normalized;
};
