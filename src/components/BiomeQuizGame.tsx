import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Trees,
  Waves,
} from "lucide-react";
import { THEMES } from "../themes";
import {
  QuizDefinition,
  calculateQuizResult,
} from "../quizzesData";

interface BiomeQuizGameProps {
  quiz: QuizDefinition;
  onExit: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export const BiomeQuizGame: React.FC<BiomeQuizGameProps> = ({
  quiz,
  onExit,
}) => {
  const quizTheme = THEMES[quiz.themeId] || THEMES.amazonia;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Reset state whenever a different quiz is opened
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setWrongCount(0);
    setScore(0);
    setIsFinished(false);
  }, [quiz.id]);

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentIndex];
  const hasAnswered = selectedOption !== null;
  const isCorrectSelection =
    hasAnswered && selectedOption === currentQuestion.correctIndex;

  const handleSelectOption = (optionIndex: number) => {
    if (hasAnswered || isFinished) return;
    setSelectedOption(optionIndex);
    if (optionIndex === currentQuestion.correctIndex) {
      setCorrectCount((prev) => prev + 1);
      setScore((prev) => prev + quiz.pointsPerCorrect);
    } else {
      setWrongCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!hasAnswered) return;
    if (currentIndex + 1 >= totalQuestions) {
      setIsFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setWrongCount(0);
    setScore(0);
    setIsFinished(false);
  };

  const resultSummary = calculateQuizResult(quiz, correctCount);
  const progressPercent = isFinished
    ? 100
    : Math.round(((currentIndex + (hasAnswered ? 1 : 0)) / totalQuestions) * 100);

  return (
    <section
      aria-label={quiz.title}
      className="flex-1 flex flex-col justify-center py-3 sm:py-6 animate-fade-in max-w-4xl mx-auto w-full"
    >
      <div
        className="rounded-3xl border-2 overflow-hidden shadow-2xl transition-colors duration-300"
        style={{
          backgroundColor: quizTheme.colors.bgSurface,
          borderColor: quizTheme.colors.borderMain,
          boxShadow: `0 0 36px ${quizTheme.glowColor}, 0 18px 46px rgba(0,0,0,0.85)`,
        }}
      >
        {/* Top Quiz Bar */}
        <div
          className="px-5 sm:px-7 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            backgroundColor: quizTheme.colors.bgCard,
            borderColor: quizTheme.colors.borderSubtle,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: quizTheme.colors.primary,
                color: quizTheme.colors.primaryText,
                borderColor: quizTheme.colors.borderMain,
              }}
            >
              {quiz.themeId === "pantanal" ? (
                <Waves className="w-5 h-5" />
              ) : (
                <Trees className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                className="font-display font-extrabold text-base sm:text-xl uppercase tracking-wide truncate"
                style={{ color: quizTheme.colors.textPrimary }}
              >
                {quiz.title}
              </h2>
              <p
                className="text-[11px] font-mono truncate"
                style={{ color: quizTheme.colors.textMuted }}
              >
                {isFinished
                  ? "Resultado Final do Desafio"
                  : `Pergunta ${currentIndex + 1} de ${totalQuestions} · ${currentQuestion.topic}`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div
              className="px-3.5 py-1.5 rounded-xl border font-mono text-xs font-extrabold tabular-nums"
              style={{
                backgroundColor: quizTheme.colors.bgApp,
                color: quizTheme.colors.primary,
                borderColor: quizTheme.colors.borderSubtle,
              }}
            >
              Pontuação: {score.toLocaleString("pt-BR")} pts
            </div>

            <button
              type="button"
              onClick={onExit}
              className="px-3.5 py-1.5 rounded-xl border font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all hover:brightness-110"
              style={{
                backgroundColor: quizTheme.colors.bgApp,
                color: quizTheme.colors.textPrimary,
                borderColor: quizTheme.colors.borderSubtle,
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>VOLTAR</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="w-full h-2"
          style={{ backgroundColor: quizTheme.colors.bgApp }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: quizTheme.colors.primary,
            }}
          />
        </div>

        {/* GAME BODY OR RESULTS SCREEN */}
        {!isFinished ? (
          <div className="p-5 sm:p-8 space-y-6">
            {/* Active Question Display */}
            <div
              className="p-5 sm:p-7 rounded-2xl border text-center sm:text-left space-y-2.5"
              style={{
                backgroundColor: quizTheme.colors.bgCard,
                borderColor: quizTheme.colors.borderSubtle,
              }}
            >
              <div
                className="text-[11px] font-mono font-bold uppercase tracking-widest flex flex-wrap items-center justify-center sm:justify-between gap-2"
                style={{ color: quizTheme.colors.accent }}
              >
                <span>
                  Pergunta {currentIndex + 1} de {totalQuestions}
                </span>
                <span>
                  Tema: {currentQuestion.topic} · Vale 1.000 pontos
                </span>
              </div>

              <h3
                className="font-display font-extrabold text-xl sm:text-2xl leading-snug"
                style={{ color: quizTheme.colors.textPrimary }}
              >
                {currentQuestion.question}
              </h3>
            </div>

            {/* 4 Large Interactive Option Buttons */}
            <div
              className="grid grid-cols-1 gap-3.5"
              role="group"
              aria-label="Alternativas da pergunta"
            >
              {currentQuestion.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;

                let cardBg = quizTheme.colors.bgCard;
                let cardBorder = quizTheme.colors.borderSubtle;
                let textColor = quizTheme.colors.textPrimary;
                let letterBg = quizTheme.colors.bgApp;
                let letterColor = quizTheme.colors.primary;

                if (hasAnswered) {
                  if (isCorrectOption) {
                    cardBg = "rgba(16, 185, 129, 0.18)";
                    cardBorder = "#10b981";
                    textColor = "#ecfdf5";
                    letterBg = "#10b981";
                    letterColor = "#02170d";
                  } else if (isSelected && !isCorrectOption) {
                    cardBg = "rgba(239, 68, 68, 0.18)";
                    cardBorder = "#ef4444";
                    textColor = "#fef2f2";
                    letterBg = "#ef4444";
                    letterColor = "#ffffff";
                  } else {
                    cardBg = quizTheme.colors.bgApp;
                    cardBorder = quizTheme.colors.borderSubtle;
                    textColor = quizTheme.colors.textMuted;
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full min-h-[62px] p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-4 ${
                      hasAnswered
                        ? "cursor-default"
                        : "cursor-pointer hover:brightness-125 active:scale-[0.99]"
                    }`}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      color: textColor,
                    }}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      <span
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-mono font-extrabold text-sm flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: letterBg,
                          color: letterColor,
                          borderColor: cardBorder,
                        }}
                      >
                        {OPTION_LETTERS[idx]}
                      </span>
                      <span className="font-sans font-semibold text-sm sm:text-base leading-snug">
                        {optionText}
                      </span>
                    </div>

                    {hasAnswered && isCorrectOption && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Immediate Feedback + Next Button */}
            {hasAnswered && (
              <div
                className="p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in"
                style={{
                  backgroundColor: isCorrectSelection
                    ? "rgba(6, 78, 59, 0.55)"
                    : "rgba(127, 29, 29, 0.45)",
                  borderColor: isCorrectSelection ? "#10b981" : "#ef4444",
                }}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 font-display font-extrabold text-base uppercase text-white">
                    {isCorrectSelection ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Resposta Correta! +1.000 pontos</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span>
                          Resposta Incorreta (0 pontos) · Correta:{" "}
                          {OPTION_LETTERS[currentQuestion.correctIndex]}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-sans text-zinc-100 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-6 py-3.5 rounded-xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider border-2 cursor-pointer flex items-center justify-center gap-2 shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: quizTheme.colors.primary,
                    color: quizTheme.colors.primaryText,
                    borderColor: quizTheme.colors.borderMain,
                  }}
                >
                  <span>
                    {currentIndex + 1 >= totalQuestions
                      ? "VER RESULTADOS"
                      : "PRÓXIMA PERGUNTA"}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* FINAL RESULTS SCREEN */
          <div className="p-6 sm:p-8 space-y-6 text-center animate-fade-in">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center"
                style={{
                  backgroundColor: quizTheme.colors.bgCard,
                  borderColor: quizTheme.colors.borderMain,
                  color: quizTheme.colors.primary,
                  boxShadow: `0 0 24px ${quizTheme.glowColor}`,
                }}
              >
                <Trophy className="w-8 h-8" />
              </div>

              <div
                className="text-xs font-mono font-bold uppercase tracking-widest"
                style={{ color: quizTheme.colors.accent }}
              >
                {quiz.title} · CONCLUÍDO
              </div>

              <h3
                className="font-display font-extrabold text-2xl sm:text-3xl uppercase"
                style={{ color: quizTheme.colors.textPrimary }}
              >
                {resultSummary.encouragementTitle}
              </h3>

              <p
                className="text-sm sm:text-base font-sans max-w-xl leading-relaxed"
                style={{ color: quizTheme.colors.textSecondary }}
              >
                {resultSummary.encouragementMessage}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-left">
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: quizTheme.colors.bgCard,
                  borderColor: quizTheme.colors.borderMain,
                }}
              >
                <div
                  className="text-[10px] font-mono uppercase font-bold"
                  style={{ color: quizTheme.colors.textMuted }}
                >
                  Pontuação Total
                </div>
                <div
                  className="font-mono font-extrabold text-xl sm:text-2xl tabular-nums mt-1"
                  style={{ color: quizTheme.colors.primary }}
                >
                  {resultSummary.totalScore.toLocaleString("pt-BR")}
                </div>
                <div
                  className="text-[11px] font-mono"
                  style={{ color: quizTheme.colors.textSecondary }}
                >
                  de {resultSummary.maxScore.toLocaleString("pt-BR")} pts
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: quizTheme.colors.bgCard,
                  borderColor: quizTheme.colors.borderSubtle,
                }}
              >
                <div
                  className="text-[10px] font-mono uppercase font-bold"
                  style={{ color: quizTheme.colors.textMuted }}
                >
                  Acertos
                </div>
                <div className="font-mono font-extrabold text-xl sm:text-2xl tabular-nums mt-1 text-emerald-400">
                  {resultSummary.correctCount}
                </div>
                <div
                  className="text-[11px] font-mono"
                  style={{ color: quizTheme.colors.textSecondary }}
                >
                  de {resultSummary.totalQuestions} perguntas
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: quizTheme.colors.bgCard,
                  borderColor: quizTheme.colors.borderSubtle,
                }}
              >
                <div
                  className="text-[10px] font-mono uppercase font-bold"
                  style={{ color: quizTheme.colors.textMuted }}
                >
                  Erros
                </div>
                <div className="font-mono font-extrabold text-xl sm:text-2xl tabular-nums mt-1 text-red-400">
                  {resultSummary.wrongCount}
                </div>
                <div
                  className="text-[11px] font-mono"
                  style={{ color: quizTheme.colors.textSecondary }}
                >
                  de {resultSummary.totalQuestions} perguntas
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: quizTheme.colors.bgCard,
                  borderColor: quizTheme.colors.borderSubtle,
                }}
              >
                <div
                  className="text-[10px] font-mono uppercase font-bold"
                  style={{ color: quizTheme.colors.textMuted }}
                >
                  Aproveitamento
                </div>
                <div
                  className="font-mono font-extrabold text-xl sm:text-2xl tabular-nums mt-1"
                  style={{ color: quizTheme.colors.accent }}
                >
                  {resultSummary.percentage}%
                </div>
                <div
                  className="text-[11px] font-mono"
                  style={{ color: quizTheme.colors.textSecondary }}
                >
                  desempenho geral
                </div>
              </div>
            </div>

            {/* Action Buttons: JOGAR NOVAMENTE & VOLTAR */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestartQuiz}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider border-2 cursor-pointer flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: quizTheme.colors.primary,
                  color: quizTheme.colors.primaryText,
                  borderColor: quizTheme.colors.borderMain,
                }}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>JOGAR NOVAMENTE</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-display font-bold text-sm uppercase tracking-wider border-2 cursor-pointer flex items-center justify-center gap-2.5 transition-all hover:brightness-110"
                style={{
                  backgroundColor: quizTheme.colors.bgCard,
                  color: quizTheme.colors.textPrimary,
                  borderColor: quizTheme.colors.borderSubtle,
                }}
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>VOLTAR</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
