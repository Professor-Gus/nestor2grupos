import type { ThemeId } from "./themes";

export type QuizId = "amazonia" | "pantanal";

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface QuizDefinition {
  id: QuizId;
  title: string;
  subtitle: string;
  themeId: ThemeId;
  pointsPerCorrect: number;
  maxScore: number;
  questions: QuizQuestion[];
}

export interface QuizResultSummary {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  percentage: number;
  encouragementTitle: string;
  encouragementMessage: string;
}

export const POINTS_PER_CORRECT_ANSWER = 1000;

export const QUIZZES: Record<QuizId, QuizDefinition> = {
  amazonia: {
    id: "amazonia",
    title: "QUIZ DA AMAZÔNIA",
    subtitle: "Biodiversidade, vegetação, clima, ameaças e monitoramento ambiental",
    themeId: "amazonia",
    pointsPerCorrect: POINTS_PER_CORRECT_ANSWER,
    maxScore: 5000,
    questions: [
      {
        id: "amz-q1",
        topic: "Vegetação e Clima",
        question:
          "Por que a Floresta Amazônica é essencial para o equilíbrio das chuvas em grande parte da América do Sul?",
        options: [
          "Porque bloqueia completamente a entrada de massas de ar vindas do Oceano Atlântico.",
          "Porque suas árvores liberam grande volume de vapor d'água pela evapotranspiração, formando os chamados rios voadores.",
          "Porque o solo arenoso da floresta armazena neve durante o inverno e libera umidade no verão.",
          "Porque impede a incidência de luz solar sobre os rios da bacia amazônica.",
        ],
        correctIndex: 1,
        explanation:
          "A vegetação densa da Amazônia bombeia bilhões de toneladas de vapor d'água para a atmosfera, alimentando chuvas em várias regiões do Brasil.",
      },
      {
        id: "amz-q2",
        topic: "Animais e Biodiversidade",
        question:
          "Qual destes animais é um mamífero herbívoro aquático nativo dos rios amazônicos que desempenha papel importante no equilíbrio da vegetação submersa?",
        options: [
          "Peixe-boi-da-amazônia",
          "Lobo-guará",
          "Pinguim-de-magalhães",
          "Mico-leão-dourado",
        ],
        correctIndex: 0,
        explanation:
          "O peixe-boi-da-amazônia vive nos rios e lagos da bacia amazônica e se alimenta de plantas aquáticas, ajudando na ciclagem de nutrientes.",
      },
      {
        id: "amz-q3",
        topic: "Desmatamento e Queimadas",
        question:
          "Qual é uma das principais consequências diretas do avanço do desmatamento e das queimadas na Amazônia?",
        options: [
          "Aumento permanente da fertilidade mineral profunda sem necessidade de cobertura vegetal.",
          "Resfriamento imediato do clima local e redução das emissões de carbono.",
          "Perda de habitats, redução da biodiversidade e maior emissão de gases de efeito estufa.",
          "Substituição natural das espécies nativas por rios subterrâneos mais profundos.",
        ],
        correctIndex: 2,
        explanation:
          "O desmatamento e as queimadas destroem habitats de diversas espécies e liberam grandes quantidades de carbono armazenado na floresta.",
      },
      {
        id: "amz-q4",
        topic: "Vegetação Amazônica",
        question:
          "Como são chamadas as áreas de floresta amazônica que ficam periodicamente alagadas pelas águas barrentas e ricas em nutrientes dos grandes rios?",
        options: [
          "Campos sulinos",
          "Cerrado rupestre",
          "Caatinga arbustiva",
          "Matas de várzea",
        ],
        correctIndex: 3,
        explanation:
          "As matas de várzea acompanham rios de águas barrentas (como o Amazonas e o Solimões) e passam por inundações sazonais que fertilizam o solo.",
      },
      {
        id: "amz-q5",
        topic: "Preservação e Monitoramento Ambiental",
        question:
          "De que maneira sensores IoT, satélites e drones contribuem para a preservação da Floresta Amazônica?",
        options: [
          "Substituindo todas as árvores por torres metálicas de transmissão.",
          "Detectando focos de incêndio, variações microclimáticas e abertura de clareiras em tempo real para agilizar a proteção ambiental.",
          "Bloqueando a coleta de dados científicos sobre espécies ameaçadas.",
          "Acelerando a derrubada seletiva de árvores sem fiscalização.",
        ],
        correctIndex: 1,
        explanation:
          "O monitoramento ambiental inteligente integra sensores de temperatura, umidade, câmeras e satélites para identificar ameaças rapidamente.",
      },
    ],
  },
  pantanal: {
    id: "pantanal",
    title: "QUIZ DO PANTANAL",
    subtitle: "Cheias e secas, rios, fauna, queimadas e monitoramento inteligente",
    themeId: "pantanal",
    pointsPerCorrect: POINTS_PER_CORRECT_ANSWER,
    maxScore: 5000,
    questions: [
      {
        id: "pnt-q1",
        topic: "Cheias, Secas e Rios",
        question:
          "Qual característica natural comanda o ritmo da vida e dos ecossistemas no Pantanal ao longo do ano?",
        options: [
          "O congelamento superficial dos rios durante os meses mais frios.",
          "A entrada constante de água salgada do oceano na planície central.",
          "O pulso anual de cheias e vazantes (secas), regulado pelas chuvas na Bacia do Alto Paraguai.",
          "A ausência total de rios perenes em todo o território pantaneiro.",
        ],
        correctIndex: 2,
        explanation:
          "O ciclo alternado de cheias e secas renova nutrientes, cria áreas de alimentação e orienta a reprodução de peixes, aves e mamíferos.",
      },
      {
        id: "pnt-q2",
        topic: "Animais e Biodiversidade",
        question:
          "Qual ave de grande porte, com plumagem branca, pescoço preto e faixa vermelha na base, é considerada a ave-símbolo do Pantanal?",
        options: [
          "Tuiuiú (Jaburu)",
          "Condor-dos-andes",
          "Pardal-europeu",
          "Albatroz-real",
        ],
        correctIndex: 0,
        explanation:
          "O tuiuiú (Jabiru mycteria) constrói grandes ninhos no alto das árvores e se alimenta em áreas alagadas, simbolizando o bioma pantaneiro.",
      },
      {
        id: "pnt-q3",
        topic: "Queimadas e Preservação",
        question:
          "Por que os incêndios em períodos de seca extrema são especialmente graves e difíceis de controlar no Pantanal?",
        options: [
          "Porque a água dos rios apaga qualquer brasa em poucos segundos, mesmo sem chuva.",
          "Porque o fogo pode queimar matéria orgânica seca acumulada sob o solo (turfa), espalhando-se de forma subterrânea e ameaçando a fauna.",
          "Porque as queimadas ocorrem apenas nas copas mais altas e nunca atingem o solo.",
          "Porque aumentam imediatamente o oxigênio dissolvido nas lagoas.",
        ],
        correctIndex: 1,
        explanation:
          "Durante secas severas, a vegetação seca e a turfa subterrânea mantêm brasas ativas, exigindo prevenção e combate rápido para proteger a fauna.",
      },
      {
        id: "pnt-q4",
        topic: "Biodiversidade Aquática",
        question:
          "Qual mamífero semiaquático vive em grupos familiares nos rios e corixos do Pantanal e depende de águas limpas e margens preservadas?",
        options: [
          "Urso-pardo",
          "Suricato",
          "Coala",
          "Ariranha",
        ],
        correctIndex: 3,
        explanation:
          "A ariranha (Pteronura brasiliensis), também chamada de lontra gigante, é excelente nadadora e indica boa qualidade ambiental nos rios.",
      },
      {
        id: "pnt-q5",
        topic: "Monitoramento Ambiental e Preservação",
        question:
          "Em um projeto de Ambiente Inteligente para o Pantanal, qual é o papel das boias multiparâmetro e dos radares de nível fluvial?",
        options: [
          "Impedir o escoamento natural das águas entre os rios e as baías.",
          "Monitorar em tempo real o nível dos rios, temperatura, turbidez e oxigênio dissolvido para apoiar ações de preservação e alerta.",
          "Substituir as espécies de peixes nativos por sensores subaquáticos.",
          "Desviar toda a água das áreas alagadas para fora do bioma.",
        ],
        correctIndex: 1,
        explanation:
          "Sensores fluviais ajudam pesquisadores e comunidades a acompanhar secas, cheias e a qualidade da água para proteger os ecossistemas aquáticos.",
      },
    ],
  },
};

export const QUIZ_LIST: QuizDefinition[] = [
  QUIZZES.amazonia,
  QUIZZES.pantanal,
];

export function getQuizById(quizId: QuizId): QuizDefinition {
  return QUIZZES[quizId] || QUIZZES.amazonia;
}

export function calculateQuizResult(
  quiz: QuizDefinition,
  correctCount: number
): QuizResultSummary {
  const totalQuestions = quiz.questions.length;
  const clampedCorrect = Math.max(0, Math.min(totalQuestions, correctCount));
  const wrongCount = totalQuestions - clampedCorrect;
  const totalScore = clampedCorrect * quiz.pointsPerCorrect;
  const percentage =
    totalQuestions > 0 ? Math.round((clampedCorrect / totalQuestions) * 100) : 0;

  let encouragementTitle = "Continue Explorando!";
  let encouragementMessage =
    "Cada tentativa fortalece seu conhecimento sobre nossos biomas e tecnologias de preservação. Jogue novamente para superar sua marca!";

  if (percentage === 100) {
    encouragementTitle = "Desempenho Excelente!";
    encouragementMessage =
      "Parabéns! Você gabaritou o desafio e demonstrou domínio completo sobre biodiversidade, preservação e monitoramento ambiental.";
  } else if (percentage >= 80) {
    encouragementTitle = "Ótimo Resultado!";
    encouragementMessage =
      "Muito bem! Você mostrou excelente conhecimento sobre o ecossistema e os desafios de conservação. Falta pouco para os 5.000 pontos!";
  } else if (percentage >= 60) {
    encouragementTitle = "Bom Trabalho!";
    encouragementMessage =
      "Você está no caminho certo! Continue observando como a natureza e os ambientes inteligentes se conectam na preservação ambiental.";
  }

  return {
    totalScore,
    maxScore: quiz.maxScore,
    correctCount: clampedCorrect,
    wrongCount,
    totalQuestions,
    percentage,
    encouragementTitle,
    encouragementMessage,
  };
}
