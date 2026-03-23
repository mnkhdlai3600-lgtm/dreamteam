export const checkShortTextWithBolor = async (
  text: string,
): Promise<string[]> => {
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

  const rawText = await response.text();

  console.log("BOLOR TEXT:", text);
  console.log("BOLOR STATUS:", response.status);
  console.log("BOLOR RAW:", rawText);

  if (!response.ok) {
    throw new Error(`Bolor error ${response.status}: ${rawText}`);
  }

  const data = JSON.parse(rawText);

  return Array.isArray(data) ? data : [];
};
