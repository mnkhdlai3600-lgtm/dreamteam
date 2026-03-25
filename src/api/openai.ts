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
          content: `
                     Чи монгол латин галигаар бичсэн үг, өгүүлбэрийг кирилл монгол руу хөрвүүлдэг систем.
                     
                     Дүрэм:
                     - Оролт нь нэг үг, товчилсон үг, эсвэл богино өгүүлбэр байж болно.
                     - Хэрэв оролт нь монгол латин галиг байвал хамгийн ойр, хамгийн зөв кирилл хувилбараар хөрвүүл.
                     - Хэрэв үг товчилсон, дутуу, эсвэл ярианы хэлбэртэй байвал утгад нь тааруулж бүтэн зөв үг болгож хөрвүүл.
                     - Жишээ нь: "bn" -> "байна", "uu" -> "уу", "sn" -> "сайн", "yadag ym" -> "ядаг юм", "soliwol" -> "соливол".
                     - Хэрэв оролт аль хэдийн кирилл бол яг хэвээр нь буцаа.
                     - Хэрэв зарим үг нь англи, зарим нь монгол галиг байвал монгол галиг хэсгийг кирилл болгож, англи үгийг хэвээр үлдээ.
                     - Өгүүлбэрийн утгыг алдагдуулахгүйгээр хамгийн байгалийн монгол бичлэгээр буцаа.
                     - Зөвхөн эцсийн хөрвүүлсэн текстээ буцаа.
                     - Тайлбар, нэмэлт өгүүлбэр, хашилт, markdown, жагсаалт бүү нэм.
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
