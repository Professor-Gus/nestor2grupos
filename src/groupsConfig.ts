import type { ThemeId } from "./themes";

export type GroupId = "grupoPantanal" | "grupoAmazonia";

export type VideoActionType = "intro" | "informative" | "ending";

export interface GroupIntroVideo {
  id: string;
  title: string;
  videoUrl: string;
  actionType: "intro";
}

export interface GroupTrigger {
  id: string;
  phrase: string;
  videoUrl: string;
  actionType: "informative" | "ending";
  description: string;
}

export interface GroupConfig {
  id: GroupId;
  name: string;
  shortName: string;
  members: string[];
  temaReferencia: ThemeId;
  ecosystemSummary: string;
  intro: GroupIntroVideo;
  triggers: GroupTrigger[];
}

export const groupsConfig: Record<GroupId, GroupConfig> = {
  grupoPantanal: {
    id: "grupoPantanal",
    name: "Grupo Pantanal",
    shortName: "Pantanal",
    members: ["Samuel", "Gabriel", "Pietro", "Lucas"],
    temaReferencia: "pantanal",
    ecosystemSummary:
      "Áreas alagadas, rios, lagoas, vegetação típica e monitoramento inteligente da fauna pantaneira.",
    intro: {
      id: "pantanal-intro",
      title: "Introdução — Grupo Pantanal",
      videoUrl: "https://youtu.be/EEEO4LGpTYI?feature=shared",
      actionType: "intro",
    },
    triggers: [
      {
        id: "pantanal-trigger-1",
        phrase: "Como é a flora no Pantanal?",
        videoUrl: "https://youtu.be/NjhrHMMFzZE?feature=shared",
        actionType: "informative",
        description: "Vegetação e flora característica das planícies alagadas do Pantanal.",
      },
      {
        id: "pantanal-trigger-2",
        phrase: "Como preservar?",
        videoUrl: "https://youtu.be/OclFc3HuRqI?feature=shared",
        actionType: "informative",
        description: "Ações de preservação e tecnologias de monitoramento ambiental no Pantanal.",
      },
      {
        id: "pantanal-trigger-3",
        phrase: "Onde está localizada?",
        videoUrl: "https://youtu.be/LEdP90SqgbI?feature=shared",
        actionType: "informative",
        description: "Localização geográfica e abrangência do bioma Pantanal.",
      },
      {
        id: "pantanal-trigger-4",
        phrase: "Me fale sobre os animais",
        videoUrl: "https://youtu.be/GM9UYtqH--c?feature=shared",
        actionType: "informative",
        description: "Fauna pantaneira e espécies características monitoradas.",
      },
    ],
  },
  grupoAmazonia: {
    id: "grupoAmazonia",
    name: "Grupo Amazônia",
    shortName: "Amazônia",
    members: ["Davi", "Maria Anny", "Bernardo"],
    temaReferencia: "amazonia",
    ecosystemSummary:
      "Floresta tropical densa, rios amazônicos, biodiversidade abundante e sensores ambientais.",
    intro: {
      id: "amazonia-intro",
      title: "Introdução — Grupo Amazônia",
      videoUrl: "https://youtu.be/zqqa1Q8wGOQ?feature=shared",
      actionType: "intro",
    },
    triggers: [
      {
        id: "amazonia-trigger-1",
        phrase: "Qual a importância da floresta?",
        videoUrl: "https://youtu.be/rR1yoNhFjBo?feature=shared",
        actionType: "informative",
        description: "Papel climático, hídrico e ecológico da Floresta Amazônica.",
      },
      {
        id: "amazonia-trigger-2",
        phrase: "Quais são as principais ameaças?",
        videoUrl: "https://youtu.be/mdqQDD8GEak?feature=shared",
        actionType: "informative",
        description: "Principais ameaças ambientais e monitoramento por sensores inteligentes.",
      },
      {
        id: "amazonia-trigger-3",
        phrase: "Tchau",
        videoUrl: "https://youtu.be/uaAJmmmojDM?feature=shared",
        actionType: "ending",
        description: "Vídeo de encerramento da apresentação do Grupo Amazônia.",
      },
      {
        id: "amazonia-trigger-4",
        phrase: "Me fale sobre os animais",
        videoUrl: "https://youtu.be/PF4eVRNvxKo?feature=shared",
        actionType: "informative",
        description: "Fauna amazônica e espécies nativas da floresta.",
      },
    ],
  },
};

export const GROUP_LIST: GroupConfig[] = [
  groupsConfig.grupoPantanal,
  groupsConfig.grupoAmazonia,
];

export function getGroupById(groupId: GroupId): GroupConfig {
  return groupsConfig[groupId] || groupsConfig.grupoPantanal;
}

export function getGroupTriggers(groupId: GroupId): GroupTrigger[] {
  return getGroupById(groupId).triggers;
}

export function getGroupVideoById(
  groupId: GroupId,
  videoId: string
): GroupIntroVideo | GroupTrigger | null {
  const group = getGroupById(groupId);
  if (videoId === group.intro.id || videoId === "intro") {
    return group.intro;
  }
  return group.triggers.find((t) => t.id === videoId) || null;
}

export function isEndingVideoForGroup(groupId: GroupId, videoId: string): boolean {
  const video = getGroupVideoById(groupId, videoId);
  return video?.actionType === "ending";
}
