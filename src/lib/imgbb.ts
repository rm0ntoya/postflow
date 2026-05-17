export async function uploadToImgbb(dataUrl: string): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY não definida nas variáveis de ambiente.");

  const sepIdx = dataUrl.indexOf(',');
  const base64 = sepIdx !== -1 ? dataUrl.slice(sepIdx + 1) : dataUrl;

  const form = new URLSearchParams();
  form.append('key', apiKey);
  form.append('image', base64);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error(`ImgBB upload falhou: ${res.status}`);

  const json = await res.json();
  return json.data.url as string;
}
