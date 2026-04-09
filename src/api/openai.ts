export const correctWithOpenAI = async (text: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_OPENAI_API_KEY missing");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
Чи монгол латин галигаар бичсэн текстийг кирилл монгол руу хөрвүүлдэг систем.

Дүрэм:
- Оролт нь нэг үг, товчилсон үг, эсвэл богино өгүүлбэр байж болно.
- Хэрэв оролт нь монгол латин галиг байвал хамгийн зөв, хамгийн байгалийн кирилл хувилбараар хөрвүүл.
- Товчилсон хэлбэр байж болно:
  - "bn" -> "байна"
  - "sn" -> "сайн"
  - "uu" -> "уу"
  - "yu ve" -> "юу вэ"
- Хэрэв текст аль хэдийн кирилл байвал яг хэвээр нь буцаа.
- Хэрэв англи үг орсон байвал англи үгийг хэвээр үлдээнэ.
- Утгыг аль болох алдагдуулахгүй.
- Зөвхөн эцсийн хөрвүүлсэн текстээ буцаа.
- Тайлбар, markdown, жагсаалт, хашилт бүү нэм.
          `.trim(),
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0,
    }),
  });

  const raw = await response.text();

  let data: any = {};
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI JSON parse error");
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || raw || "OpenAI алдаа гарлаа");
  }

  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI хариу хоосон байна");
  }

  return content;
};
