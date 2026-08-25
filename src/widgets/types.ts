/**
 * Contrato de los widgets.
 *
 * Los widgets NUNCA importan lógica de lección. Solo reciben props (desde el
 * JSON) y, para preguntas manipulables, emiten su estado con `onInteraction`.
 */
export interface WidgetProps {
  /** Props arbitrarias provenientes del JSON de la lección. */
  [key: string]: unknown;
  /**
   * Emite el estado actual como cadena determinista. La valida el motor
   * (nunca un LLM). Ausente cuando el widget es puramente expositivo.
   */
  onInteraction?: (value: string) => void;
}
