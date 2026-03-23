export const correctWithOpenAI = async (text: string): Promise<string> => {
  console.log("OPENAI KEY EXISTS:", !!import.meta.env.VITE_OPENAI_API_KEY);
  console.log("OPENAI TEXT:", text);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Чи монгол хэлний бичвэр засварлагч. Хэрэв галиг байвал кирилл болго. Хэрэв зөв бичгийн эсвэл найруулгын алдаа байвал зас. Зөвхөн эцсийн зассан текстээ л буцаа. Тайлбар битгий нэм.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0,
    }),
  });

  console.log("OPENAI STATUS:", response.status);

  const raw = await response.text();
  console.log("OPENAI RAW:", raw);

  let data: any = {};
  try {
    data = JSON.parse(raw);
  } catch {}

  if (!response.ok) {
    throw new Error(data?.error?.message || raw || "OpenAI алдаа гарлаа");
  }

  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI хариу хоосон байна");
  }

  return content;
};
