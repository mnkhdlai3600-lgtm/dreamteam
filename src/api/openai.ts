export const correctWithOpenAI = async (text: string): Promise<string> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI алдаа гарлаа");
  }

  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI хариу хоосон байна");
  }

  return content;
};
