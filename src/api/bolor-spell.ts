export const checkShortTextWithBolor = async (
  text: string,
): Promise<string[]> => {
  console.log("=== BOLOR FUNCTION START ===");
  console.log("BOLOR INPUT:", text);
  console.log("BOLOR TOKEN EXISTS:", !!import.meta.env.VITE_BOLORSPELL_API_KEY);

  const response = await fetch("https://api.bolor.net/v1.2/spell-check-short", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_BOLORSPELL_API_KEY}`,
    },
    body: JSON.stringify({
      text,
    }),
  });

  console.log("BOLOR RESPONSE STATUS:", response.status);

  const rawText = await response.text();
  console.log("BOLOR RAW RESPONSE:", rawText);

  if (!response.ok) {
    throw new Error(`Bolor error ${response.status}: ${rawText}`);
  }

  const data = JSON.parse(rawText);
  console.log("BOLOR PARSED DATA:", data);

  return Array.isArray(data) ? data : [];
};
