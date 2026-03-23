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
            "Чи зөвхөн монгол галигийг кирилл болгодог. " +
            "ЗӨВХӨН нэг үг орж ирнэ. " +
            "Хэрэв оролт нь монгол галиг байвал кирилл хөрвүүл. " +
            "Хэрэв галиг биш, эсвэл аль хэдийн кирилл, эсвэл эргэлзээтэй бол яг оролтыг өөрчлөхгүй буцаа. " +
            "Зөвхөн эцсийн нэг мөр текстээ буцаа. Тайлбар, тэмдэглэл, ишлэл битгий нэм.",
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
