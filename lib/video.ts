// Busca el primer video de YouTube para una consulta, sin API key: pide la página
// de resultados y extrae el primer videoId (+ título best-effort) del JSON embebido.
// Lo usa la tool reproducir_video de Jarvis para poner un video en la pantalla del HUD.

export interface VideoResultado {
  id: string;
  titulo: string;
  url: string;
  embed: string;
}

export async function buscarVideoYoutube(
  consulta: string,
): Promise<VideoResultado | null> {
  const q = consulta.trim();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=es`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "Accept-Language": "es-419,es;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const html = await res.text();

    // Primer videoRenderer con id + título.
    const rend = html.match(
      /"videoRenderer":\{"videoId":"([\w-]{11})"[\s\S]{0,600}?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/,
    );
    let id: string | null = null;
    let titulo = q;
    if (rend) {
      id = rend[1];
      titulo = JSON.parse(`"${rend[2]}"`); // desescapa \u.. y comillas
    } else {
      const soloId = html.match(/"videoId":"([\w-]{11})"/);
      if (soloId) id = soloId[1];
    }
    if (!id) return null;

    return {
      id,
      titulo,
      url: `https://www.youtube.com/watch?v=${id}`,
      embed: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
    };
  } catch {
    return null;
  }
}
