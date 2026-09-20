export default async ({ project }) => {
  const p = await project({ size: "1080x1920", fps: 30, background: "#071B2C" });
  const W = 1080, H = 1920;
  const C2 = "#F2621F", INK2 = "#9FB8CA", INK3 = "#6E8AA0", SURF = "#0C2A42", GREEN = "#3DD598";
  const sora = (w) => ({ fontFamily: "Sora", fontWeight: w });
  const dm = (w) => ({ fontFamily: "DM Sans", fontWeight: w });
  const enter = { from: { opacity: 0, y: 40 }, duration: 0.4 };
  const exit = { to: { opacity: 0, y: -24 }, duration: 0.3, anchor: "end" };
  const glow = { kind: "radial", stops: [{ offset: 0, color: C2, opacity: 0.26 }, { offset: 0.65, color: C2, opacity: 0 }] };
  const house = (s, casa, check) => (
    <frame width={64 * s} height={64 * s} layout="none">
      <path d={`M${32*s} ${5*s} L${59*s} ${28*s} V${60*s} H${5*s} V${28*s} Z`} width={64*s} height={64*s} fill={casa} />
      <path d={`M${20*s} ${35*s} L${29*s} ${44*s} L${46*s} ${26*s}`} width={64*s} height={64*s} stroke={{ color: check, width: 7*s, cap: "round" }} />
    </frame>
  );
  const tick = (label, delay) => (
    <frame layout="row" gap={22} align="center" width={920} height="hug"
      animate={[{ property: "opacity", keyframes: [{ at: 0, value: 0 }, { at: delay, value: 0 }, { at: delay + 0.35, value: 1 }] },
                { property: "offsetX", keyframes: [{ at: 0, value: -40 }, { at: delay, value: -40 }, { at: delay + 0.45, value: 0, easing: "house" }] }]}>
      <frame width={72} height={72} radius={36} background="#153F33" layout="none">
        <path d="M20 36 L31 47 L52 26" width={72} height={72} stroke={{ color: GREEN, width: 7, cap: "round" }} />
      </frame>
      <text width={820} height={60} {...dm(600)} fontSize={44} color="#EAF2F8">{label}</text>
    </frame>
  );
  p.compose(<rect width={1100} height={1100} x={420} y={-420} fill={glow} />, { at: 0, dur: 15 });
  p.compose(
    <frame width={W} height={H} padding={80} justify="center" gap={30} motion={{ exit }}>
      <text width={920} height={40} {...dm(600)} fontSize={26} letterSpacing={5} color={C2}>PLOMERÍA EN PUERTO RICO</text>
      <text width={920} height={620} {...sora(800)} fontSize={118} lineHeight={1.02} letterSpacing={-4} color="#FFFFFF"
        motion={{ by: "word", from: { opacity: 0, y: 40 }, duration: 0.45, overlap: 0.55 }}>¿Cuánto te va a cobrar el plomero?</text>
    </frame>, { at: 0, dur: 3.2 });
  p.compose(
    <frame width={W} height={H} padding={80} justify="center" gap={16} motion={{ enter, exit }}>
      <text width={920} height={300} {...sora(800)} fontSize={112} lineHeight={1.02} letterSpacing={-4} color="#FFFFFF"
        motion={{ by: "word", from: { opacity: 0, y: 30 }, duration: 0.4, overlap: 0.5 }}>Nosotros te lo decimos</text>
      <text width={920} height={300} {...sora(800)} fontSize={124} lineHeight={1.02} letterSpacing={-4} color={C2} at={0.9}
        motion={{ by: "word", from: { opacity: 0, y: 30 }, duration: 0.4, overlap: 0.5 }}>ANTES de ir.</text>
    </frame>, { at: 3.2, dur: 3.0 });
  const precio = (nombre, valor, delay) => (
    <frame layout="row" justify="space-between" align="center" width={808} height="hug"
      animate={[{ property: "opacity", keyframes: [{ at: 0, value: 0 }, { at: delay, value: 0 }, { at: delay + 0.35, value: 1 }] },
                { property: "offsetX", keyframes: [{ at: 0, value: -30 }, { at: delay, value: -30 }, { at: delay + 0.45, value: 0, easing: "house" }] }]}>
      <text width={450} height={60} {...dm(600)} fontSize={38} color="#EAF2F8">{nombre}</text>
      <text width={340} height={70} {...sora(800)} fontSize={56} letterSpacing={-2} color={C2} align="right">{valor}</text>
    </frame>
  );
  p.compose(
    <frame width={W} height={H} padding={80} justify="center" gap={28} motion={{ enter, exit }}>
      <text width={920} height={40} {...dm(600)} fontSize={26} letterSpacing={5} color={C2}>PRECIOS PUBLICADOS · FIJOS</text>
      <frame width={920} height="hug" background={SURF} radius={40} padding={56} gap={30}>
        {precio("Destape simple", "$149", 0.2)}
        {precio("Reparación de inodoro", "$99", 0.5)}
        {precio("Instalación de calentador", "$279", 0.8)}
        {precio("Cisterna con bomba", "desde $899", 1.1)}
        <text width={808} height={40} {...dm(500)} fontSize={22} color={INK3}>Mano de obra · materiales aparte · $19 de coordinación</text>
      </frame>
    </frame>, { at: 6.2, dur: 4.4 });
  p.compose(
    <frame width={W} height={H} padding={80} justify="center" gap={30} motion={{ enter, exit }}>
      {tick("Ventana de 2 horas, aviso 30 min", 0.2)}
      {tick("Plomero licenciado de tu zona", 0.55)}
      {tick("12 meses de garantía por escrito", 0.9)}
    </frame>, { at: 10.6, dur: 2.8 });
  p.compose(
    <frame width={W} height={H} padding={80} justify="center" align="center" gap={44} motion={{ enter: { from: { opacity: 0, scale: 0.96 }, duration: 0.4 } }}>
      <frame layout="row" gap={18} align="center" width="hug" height="hug">
        {house(1.6, "#FFFFFF", C2)}
        <text width={520} height={110} {...sora(800)} fontSize={96} letterSpacing={-4} color="#FFFFFF">resuelto</text>
      </frame>
      <text width={920} height={140} {...sora(700)} fontSize={52} lineHeight={1.1} letterSpacing={-1} color="#FFFFFF" align="center">Escríbenos por WhatsApp. Te resolvemos hoy.</text>
      <frame width="hug" height="hug" background={C2} radius={24} padding={{ top: 26, bottom: 26, left: 44, right: 44 }}
        motion={{ enter: { from: { opacity: 0, scale: 0.9 }, duration: 0.35 }, settle: { to: { scale: 1.03 }, duration: 0.5, easing: { kind: "spring" } } }}>
        <text width={560} height={56} {...dm(600)} fontSize={40} color="#FFFFFF" align="center">Cotiza por WhatsApp</text>
      </frame>
      <text width={920} height={44} {...dm(500)} fontSize={30} color={INK2} align="center">resueltopr.com · Tu casa, resuelta.</text>
    </frame>, { at: 13.4, dur: 1.6 });
  await p.frame(1.6, "renders/f1.png"); await p.frame(5.0, "renders/f2.png"); await p.frame(9.4, "renders/f3.png"); await p.frame(12.6, "renders/f4.png"); await p.frame(14.6, "renders/f5.png");
  await p.render("renders/out.mp4", { concurrency: 8 });
};
