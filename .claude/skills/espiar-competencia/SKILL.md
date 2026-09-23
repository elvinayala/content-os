---
name: espiar-competencia
description: Espía los anuncios que la competencia tiene CORRIENDO hoy en la Biblioteca de Anuncios de Meta (por nicho, zona o página), identifica los que funcionan (más días activos + variantes) y saca 1-3 cosas para robar (gancho, oferta, formato, destino) sin copiar la estrategia entera. Usar SIEMPRE antes de diseñar una campaña o renovar creativos, y cuando pidan "competencia", "qué está pautando X", "qué funciona en mi nicho", "biblioteca de anuncios" o "espiar anuncios".
ejecucion: live
marcas: [level-up, ai-borinquen, resuelto, shadow-operator, mauro, clientes-aib]
---

Eres Max (o quien haga de media buyer). Este es un hábito de Elvin, no un extra:
*"A mí me gusta investigar la competencia que está funcionando en el mercado en mi
nicho para sacar algo de ahí. No toda la estrategia, pero sacar algo de ahí."*

## Cuándo

- **Siempre** antes de diseñar una estrategia nueva (marca propia o cliente de AI Borinquen).
- Al renovar creativos (cada ~10 días) o cuando un ángulo se quema.
- Cuando Elvin o el trafficker pregunten qué está pautando alguien.

## Cómo (rápido y barato: ~30 s y ~$0.15 por búsqueda)

1. **Términos**: 2-4 palabras de cómo busca el CLIENTE, no cómo se describe el negocio
   ("plomero, destape, calentador" · "uñas acrílicas Caguas" · "curso de trading").
   Si sabes los competidores, búscalos por página (id o URL de su página de Facebook).
2. **Correr**:
   ```
   node scripts/meta-ads.mjs competencia "plomero, destape, calentador" --pais PR --max 30 --para resuelto --excluir "Resuelto PR"
   node scripts/meta-ads.mjs competencia "uñas" --paginas 1234567890,https://facebook.com/xyz --para cliente-xyz
   ```
   Necesita `APIFY_TOKEN` (en `.env.local` y en Railway). **Sin token** y con el MCP de Apify
   disponible (sesión de Claude en la Mac): corre el actor `apify/facebook-ads-scraper` con
   `startUrls` = la URL de la Biblioteca (`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=PR&q=<término>&search_type=keyword_unordered&media_type=all`),
   `resultsLimit` 30, `callOptions.maxTotalChargeUsd` 0.3; guarda los items en un JSON y
   `node scripts/meta-ads.mjs competencia resumir <archivo.json> --para <slug>`.
3. **Leer SOLO el resumen** que imprime (top 10). El detalle completo queda en
   `data/meta-ads/competencia/<slug>-<fecha>.json` si hace falta el texto entero de uno.

## Cómo se lee

- **30+ días activo = funciona** (nadie paga dos meses por un anuncio que no vende).
  **Variantes > 1 = lo escalaron.** Lo de < 7 días todavía no dice nada.
- Fíjate en el **destino** (WhatsApp, llamada, web, formulario): en PR se vende por WhatsApp;
  si el líder del nicho manda a llamada, es una pista de cómo compra ese cliente.
- Ignora lo que no es del nicho (la búsqueda por palabra trae ruido; las apps ya se filtran).

## Qué entregas (máx. 12 líneas, tuteo PR)

```
Competencia · <nicho/zona> · <N> anuncios activos, <M> con 30+ días
Quién domina: <2-3 páginas> · formato que más corre: <…> · destino: <…>
Lo que funciona:
- <patrón 1 con ejemplo real: gancho/oferta de X, 90 días, 3 variantes>
- <patrón 2>
Lo que nos robamos (máx. 3, traducido a NUESTRO ángulo y oferta):
1. <qué, dónde lo usamos: F2 ventas / F3 remarketing / flyer / guion>
2. …
Lo que NO copiamos: <1 línea: lo que choca con la marca, lo engañoso o lo que ya hacemos mejor>
```

## Reglas

- Robar ≠ copiar. Se roba la **estructura** (tipo de gancho, oferta, formato, destino), nunca el
  texto, el logo ni la marca de otro. El copy final siempre sale de NUESTROS ángulos.
- Nada de "gratis" ni promesas de ingreso aunque la competencia lo haga.
- No inventes días, variantes ni anuncios: si la búsqueda no trajo nada útil, dilo y propone
  otros términos o páginas.
- Guarda lo robado donde se use: en la estrategia/campaña (Max) o en la ficha del cliente
  (Bori → Max), para que el creativo lo tome.
