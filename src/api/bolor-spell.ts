export const getBolorSpellSuggestions = async (
  word: string,
): Promise<string[]> => {
  const response = await fetch("https://api.bolor.net/v1.2/spell-suggest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_BOLORSPELL_API_KEY}`,
    },
    body: JSON.stringify({
      word,
    }),
  });

  const rawText = await response.text();

  console.log("BOLORSPELL WORD:", word);
  console.log("BOLORSPELL STATUS:", response.status);
  console.log("BOLORSPELL RAW:", rawText);

  if (!response.ok) {
    throw new Error(`Bolorspell error ${response.status}: ${rawText}`);
  }

  const data = JSON.parse(rawText);

  if (Array.isArray(data)) {
    return data;
  }

  return [];
};
