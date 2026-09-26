import postgres from "postgres";

// Cliente de Postgres que no se queda colgado (26/sep/2026). En Vercel la función se congela entre
// requests y el socket al pooler de Supabase puede morir sin aviso: la siguiente consulta esperaba
// para siempre y la página "se quedaba cargando" hasta el timeout de 300 s (Ritmo y Pulse).
// Ahora cada consulta tiene un vigilante: si no responde en DB_TIMEOUT_MS (15 s), se abre una conexión
// nueva, la vieja tiene 10 s para terminar y se cierra, y si era una lectura (SELECT) se repite una vez.
// Las escrituras no se repiten (podrían haberse aplicado): esperan a la vieja, y si estaba muerta fallan
// al cerrarse (~25 s) en vez de colgar 300 s. No corta consultas que solo estaban lentas.

type Sql = postgres.Sql;

const esLectura = (q: string) => /^\s*select\b/i.test(q);
const GRACIA_S = 10;

export function clienteResistente(url: string, opciones: postgres.Options<Record<string, never>>, timeoutMs = Number(process.env.DB_TIMEOUT_MS) || 15000): Sql {
  const nuevo = () => postgres(url, opciones);
  const base = nuevo(); // drizzle ajusta parsers/serializers sobre este objeto al crearse
  let actual: Sql = base;

  function renovar(motivo: string) {
    const viejo = actual;
    actual = nuevo();
    Object.assign(actual.options.parsers, base.options.parsers);
    Object.assign(actual.options.serializers, base.options.serializers);
    console.error(`[db] conexión renovada: ${motivo}`);
    viejo.end({ timeout: GRACIA_S }).catch(() => {});
  }

  // Si no responde a tiempo: conexión nueva para lo que venga. La vieja tiene GRACIA_S para terminar lo
  // que lleva (si solo estaba lenta, termina bien; si estaba muerta, su consulta se rechaza al cerrarse).
  // Una lectura además se repite en la conexión nueva y gana la primera respuesta que llegue.
  function vigilar<T>(correr: () => Promise<T>, etiqueta: string, reintentar: boolean): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let hecho = false;
      let vivos = 1;
      const ok = (v: T) => { if (!hecho) { hecho = true; clearTimeout(timer); resolve(v); } };
      const mal = (e: unknown) => { if (!hecho && --vivos === 0) { hecho = true; clearTimeout(timer); reject(e); } };
      correr().then(ok, mal);
      const timer = setTimeout(() => {
        if (hecho) return;
        renovar(`${etiqueta} sin respuesta en ${timeoutMs} ms`);
        if (reintentar) {
          vivos++;
          correr().then(ok, mal);
        }
      }, timeoutMs);
    });
  }

  // Lo que drizzle usa del cliente: unsafe(q, params).values() / await unsafe(...) y begin(). Lo demás
  // (options, etc.) sigue siendo el del cliente base.
  const unsafe = (q: string, params?: unknown[], opts?: unknown) => {
    let valores = false;
    const correr = () => {
      const pq = actual.unsafe(q, params as never[], opts as never);
      return (valores ? pq.values() : pq) as unknown as Promise<unknown>;
    };
    const pendiente = {
      values() {
        valores = true;
        return pendiente;
      },
      then<A, B>(ok?: (v: unknown) => A, mal?: (e: unknown) => B) {
        return vigilar(correr, "consulta", esLectura(q)).then(ok, mal);
      },
    };
    return pendiente;
  };

  return new Proxy(base, {
    get(obj, prop, recv) {
      if (prop === "unsafe") return unsafe;
      if (prop === "begin") return (...args: unknown[]) => vigilar(() => (actual.begin as (...a: unknown[]) => Promise<unknown>)(...args), "transacción", false);
      return Reflect.get(obj, prop, recv);
    },
  });
}
