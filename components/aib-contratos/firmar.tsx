"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CUENTAS, fechaLarga, hojas as armarHojas, METODOS, TARJETAS, textoCostos, dinero, type Bloque, type DatosCliente, type Oferta } from "@/lib/aib-contratos/documento";

// Contrato de AI Borinquen en el teléfono del cliente (mismo flujo que el de Resuelto: datos → firma e iniciales →
// leer e iniciar cada hoja → firmar → copia en PDF), con la marca de AIB: negro verdoso, verde neón, Outfit + Inter.

type Vista = { codigo: string; estado: "pendiente" | "firmado"; oferta: Oferta; emitidoEn: string } | null;
const VACIO: DatosCliente = { nombre: "", email: "", telefono: "", negocio: "", metodo: "", titular: "", tarjeta: "", ultimos4: "", banco: "", tipoCuenta: "", calle: "", ciudad: "", estado: "PR", postal: "" };
const TINTA = "#0B1A12";

// ── Pad de firma: trazo suave, alta resolución, se exporta recortado (igual que el de Resuelto) ──
type PadApi = { vacio: () => boolean; borrar: () => void; escribir: (t: string, tam: number) => void; png: () => string | null };
function Pad({ alto, ph, api, ancho }: { alto: number; ph: string; api: (a: PadApi) => void; ancho?: number }) {
  const cont = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [vacio, setVacio] = useState(true);
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext("2d")!, box = cont.current!;
    let esVacio = true, dibujando = false, pts: { x: number; y: number }[] = [];
    const estilo = () => { ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = TINTA; ctx.lineWidth = 2.6; };
    const ajustar = () => {
      const r = window.devicePixelRatio || 1, w = box.clientWidth, tmp = esVacio ? null : c.toDataURL();
      c.width = w * r; c.height = alto * r; c.style.height = alto + "px"; ctx.setTransform(r, 0, 0, r, 0, 0); estilo();
      if (tmp) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, w, alto); im.src = tmp; }
    };
    const pos = (e: PointerEvent) => { const b = c.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    const marcar = (v: boolean) => { esVacio = v; setVacio(v); };
    const down = (e: PointerEvent) => { e.preventDefault(); c.setPointerCapture(e.pointerId); dibujando = true; pts = [pos(e)]; marcar(false); };
    const move = (e: PointerEvent) => {
      if (!dibujando) return; const p = pos(e); pts.push(p);
      if (pts.length === 2) { const [a] = pts; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo((a.x + p.x) / 2, (a.y + p.y) / 2); ctx.stroke(); return; }
      const [a, b] = pts.slice(-3); ctx.beginPath(); ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2); ctx.quadraticCurveTo(b.x, b.y, (b.x + p.x) / 2, (b.y + p.y) / 2); ctx.stroke();
    };
    const fin = () => { if (dibujando && pts.length < 3 && pts[0]) { ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 1.4, 0, 7); ctx.fillStyle = TINTA; ctx.fill(); } dibujando = false; };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); c.addEventListener("pointerup", fin); c.addEventListener("pointercancel", fin);
    window.addEventListener("resize", ajustar); ajustar();
    api({
      vacio: () => esVacio,
      borrar: () => { ctx.clearRect(0, 0, c.width, c.height); marcar(true); },
      escribir: (t, tam) => { ctx.clearRect(0, 0, c.width, c.height); marcar(!t.trim()); if (!t.trim()) return; ctx.fillStyle = TINTA; ctx.font = `600 ${tam}px Caveat, cursive`; ctx.fillText(t, 16, alto * 0.62, box.clientWidth - 32); },
      png: () => {
        const w = c.width, h = c.height, d = ctx.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
        for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 <= x0) return null; const m = 8, o = document.createElement("canvas"); o.width = Math.min(w, x1 - x0 + 2 * m); o.height = Math.min(h, y1 - y0 + 2 * m);
        o.getContext("2d")!.drawImage(c, Math.max(0, x0 - m), Math.max(0, y0 - m), o.width, o.height, 0, 0, o.width, o.height); return o.toDataURL("image/png");
      },
    });
    return () => { c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", fin); c.removeEventListener("pointercancel", fin); window.removeEventListener("resize", ajustar); };
  }, [alto, api]);
  return (
    <div ref={cont} className="relative touch-none rounded-2xl border-[1.5px] border-dashed border-[#9fb8aa] bg-white" style={ancho ? { maxWidth: ancho } : undefined}>
      <div className="pointer-events-none absolute inset-x-4 border-b border-[#d6e2db]" style={{ bottom: "34%" }} />
      {vacio && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[15px] text-[#9fb3a8]">{ph}</div>}
      <canvas ref={canvas} className="block w-full rounded-2xl" />
    </div>
  );
}

function BloqueVista({ b, firma, fecha }: { b: Bloque; firma: string | null; fecha: string }) {
  if (b.t === "titulo") return <div className="mb-3"><div className="text-[11px] font-semibold tracking-[0.14em] text-[#1FB6A6] uppercase">{b.tag}</div><h3 className="font-[family-name:var(--font-outfit)] text-[22px] font-bold tracking-tight text-[#0B1A12]">{b.texto}</h3></div>;
  if (b.t === "h") return <h4 className="mt-4 mb-1.5 font-[family-name:var(--font-outfit)] text-[15px] font-semibold text-[#0B1A12]">{b.texto}</h4>;
  if (b.t === "p") return <p className="mb-2.5 text-[14px] leading-relaxed text-[#26352d]">{b.texto}</p>;
  if (b.t === "nota") return <p className="my-2 rounded-xl bg-[#eef6f1] px-3 py-2 text-[12.5px] leading-snug text-[#4b6457] italic">{b.texto}</p>;
  if (b.t === "opciones") return <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">{b.opciones.map((o) => <div key={o.texto} className={`flex items-center gap-2 text-[14px] ${o.marcado ? "font-semibold text-[#0B1A12]" : "text-[#5d7166]"}`}><span className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${o.marcado ? "border-[#050E0A] bg-[#050E0A] text-[#2BFF88]" : "border-[#9fb3a8]"}`}>{o.marcado ? "✓" : ""}</span>{o.texto}</div>)}</div>;
  if (b.t === "firmaCliente") return (
    <div className="mt-3 grid grid-cols-2 gap-4">
      <div><div className="flex h-12 items-end border-b border-[#0B1A12]">{firma ? <img src={firma} alt="Tu firma" className="max-h-11" /> : <span className="pb-1 text-[12px] text-[#9fb3a8]">Tu firma va aquí</span>}</div><div className="mt-1 text-[12px] font-semibold">Firma del cliente</div></div>
      <div><div className="flex h-12 items-end border-b border-[#0B1A12] pb-1 text-[14px]">{fecha}</div><div className="mt-1 text-[12px] font-semibold">Fecha</div></div>
    </div>
  );
  if (b.t === "datos") return <div className="overflow-hidden rounded-xl border border-[#dbe7e0]">{b.filas.map(([k, v]) => <div key={k} className="grid grid-cols-[42%_1fr] border-b border-[#dbe7e0] last:border-0"><div className="bg-[#f3f8f5] px-3 py-2 text-[12px] font-semibold text-[#5d7166]">{k}</div><div className="px-3 py-2 text-[14px] whitespace-pre-line text-[#0B1A12]">{v}</div></div>)}</div>;
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      <div><div className="flex h-14 items-end border-b border-[#0B1A12]">{firma ? <img src={firma} alt="Tu firma" className="max-h-12" /> : <span className="pb-1 text-[12px] text-[#9fb3a8]">Tu firma va aquí</span>}</div><div className="mt-1 text-[12px] font-semibold">Firma del cliente</div></div>
      <div><div className="flex h-14 items-end border-b border-[#0B1A12]"><span className="pb-1 font-[family-name:var(--font-outfit)] text-[22px] font-semibold text-[#050E0A] italic">AI Borinquen</span></div><div className="mt-1 text-[12px] font-semibold">Por AI Borinquen</div><div className="text-[11px] text-[#5d7166]">EA Market LLC · representante autorizado</div></div>
    </div>
  );
}

const input = "w-full rounded-xl border-[1.5px] border-[#d6e2db] bg-white px-3.5 py-3 text-[16px] text-[#0B1A12] outline-none focus:border-[#1FB6A6]";

export function FirmarContrato({ token, contrato }: { token: string; contrato: Vista }) {
  const [paso, setPaso] = useState(contrato?.estado === "firmado" ? 5 : 1);
  const [d, setD] = useState<DatosCliente>(() => ({ ...VACIO, nombre: contrato?.oferta.cliente.nombre ?? "", telefono: contrato?.oferta.cliente.telefono ?? "", email: contrato?.oferta.cliente.email ?? "", negocio: contrato?.oferta.cliente.negocio ?? "" }));
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [firma, setFirma] = useState<string | null>(null), [ini, setIni] = useState<string | null>(null);
  const [iniciadas, setIniciadas] = useState<Set<number>>(new Set());
  const [acepto, setAcepto] = useState(false);
  const [escribir, setEscribir] = useState<{ firma?: string; ini?: string }>({});
  const pads = useRef<{ firma?: PadApi; ini?: PadApi }>({});
  const apiFirma = useCallback((a: PadApi) => { pads.current.firma = a; }, []);
  const apiIni = useCallback((a: PadApi) => { pads.current.ini = a; }, []);
  const hoy = useMemo(() => new Date().toISOString(), []);
  const hs = useMemo(() => (contrato ? armarHojas(contrato.oferta, d, hoy) : []), [contrato, d, hoy]);
  const set = (k: keyof DatosCliente) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); setError(""); }, [paso]);

  if (!contrato) return <Marco><div className="py-16 text-center"><h2 className="font-[family-name:var(--font-outfit)] text-2xl font-bold">Enlace no válido</h2><p className="mt-2 text-[#5d7166]">Pídele a AI Borinquen un enlace nuevo.</p></div></Marco>;
  const o = contrato.oferta, primer = (d.nombre || o.cliente.nombre).split(" ")[0];
  const esTarjeta = d.metodo === "credito" || d.metodo === "debito", factura = esTarjeta || d.metodo === "ach";

  function validar1(): string {
    if (!d.nombre.trim()) return "Falta tu nombre completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return "Escribe un correo electrónico válido.";
    if (d.telefono.replace(/\D/g, "").length < 10) return "El teléfono debe tener 10 dígitos.";
    if (!d.metodo) return "Escoge el método de pago.";
    if (!d.titular.trim()) return "Falta el nombre del titular.";
    if (d.ultimos4 && !/^\d{4}$/.test(d.ultimos4)) return "Escribe solo los últimos 4 dígitos de la tarjeta.";
    if (factura && (!d.calle.trim() || !d.ciudad.trim() || !d.estado.trim())) return "Completa la dirección de facturación.";
    if (factura && !/^\d{5}(-\d{4})?$/.test(d.postal.trim())) return "El código postal debe tener 5 dígitos.";
    return "";
  }
  async function seguir() {
    setError("");
    if (paso === 1) { const e = validar1(); if (e) return setError(e); return setPaso(2); }
    if (paso === 2) {
      const f = pads.current.firma, i = pads.current.ini;
      if (!f || f.vacio()) return setError("Falta tu firma."); if (!i || i.vacio()) return setError("Faltan tus iniciales.");
      const pf = f.png(), pi = i.png(); if (!pf || !pi) return setError("Vuelve a dibujar tu firma.");
      setFirma(pf); setIni(pi); return setPaso(3);
    }
    if (paso === 3) return setPaso(4);
    if (paso === 4) {
      setEnviando(true);
      try {
        const r = await fetch(`/api/contrato/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ datos: d, firma, iniciales: ini, hojasIniciadas: [...iniciadas], acepto }) });
        const j = await r.json().catch(() => ({ ok: false, error: "No se pudo firmar." }));
        if (!j.ok) throw new Error(j.error || "No se pudo firmar.");
        setPaso(5);
      } catch (e) { setError((e as Error).message); } finally { setEnviando(false); }
    }
  }
  async function escribirFirma(cual: "firma" | "ini", texto: string) {
    await document.fonts.load("600 40px Caveat").catch(() => null);
    setEscribir((x) => ({ ...x, [cual]: texto }));
    pads.current[cual]?.escribir(texto, cual === "firma" ? 58 : 50);
  }
  const listoP3 = iniciadas.size === hs.length, deshabilitado = enviando || (paso === 3 && !listoP3) || (paso === 4 && !acepto);

  return (
    <Marco saludo={paso < 5 ? `Hola, ${primer} · tu acuerdo con AI Borinquen` : undefined}>
      {paso < 5 && <div className="mb-5 flex gap-1.5">{[1, 2, 3, 4].map((n) => <i key={n} className={`h-1 flex-1 rounded-full ${n <= paso ? "bg-gradient-to-r from-[#1FB6A6] to-[#2BFF88]" : "bg-[#dbe7e0]"}`} />)}</div>}

      {paso === 1 && (
        <section>
          <div className="mb-5 rounded-2xl bg-[#050E0A] p-4 text-[#E8F3EC]">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-[#8FB3A0] uppercase">Lo que se te ofreció</div>
            <p className="mt-1.5 text-[14.5px] leading-relaxed whitespace-pre-line">{o.servicio}</p>
            <div className="mt-3 font-[family-name:var(--font-outfit)] text-[22px] font-bold text-[#2BFF88]">{dinero(o.costos.hoy ?? o.costos.total)}{o.costos.hoy && o.costos.hoy !== o.costos.total ? <span className="ml-1 text-[13px] font-medium text-[#8FB3A0]">hoy</span> : null}</div>
            <div className="text-[13px] text-[#8FB3A0]">{textoCostos(o.costos)}</div>
          </div>
          <H2 t="Tus datos" s="Así van a salir en el acuerdo." />
          <Campo l="Nombre completo"><input className={input} value={d.nombre} onChange={set("nombre")} autoComplete="name" /></Campo>
          <Campo l="Correo electrónico"><input className={input} type="email" inputMode="email" value={d.email} onChange={set("email")} autoComplete="email" /></Campo>
          <Campo l="Teléfono"><input className={input} type="tel" inputMode="tel" value={d.telefono} onChange={set("telefono")} autoComplete="tel" /></Campo>
          <Campo l="Negocio" o><input className={input} value={d.negocio} onChange={set("negocio")} autoComplete="organization" /></Campo>
          <H2 t="Método de pago" s="Cómo vas a pagar. El cobro se hace por un medio seguro: aquí no se piden los números de la tarjeta." className="mt-7" />
          <div className="grid grid-cols-2 gap-2">{METODOS.map((m) => <Opcion key={m.id} sel={d.metodo === m.id} onClick={() => setD((x) => ({ ...x, metodo: m.id }))}>{m.id === "ach" ? "ACH (transferencia)" : m.nombre}</Opcion>)}</div>
          {d.metodo && (
            <>
              <Campo l={esTarjeta ? "Nombre del titular de la tarjeta" : d.metodo === "ach" ? "Nombre del titular de la cuenta" : "Nombre de quien paga"}><input className={input} value={d.titular} onChange={set("titular")} autoComplete="cc-name" /></Campo>
              {esTarjeta && (
                <>
                  <Campo l="Tipo de tarjeta" o><div className="grid grid-cols-2 gap-2">{TARJETAS.map((t) => <Opcion key={t.id} sel={d.tarjeta === t.id} onClick={() => setD((x) => ({ ...x, tarjeta: x.tarjeta === t.id ? "" : t.id }))}>{t.nombre}</Opcion>)}</div></Campo>
                  <Campo l="Últimos 4 dígitos" o a="Solo los últimos 4. Nunca escribas el número completo ni el CVV."><input className={input} inputMode="numeric" maxLength={4} value={d.ultimos4} onChange={(e) => setD((x) => ({ ...x, ultimos4: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="1234" /></Campo>
                </>
              )}
              {d.metodo === "ach" && (
                <>
                  <Campo l="Nombre del banco" o><input className={input} value={d.banco} onChange={set("banco")} /></Campo>
                  <Campo l="Tipo de cuenta" o><div className="grid grid-cols-2 gap-2">{CUENTAS.map((t) => <Opcion key={t.id} sel={d.tipoCuenta === t.id} onClick={() => setD((x) => ({ ...x, tipoCuenta: t.id }))}>{t.nombre}</Opcion>)}</div></Campo>
                </>
              )}
              {factura && (
                <>
                  <Campo l="Dirección de facturación"><input className={input} value={d.calle} onChange={set("calle")} placeholder="Calle y número" autoComplete="street-address" /></Campo>
                  <div className="grid grid-cols-[1fr_72px_96px] gap-2">
                    <Campo l="Ciudad"><input className={input} value={d.ciudad} onChange={set("ciudad")} autoComplete="address-level2" /></Campo>
                    <Campo l="Estado"><input className={input} value={d.estado} onChange={set("estado")} autoComplete="address-level1" /></Campo>
                    <Campo l="Código postal"><input className={input} inputMode="numeric" value={d.postal} onChange={set("postal")} autoComplete="postal-code" /></Campo>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}

      {paso === 2 && (
        <section>
          <H2 t="Tu firma" s="Dibújala con el dedo. Se usa al final del acuerdo." />
          <Pad alto={190} ph="Firma aquí" api={apiFirma} />
          <div className="mt-1.5 flex justify-between text-[14px]"><button className="py-1.5 text-[#1d6b5f] underline" onClick={() => { pads.current.firma?.borrar(); setEscribir((x) => ({ ...x, firma: undefined })); }}>Borrar</button><button className="py-1.5 text-[#1d6b5f] underline" onClick={() => escribirFirma("firma", d.nombre)}>Prefiero escribirla</button></div>
          {escribir.firma !== undefined && <input className={`${input} font-[Caveat,cursive] text-[28px]`} value={escribir.firma} onChange={(e) => escribirFirma("firma", e.target.value)} maxLength={40} />}
          <label className="mt-6 mb-1.5 block text-[14px] font-semibold">Tus iniciales <span className="font-normal text-[#5d7166]">· van en cada página</span></label>
          <Pad alto={120} ph="Iniciales" api={apiIni} ancho={220} />
          <div className="mt-1.5 flex max-w-[220px] justify-between text-[14px]"><button className="py-1.5 text-[#1d6b5f] underline" onClick={() => { pads.current.ini?.borrar(); setEscribir((x) => ({ ...x, ini: undefined })); }}>Borrar</button><button className="py-1.5 text-[#1d6b5f] underline" onClick={() => escribirFirma("ini", d.nombre.split(/\s+/).filter(Boolean).slice(0, 3).map((p) => p[0].toUpperCase() + ".").join(""))}>Escribirlas</button></div>
          {escribir.ini !== undefined && <input className={`${input} max-w-[220px] font-[Caveat,cursive] text-[28px]`} value={escribir.ini} onChange={(e) => escribirFirma("ini", e.target.value)} maxLength={6} />}
        </section>
      )}

      {paso === 3 && (
        <section>
          <H2 t="Lee e inicia cada página" s={listoP3 ? "Todas las páginas tienen tus iniciales." : `${iniciadas.size} de ${hs.length} páginas con tus iniciales. Toca "Poner mis iniciales" al final de cada una.`} />
          {hs.map((h) => {
            const on = iniciadas.has(h.n);
            return (
              <article key={h.n} className="mb-4 overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_#dbe7e0,0_8px_22px_rgba(5,14,10,.06)]">
                <div className="flex justify-between bg-[#eef6f1] px-4 py-2.5 text-[12.5px] text-[#5d7166]"><span>Página {h.n} de {hs.length}</span><span className="truncate pl-3">{h.titulo}</span></div>
                <div className="px-4 pt-4 pb-2">{h.bloques.map((b, i) => <BloqueVista key={i} b={b} firma={firma} fecha={fechaLarga(hoy)} />)}</div>
                <div className="flex items-center justify-between gap-3 border-t border-[#dbe7e0] px-4 py-3">
                  {on ? <span className="flex items-center gap-2 text-[14px] font-semibold text-[#138a52]">{ini && <img src={ini} alt="Iniciales" className="h-8" />}✓</span> : <span className="text-[13px] text-[#5d7166]">Sin iniciales</span>}
                  <button className={`rounded-xl border-[1.5px] px-4 py-2.5 text-[14px] font-semibold ${on ? "border-[#d6e2db] text-[#5d7166]" : "border-[#050E0A] bg-[#050E0A] text-[#2BFF88]"}`} onClick={() => setIniciadas((s) => { const n = new Set(s); if (on) n.delete(h.n); else n.add(h.n); return n; })}>{on ? "Quitar" : "Poner mis iniciales"}</button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {paso === 4 && (
        <section>
          <H2 t="Firmar" s="Revisa y firma. Recibes tu copia en PDF al instante." />
          <div className="mb-4 rounded-2xl border-[1.5px] border-[#dbe7e0] bg-white p-4 text-[14px]">
            <b>{d.nombre}</b> · {d.telefono}<br /><span className="text-[#5d7166]">{d.email}</span>
            <div className="mt-2 text-[12px] text-[#5d7166]">Tu firma</div>{firma && <img src={firma} alt="Firma" className="my-1 h-12" />}
            <div className="text-[12px] text-[#5d7166]">Iniciales en las {hs.length} páginas · {textoCostos(o.costos)}</div>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border-[1.5px] border-[#dbe7e0] bg-white p-4 text-[14px]">
            <input type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-[#050E0A]" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
            <span>Acepto firmar este acuerdo electrónicamente. Mi firma y mis iniciales valen igual que en papel, y quedan registradas con la fecha, la hora y este dispositivo.</span>
          </label>
          {enviando && <p className="mt-3 text-center text-[14px] text-[#5d7166]">Firmando y generando tu copia… (unos segundos)</p>}
        </section>
      )}

      {paso === 5 && (
        <section className="py-10 text-center">
          <div className="mx-auto mb-4 grid h-[76px] w-[76px] place-items-center rounded-full bg-[#050E0A] text-[38px] text-[#2BFF88] shadow-[0_0_40px_rgba(43,255,136,.35)]">✓</div>
          <h2 className="font-[family-name:var(--font-outfit)] text-[26px] font-bold tracking-tight">¡Acuerdo firmado!</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-[#5d7166]">Bienvenido a AI Borinquen. Guarda tu copia; el equipo te escribe con los próximos pasos.</p>
          <a href={`/api/contrato/${token}/pdf`} target="_blank" rel="noopener" className="mt-6 inline-block rounded-xl bg-[#050E0A] px-6 py-4 font-[family-name:var(--font-outfit)] font-semibold text-[#2BFF88]">Descargar mi copia (PDF)</a>
        </section>
      )}

      {error && <div role="alert" className="mt-4 rounded-xl bg-[#fdecea] px-3.5 py-2.5 text-[14px] text-[#9b2c1f]">{error}</div>}

      {paso < 5 && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#F4F8F5] from-60% to-transparent px-4 pt-6 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-[560px] gap-2.5">
            {paso > 1 && <button disabled={enviando} onClick={() => setPaso(paso - 1)} className="rounded-xl border-[1.5px] border-[#d6e2db] bg-white px-4 font-semibold text-[#0B1A12]">Atrás</button>}
            <button disabled={deshabilitado} onClick={seguir} className="flex-1 rounded-xl bg-[#2BFF88] py-4 font-[family-name:var(--font-outfit)] text-[16px] font-bold text-[#050E0A] disabled:opacity-40">{paso === 4 ? (enviando ? "Firmando…" : "Firmar acuerdo") : "Seguir"}</button>
          </div>
        </div>
      )}
    </Marco>
  );
}

function Marco({ children, saludo }: { children: React.ReactNode; saludo?: string }) {
  return (
    <div className="min-h-svh bg-[#F4F8F5] font-[family-name:var(--font-inter)] text-[#0B1A12]">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap" />
      <header className="bg-[#050E0A] px-5 pt-4 pb-3.5 text-[#E8F3EC]" style={{ borderBottom: "3px solid transparent", borderImage: "linear-gradient(90deg,#1FB6A6,#2BFF88,#8CFFC0) 1" }}>
        <div className="mx-auto max-w-[560px]">
          <img src="/marcas/ai-borinquen/lockup-horizontal-transparente.png" alt="AI Borinquen" className="h-8 w-auto" />
          {saludo && <p className="mt-2 text-[14px] text-[#8FB3A0]">{saludo}</p>}
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-4 pt-5 pb-32">{children}</main>
    </div>
  );
}
const H2 = ({ t, s, className = "" }: { t: string; s: string; className?: string }) => <div className={`mb-4 ${className}`}><h2 className="font-[family-name:var(--font-outfit)] text-[21px] font-bold tracking-tight">{t}</h2><p className="mt-0.5 text-[14px] text-[#5d7166]">{s}</p></div>;
const Campo = ({ l, o, a, children }: { l: string; o?: boolean; a?: string; children: React.ReactNode }) => <label className="mt-3.5 block"><span className="mb-1.5 block text-[14px] font-semibold">{l}{o && <span className="font-normal text-[#5d7166]"> · opcional</span>}</span>{a && <span className="-mt-1 mb-1.5 block text-[12.5px] text-[#5d7166]">{a}</span>}{children}</label>;
const Opcion = ({ sel, onClick, children }: { sel: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" onClick={onClick} className={`rounded-xl border-[1.5px] px-3 py-3 text-left text-[14px] font-semibold ${sel ? "border-[#050E0A] bg-[#050E0A] text-[#2BFF88]" : "border-[#d6e2db] bg-white text-[#0B1A12]"}`}>{children}</button>;
