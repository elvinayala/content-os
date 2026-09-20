//+------------------------------------------------------------------+
//|                                                  RecuadroEA.mq5  |
//|                    Richy & Elvin Trading LLC — PROTOTIPO v0.1    |
//|                                                                  |
//|  Estrategia "El Recuadro" (de la mentoría 2/ago/2026):           |
//|   1. Marcar la última vela a favor antes del impulso contrario   |
//|      (la "vela alcista anterior") → esa es la ZONA.              |
//|   2. Esperar que el precio REGRESE a la zona (retesteo).         |
//|   3. Confirmar con vela de rechazo (mecha larga contra la zona). |
//|   4. Entrar con riesgo fijo, SL bajo la mecha, TP a 2R (1:2).    |
//|   5. Break even al llegar a 1R: el trade ya no puede perder.     |
//|   6. En acumulación (mercado lateral) NO se opera.               |
//|                                                                  |
//|  ⚠️ ESTO ES UN PROTOTIPO PARA BACKTESTING. Compílalo en          |
//|  MetaEditor, pruébalo en el Strategy Tester (6+ meses) y luego   |
//|  en cuenta DEMO por semanas antes de pensar en dinero real.      |
//|  No garantiza ganancias. Puedes perder todo tu capital.          |
//+------------------------------------------------------------------+
#property copyright "Richy & Elvin Trading LLC"
#property version   "0.10"
#property strict

#include <Trade\Trade.mqh>
CTrade trade;

//--- Parámetros que Richy puede ajustar sin tocar código -----------
input double RiesgoPorTradePct   = 1.0;   // % de la cuenta que se arriesga por trade
input double RatioRR             = 2.0;   // Take profit en múltiplos de R (1:2 = 2.0)
input double BreakEvenEnR        = 1.0;   // Mover SL a entrada al llegar a este múltiplo de R
input double TopePerdidaDiaPct   = 3.0;   // Pérdida máxima del día (%); se apaga el bot al tocarla
input int    VelasImpulso        = 3;     // Velas seguidas en contra que definen el impulso
input int    VelasLookback       = 60;    // Hasta dónde mirar hacia atrás buscando la zona
input double MechaMinimaPct      = 40.0;  // % mínimo de mecha para contar como vela de rechazo
input double BufferSLPuntos      = 20;    // Puntos extra debajo/encima de la mecha para el SL
input int    RangoLateralVelas   = 20;    // Ventana para detectar acumulación
input double RangoLateralATR     = 1.5;   // Si el rango < ATR*este factor → lateral, no operar
input int    HoraInicio          = 9;     // Hora de sesión (hora del broker) desde
input int    HoraFin             = 16;    // Hora de sesión hasta
input long   NumeroMagico        = 20260802;

//--- Estado ---------------------------------------------------------
double  equityInicioDia = 0;
int     diaActual       = -1;
int     handleATR       = INVALID_HANDLE;

// La zona marcada (el recuadro)
struct Zona { double alto; double bajo; bool alcista; bool activa; datetime creada; };
Zona zona;

//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(NumeroMagico);
   handleATR = iATR(_Symbol, _Period, 14);
   if(handleATR == INVALID_HANDLE) return(INIT_FAILED);
   zona.activa = false;
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) { if(handleATR != INVALID_HANDLE) IndicatorRelease(handleATR); }

//+------------------------------------------------------------------+
//| Helpers de velas (índice 1 = última vela cerrada)                |
//+------------------------------------------------------------------+
double O(int i){ return iOpen(_Symbol,_Period,i); }
double H(int i){ return iHigh(_Symbol,_Period,i); }
double L(int i){ return iLow(_Symbol,_Period,i); }
double C(int i){ return iClose(_Symbol,_Period,i); }
bool esAlcista(int i){ return C(i) > O(i); }
bool esBajista(int i){ return C(i) < O(i); }

double valorATR()
{
   double buf[1];
   if(CopyBuffer(handleATR, 0, 1, 1, buf) != 1) return 0;
   return buf[0];
}

//+------------------------------------------------------------------+
//| Filtro 1: ¿estamos en acumulación? (lateral = casino, no operar) |
//+------------------------------------------------------------------+
bool enAcumulacion()
{
   int idxAlto = iHighest(_Symbol,_Period,MODE_HIGH,RangoLateralVelas,1);
   int idxBajo = iLowest(_Symbol,_Period,MODE_LOW,RangoLateralVelas,1);
   if(idxAlto < 0 || idxBajo < 0) return true;
   double rango = H(idxAlto) - L(idxBajo);
   double atr = valorATR();
   return (atr > 0 && rango < atr * RangoLateralATR);
}

//+------------------------------------------------------------------+
//| Filtro 2: horario de sesión y tope de pérdida del día            |
//+------------------------------------------------------------------+
bool sesionAbierta()
{
   MqlDateTime t; TimeToStruct(TimeCurrent(), t);
   // Reset del tope diario al cambiar el día
   if(t.day != diaActual){ diaActual = t.day; equityInicioDia = AccountInfoDouble(ACCOUNT_EQUITY); }
   if(t.hour < HoraInicio || t.hour >= HoraFin) return false;
   double perdidaDia = equityInicioDia - AccountInfoDouble(ACCOUNT_EQUITY);
   if(equityInicioDia > 0 && perdidaDia >= equityInicioDia * TopePerdidaDiaPct/100.0)
      return false; // tocamos el tope del día: el bot se sienta
   return true;
}

//+------------------------------------------------------------------+
//| Paso 1: buscar la zona — la última vela a favor antes del        |
//| impulso contrario (p. ej. última vela ALCISTA antes de N rojas)  |
//+------------------------------------------------------------------+
void buscarZona()
{
   // Caso largo: N velas bajistas seguidas y justo antes una alcista
   for(int i = 1; i <= VelasLookback - VelasImpulso - 1; i++)
   {
      bool impulsoBajista = true;
      for(int k = i; k < i + VelasImpulso; k++)
         if(!esBajista(k)) { impulsoBajista = false; break; }
      int velaAncla = i + VelasImpulso; // la vela alcista anterior al impulso
      if(impulsoBajista && esAlcista(velaAncla))
      {
         zona.alto = MathMax(O(velaAncla), C(velaAncla)); // cuerpo de la vela
         zona.bajo = MathMin(O(velaAncla), C(velaAncla));
         zona.alcista = true;   // esperamos rebote hacia ARRIBA
         zona.activa = true;
         zona.creada = iTime(_Symbol,_Period,velaAncla);
         return;
      }
      // Caso corto (espejo): N velas alcistas seguidas y antes una bajista
      bool impulsoAlcista = true;
      for(int k = i; k < i + VelasImpulso; k++)
         if(!esAlcista(k)) { impulsoAlcista = false; break; }
      if(impulsoAlcista && esBajista(velaAncla))
      {
         zona.alto = MathMax(O(velaAncla), C(velaAncla));
         zona.bajo = MathMin(O(velaAncla), C(velaAncla));
         zona.alcista = false;  // esperamos rechazo hacia ABAJO
         zona.activa = true;
         zona.creada = iTime(_Symbol,_Period,velaAncla);
         return;
      }
   }
   zona.activa = false;
}

//+------------------------------------------------------------------+
//| Paso 2 y 3: ¿la última vela cerrada retesteó la zona y dejó      |
//| vela de rechazo? (mecha larga contra la zona)                    |
//+------------------------------------------------------------------+
bool hayRechazo()
{
   if(!zona.activa) return false;
   double rango = H(1) - L(1);
   if(rango <= 0) return false;

   if(zona.alcista)
   {
      // El low tocó la zona, cerró alcista y con mecha inferior larga
      bool toco = (L(1) <= zona.alto && L(1) >= zona.bajo - (zona.alto - zona.bajo));
      double mechaInferior = MathMin(O(1), C(1)) - L(1);
      return toco && esAlcista(1) && (mechaInferior / rango * 100.0 >= MechaMinimaPct);
   }
   else
   {
      bool toco = (H(1) >= zona.bajo && H(1) <= zona.alto + (zona.alto - zona.bajo));
      double mechaSuperior = H(1) - MathMax(O(1), C(1));
      return toco && esBajista(1) && (mechaSuperior / rango * 100.0 >= MechaMinimaPct);
   }
}

//+------------------------------------------------------------------+
//| Tamaño de lote según el riesgo (% de la cuenta / distancia SL)   |
//+------------------------------------------------------------------+
double calcularLote(double precioEntrada, double precioSL)
{
   double riesgoDinero = AccountInfoDouble(ACCOUNT_EQUITY) * RiesgoPorTradePct / 100.0;
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double distancia = MathAbs(precioEntrada - precioSL);
   if(tickValue <= 0 || tickSize <= 0 || distancia <= 0) return 0;
   double lote = riesgoDinero / (distancia / tickSize * tickValue);
   double paso = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   lote = MathFloor(lote / paso) * paso;
   double minLote = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLote = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   return MathMax(minLote, MathMin(maxLote, lote));
}

//+------------------------------------------------------------------+
//| Paso 5: break even — al llegar a 1R el SL se mueve a la entrada  |
//+------------------------------------------------------------------+
void gestionarBreakEven()
{
   for(int i = PositionsTotal()-1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetInteger(POSITION_MAGIC) != NumeroMagico) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

      double entrada = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl      = PositionGetDouble(POSITION_SL);
      double tp      = PositionGetDouble(POSITION_TP);
      double r       = MathAbs(entrada - sl);
      if(r <= 0 || sl == entrada) continue; // ya está en break even

      long tipo = PositionGetInteger(POSITION_TYPE);
      double precio = (tipo == POSITION_TYPE_BUY)
                      ? SymbolInfoDouble(_Symbol, SYMBOL_BID)
                      : SymbolInfoDouble(_Symbol, SYMBOL_ASK);

      bool llegoA1R = (tipo == POSITION_TYPE_BUY)
                      ? (precio >= entrada + r * BreakEvenEnR)
                      : (precio <= entrada - r * BreakEvenEnR);
      if(llegoA1R)
         trade.PositionModify(ticket, entrada, tp); // SL a la entrada: solo empata o gana
   }
}

bool hayPosicionAbierta()
{
   for(int i = PositionsTotal()-1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket)
         && PositionGetInteger(POSITION_MAGIC) == NumeroMagico
         && PositionGetString(POSITION_SYMBOL) == _Symbol) return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Loop principal: solo trabaja al cierre de cada vela              |
//+------------------------------------------------------------------+
void OnTick()
{
   gestionarBreakEven(); // esto sí corre en cada tick

   static datetime ultimaVela = 0;
   datetime velaActual = iTime(_Symbol,_Period,0);
   if(velaActual == ultimaVela) return; // esperar vela nueva
   ultimaVela = velaActual;

   if(!sesionAbierta()) return;          // fuera de horario o tope diario tocado
   if(hayPosicionAbierta()) return;      // un trade a la vez, como en la sala
   if(enAcumulacion()) return;           // lateral = casino: no se opera

   buscarZona();                         // Paso 1: marcar el recuadro
   if(!hayRechazo()) return;             // Pasos 2-3: retesteo + vela de rechazo

   // Paso 4: entrada con SL bajo la mecha y TP a RatioRR
   double buffer = BufferSLPuntos * _Point;
   if(zona.alcista)
   {
      double entrada = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double sl = L(1) - buffer;
      double r  = entrada - sl;
      if(r <= 0) return;
      double tp = entrada + r * RatioRR;
      double lote = calcularLote(entrada, sl);
      if(lote > 0) trade.Buy(lote, _Symbol, 0, sl, tp, "Recuadro largo");
   }
   else
   {
      double entrada = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double sl = H(1) + buffer;
      double r  = sl - entrada;
      if(r <= 0) return;
      double tp = entrada - r * RatioRR;
      double lote = calcularLote(entrada, sl);
      if(lote > 0) trade.Sell(lote, _Symbol, 0, sl, tp, "Recuadro corto");
   }
   zona.activa = false; // la zona se usa una sola vez
}
//+------------------------------------------------------------------+
