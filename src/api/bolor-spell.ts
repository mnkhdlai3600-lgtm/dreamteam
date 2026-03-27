export const suggestWithBolor = async (text: string): Promise<string[]> => {
  const bolorKey = import.meta.env.VITE_BOLORSPELL_API_KEY;

  console.log("BOLOR KEY EXISTS:", !!bolorKey);
  console.log("BOLOR KEY LENGTH:", bolorKey?.length ?? 0);
  console.log(
    "BOLOR KEY PREVIEW:",
    bolorKey ? `${bolorKey.slice(0, 6)}...` : "missing",
  );

  const response = await fetch("https://api.chimege.com/v1.2/spell-suggest", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      token: bolorKey,
    },
    body: text,
  });

  const rawText = await response.text();

  console.log("BOLOR INPUT:", text);
  console.log("BOLOR STATUS:", response.status);
  console.log("BOLOR RAW:", rawText);

  if (!response.ok) {
    throw new Error(`Bolor error ${response.status}: ${rawText}`);
  }

  let data: unknown = [];
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Bolor JSON parse error");
  }

  return Array.isArray(data) ? data.filter((v) => typeof v === "string") : [];
};
