// API que o widget do Ybera Feedback publica em window quando o yfb.js carrega.
// Ver README do projeto Feedbacks, seção "Controlar o gatilho pelo próprio produto".
interface YberaFeedbackApi {
  /** false = a pessoa já avaliou e ainda está no prazo de silêncio. */
  canAsk(): Promise<boolean>
  /** Abre o card; resolve true se avaliou, false se fechou sem avaliar. */
  open(): Promise<boolean>
  close(): void
}

interface Window {
  YberaFeedback?: YberaFeedbackApi
}
