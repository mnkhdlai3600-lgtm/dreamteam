const BOLOR_BASE_URL = "https://api.chimege.com/v1.2";

const getBolorKey = () => {
  const bolorKey = import.meta.env.VITE_BOLORSPELL_API_KEY;

  if (!bolorKey) {
    throw new Error("VITE_BOLORSPELL_API_KEY missing");
  }

  return bolorKey;
};

const postPlainText = async (endpoint: string, text: string) => {
  const response = await fetch(`${BOLOR_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      token: getBolorKey(),
    },
    body: text,
  });

  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`Bolor error ${response.status}: ${rawText}`);
  }

  let data: unknown = [];
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Bolor JSON parse error on ${endpoint}`);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((item): item is string => typeof item === "string");
};

export const checkWordWithBolor = async (text: string): Promise<string[]> => {
  return postPlainText("spell-check-short", text);
};

export const suggestWithBolor = async (text: string): Promise<string[]> => {
  return postPlainText("spell-suggest", text);
};
