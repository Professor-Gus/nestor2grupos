import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Send,
  Tv,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Settings,
  Video,
  Eye,
  EyeOff,
  Check,
  Play,
  Image as ImageIcon,
  Maximize,
  Minimize,
  Smartphone,
  ShieldCheck,
  Lock,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Download,
  Save,
  Palette,
  Trees,
  Waves,
  Users,
  Home,
  ArrowLeft,
  Cpu,
  Upload,
} from "lucide-react";
import { safeStorage } from "./safeStorage";
import { ThemeId, THEMES, THEME_LIST, isValidThemeId } from "./themes";
import {
  groupsConfig,
  GROUP_LIST,
  GroupId,
  GroupConfig,
  GroupTrigger,
  VideoActionType,
  getGroupById,
  getGroupVideoById,
} from "./groupsConfig";
import { SmartAmbientParticles } from "./components/SmartAmbientParticles";
import { SmartEcosystemModal } from "./components/SmartEcosystemDrawer";
import { NatureAssistantsLogo } from "./components/NatureAssistantsLogo";

export type AppScreen = "welcome" | "group-selection" | "presentation";
export type VideoQualityPreference = "hd1080" | "hd720" | "large" | "medium" | "auto";

interface PlaybackSession {
  playId: number;
  groupId: GroupId | null;
  videoId: string | null;
  actionType: VideoActionType | null;
  endedHandled: boolean;
}

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return Boolean(getYouTubeVideoId(url));
}

export function normalizeSpeechText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFuzzyMatchScore(input: string, targetPhrase: string): number {
  if (!input || !targetPhrase) return 0;
  const inputClean = normalizeSpeechText(input);
  const targetClean = normalizeSpeechText(targetPhrase);

  if (!inputClean || !targetClean) return 0;
  if (inputClean === targetClean) return 1.0;

  if (inputClean.includes(targetClean) || targetClean.includes(inputClean)) {
    return 0.95;
  }

  const stopWords = new Set(["como", "quais", "qual", "onde", "sobre", "para", "esta", "sao", "me", "os", "as", "no", "na", "do", "da", "de", "a", "o", "e"]);
  const inputWords = inputClean.split(" ").filter((w) => w.length > 1);
  const significantTargetWords = targetClean
    .split(" ")
    .filter((w) => w.length > 2 && !stopWords.has(w));
  const targetWords =
    significantTargetWords.length > 0
      ? significantTargetWords
      : targetClean.split(" ").filter((w) => w.length > 1);

  if (targetWords.length === 0) return 0;

  let matchCount = 0;
  for (const tWord of targetWords) {
    const matched = inputWords.some((iWord) => {
      if (iWord === tWord) return true;
      const minLen = Math.min(tWord.length, iWord.length);
      if (minLen >= 4) {
        return tWord.substring(0, 4) === iWord.substring(0, 4);
      }
      return false;
    });
    if (matched) matchCount++;
  }

  return matchCount / targetWords.length;
}

export function matchGroupTrigger(
  input: string,
  triggers: GroupTrigger[]
): { trigger: GroupTrigger | null; score: number } {
  const cleanInput = normalizeSpeechText(input);
  if (!cleanInput || !triggers || triggers.length === 0) {
    return { trigger: null, score: 0 };
  }

  let bestTrigger: GroupTrigger | null = null;
  let bestScore = 0;

  for (const trigger of triggers) {
    let score = getFuzzyMatchScore(cleanInput, trigger.phrase);

    // Extra keyword tolerance for natural speech variations strictly within the group's registered triggers
    const cleanPhrase = normalizeSpeechText(trigger.phrase);
    if (cleanPhrase === "tchau") {
      if (
        cleanInput === "tchau" ||
        cleanInput.includes("tchau") ||
        cleanInput.includes("chau") ||
        cleanInput.includes("ate logo") ||
        cleanInput.includes("adeus")
      ) {
        score = Math.max(score, 0.98);
      }
    } else if (cleanPhrase.includes("animais") && (cleanInput.includes("animais") || cleanInput.includes("animal") || cleanInput.includes("fauna"))) {
      score = Math.max(score, 0.9);
    } else if (cleanPhrase.includes("flora") && (cleanInput.includes("flora") || cleanInput.includes("vegetacao") || cleanInput.includes("plantas"))) {
      score = Math.max(score, 0.9);
    } else if (cleanPhrase.includes("preservar") && (cleanInput.includes("preservar") || cleanInput.includes("preservacao") || cleanInput.includes("proteger"))) {
      score = Math.max(score, 0.9);
    } else if (cleanPhrase.includes("localizada") && (cleanInput.includes("localizada") || cleanInput.includes("localizacao") || cleanInput.includes("onde fica") || cleanInput.includes("local"))) {
      score = Math.max(score, 0.9);
    } else if (cleanPhrase.includes("importancia") && (cleanInput.includes("importancia") || cleanInput.includes("importante"))) {
      score = Math.max(score, 0.9);
    } else if (cleanPhrase.includes("ameacas") && (cleanInput.includes("ameacas") || cleanInput.includes("ameaca") || cleanInput.includes("perigos") || cleanInput.includes("desmatamento"))) {
      score = Math.max(score, 0.9);
    }

    if (score > bestScore) {
      bestScore = score;
      bestTrigger = trigger;
    }
  }

  return { trigger: bestScore >= 0.55 ? bestTrigger : null, score: bestScore };
}

export default function App() {
  // Primary Navigation Screens: welcome -> group-selection -> presentation
  const [appScreen, setAppScreen] = useState<AppScreen>("welcome");
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");

  // Active Group State (isolated strictly from groupsConfig)
  const [selectedGroupId, setSelectedGroupId] = useState<GroupId | null>(null);
  const activeGroup: GroupConfig | null = selectedGroupId
    ? getGroupById(selectedGroupId)
    : null;

  // Independent Visual Theme State (Strictly 2 official themes: pantanal | amazonia)
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(() => {
    try {
      const saved = safeStorage.getItem("an_selected_theme");
      if (isValidThemeId(saved)) {
        return saved;
      }
    } catch (_) {}
    return "amazonia";
  });

  const currentTheme = THEMES[selectedThemeId] || THEMES.amazonia;
  const [showEcosystemModal, setShowEcosystemModal] = useState<boolean>(false);

  // Playback State
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [ytReloadKey, setYtReloadKey] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoFinished, setVideoFinished] = useState<boolean>(false);
  const [presentationEnded, setPresentationEnded] = useState<boolean>(false);
  const [viewedVideoIds, setViewedVideoIds] = useState<string[]>([]);
  const [videoMuted, setVideoMuted] = useState<boolean>(false);
  const [videoPlayError, setVideoPlayError] = useState<string>("");

  // Voice & Command State
  const [inputText, setInputText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastSpeechDetected, setLastSpeechDetected] = useState<string>("");
  const [realtimeSpeech, setRealtimeSpeech] = useState<string>("");
  const [speechError, setSpeechError] = useState<string>("");
  const [aiResponseText, setAiResponseText] = useState<string>(
    "Selecione um grupo e clique em um gatilho ou fale uma das frases cadastradas."
  );

  // Microphone & Audio Recording State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isRecordingMedia, setIsRecordingMedia] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [micPermission, setMicPermission] = useState<
    "unknown" | "granted" | "denied" | "prompt" | "unsupported"
  >("unknown");
  const [showMicModal, setShowMicModal] = useState<boolean>(false);
  const [preferredSpeechEngine, setPreferredSpeechEngine] = useState<
    "auto" | "gemini" | "native"
  >(() => {
    const saved = safeStorage.getItem("an_speech_engine");
    if (saved === "gemini" || saved === "native" || saved === "auto") return saved;
    return "auto";
  });

  // UI & Layout Controls
  const [hidePanels, setHidePanels] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Video Quality Preferences (always Fit / object-fit: contain, NEVER auto-fullscreen)
  const [preferredVideoQuality, setPreferredVideoQuality] =
    useState<VideoQualityPreference>(() => {
      const saved = safeStorage.getItem("an_video_quality");
      if (
        saved === "hd1080" ||
        saved === "hd720" ||
        saved === "large" ||
        saved === "medium" ||
        saved === "auto"
      ) {
        return saved;
      }
      return "hd1080";
    });
  const preferredVideoQualityRef = useRef<VideoQualityPreference>(preferredVideoQuality);

  const [force1080pOnly, setForce1080pOnly] = useState<boolean>(() => {
    const saved = safeStorage.getItem("an_force_1080p_only");
    return saved !== null ? saved === "true" : true;
  });

  // Background Immersion Controls
  const [showBgImage, setShowBgImage] = useState<boolean>(() => {
    const saved = safeStorage.getItem("an_show_bg_image");
    return saved !== null ? saved === "true" : true;
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = safeStorage.getItem("an_bg_opacity");
    return saved !== null ? Number(saved) : 32;
  });

  // Toast Notification
  const [saveToast, setSaveToast] = useState<{
    message: string;
    visible: boolean;
  } | null>(null);

  // Refs for DOM & deterministic playback/recognition lifecycle
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerInstanceRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const recognitionRef = useRef<any>(null);
  const recognitionSessionIdRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const autoStopTimeoutRef = useRef<any>(null);
  const autoListenTimeoutRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const playIdCounterRef = useRef<number>(0);
  const playbackSessionRef = useRef<PlaybackSession>({
    playId: 0,
    groupId: null,
    videoId: null,
    actionType: null,
    endedHandled: true,
  });

  // Keep latest handlers in refs to prevent stale closures inside YouTube callbacks & listeners
  const handleVideoEndedRef = useRef<(playIdOverride?: number) => void>(() => {});
  const isPlayingVideoRef = useRef<boolean>(false);
  isPlayingVideoRef.current = isPlayingVideo;

  const showSaveSuccess = useCallback((message: string) => {
    setSaveToast({ message, visible: true });
    setTimeout(() => {
      setSaveToast((prev) => (prev ? { ...prev, visible: false } : null));
    }, 3600);
  }, []);

  const renderThemeIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "Waves":
        return <Waves className={className} />;
      case "Trees":
      default:
        return <Trees className={className} />;
    }
  };

  // Persist Preferences
  useEffect(() => {
    preferredVideoQualityRef.current = preferredVideoQuality;
    safeStorage.setItem("an_video_quality", preferredVideoQuality);
  }, [preferredVideoQuality]);

  useEffect(() => {
    safeStorage.setItem("an_force_1080p_only", String(force1080pOnly));
    if (force1080pOnly) {
      setPreferredVideoQuality("hd1080");
    }
  }, [force1080pOnly]);

  useEffect(() => {
    safeStorage.setItem("an_speech_engine", preferredSpeechEngine);
  }, [preferredSpeechEngine]);

  useEffect(() => {
    safeStorage.setItem("an_show_bg_image", String(showBgImage));
  }, [showBgImage]);

  useEffect(() => {
    safeStorage.setItem("an_bg_opacity", String(bgOpacity));
  }, [bgOpacity]);

  // Check initial microphone permissions
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.permissions &&
      (navigator.permissions as any).query
    ) {
      try {
        navigator.permissions
          .query({ name: "microphone" as PermissionName })
          .then((status) => {
            setMicPermission(status.state as any);
            status.onchange = () => setMicPermission(status.state as any);
          })
          .catch(() => setMicPermission("unknown"));
      } catch (_) {
        setMicPermission("unknown");
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [isFullscreen]);

  // Load official YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Theme selection ONLY changes visual appearance — NEVER alters active group videos/triggers
  const handleSelectTheme = (themeId: ThemeId) => {
    if (!isValidThemeId(themeId)) return;
    setSelectedThemeId(themeId);
    try {
      safeStorage.setItem("an_selected_theme", themeId);
    } catch (_) {}
    showSaveSuccess(
      `Tema visual "${THEMES[themeId].name}" aplicado sem interromper o grupo.`
    );
  };

  // Manual Fullscreen Toggle (NEVER automatic on video start)
  const enterFullscreenManual = async () => {
    setIsFullscreen(true);
    try {
      if (videoContainerRef.current && !document.fullscreenElement) {
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen().catch(() => {});
        }
      }
    } catch (_) {}
  };

  const exitFullscreenClean = async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      } else if (
        (document as any).webkitFullscreenElement &&
        (document as any).webkitExitFullscreen
      ) {
        await (document as any).webkitExitFullscreen().catch(() => {});
      }
    } catch (_) {}
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await enterFullscreenManual();
    } else {
      await exitFullscreenClean();
    }
  };

  // Audio / Voice Recognition Cleanup (Guaranteed to disable voice while playing or on ending)
  const cleanupAudioRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      audioStreamRef.current = null;
    }
    setAudioLevel(0);
    setIsRecordingMedia(false);
    setRecordingDuration(0);
  }, []);

  const stopVoiceRecognitionCompletely = useCallback(() => {
    recognitionSessionIdRef.current += 1;

    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
      autoListenTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch (_) {}
    }

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      try {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state === "recording") {
          recorder.stop();
        }
      } catch (_) {}
    }

    cleanupAudioRecording();
    setIsListening(false);
    setIsRecordingMedia(false);
    setIsTranscribing(false);
    setRealtimeSpeech("");
  }, [cleanupAudioRecording]);

  // YouTube Quality & Control Helpers
  const enforceYtQuality = useCallback(
    (qualityOverride?: VideoQualityPreference) => {
      const q =
        qualityOverride ||
        preferredVideoQualityRef.current ||
        preferredVideoQuality;
      const targetQ = q === "auto" ? "hd1080" : q;

      if (ytPlayerInstanceRef.current) {
        try {
          ytPlayerInstanceRef.current.setPlaybackQuality?.(targetQ);
          ytPlayerInstanceRef.current.setPlaybackQualityRange?.(
            targetQ,
            "highres"
          );
          ytPlayerInstanceRef.current.setSuggestedQuality?.(targetQ);
        } catch (_) {}
      }

      if (ytIframeRef.current?.contentWindow) {
        try {
          const win = ytIframeRef.current.contentWindow;
          win.postMessage(
            '{"event":"listening","id":1,"channel":"widget"}',
            "*"
          );
          win.postMessage(
            JSON.stringify({
              event: "command",
              func: "setPlaybackQuality",
              args: [targetQ],
            }),
            "*"
          );
          win.postMessage(
            JSON.stringify({
              event: "command",
              func: "setPlaybackQualityRange",
              args: [targetQ, "highres"],
            }),
            "*"
          );
          win.postMessage(
            JSON.stringify({
              event: "command",
              func: "setSuggestedQuality",
              args: [targetQ],
            }),
            "*"
          );
        } catch (_) {}
      }
    },
    [preferredVideoQuality]
  );

  const triggerQualityAutoPulse = useCallback(
    (qualityOverride?: VideoQualityPreference) => {
      enforceYtQuality(qualityOverride);
      const intervals = [80, 250, 700, 1500, 2800];
      intervals.forEach((delay) => {
        setTimeout(() => {
          if (isPlayingVideoRef.current) {
            enforceYtQuality(qualityOverride);
          }
        }, delay);
      });
    },
    [enforceYtQuality]
  );

  // Stop currently playing YouTube / HTML5 video cleanly without looping
  const stopCurrentPlayerCleanly = useCallback(() => {
    if (ytPlayerInstanceRef.current) {
      try {
        ytPlayerInstanceRef.current.pauseVideo?.();
        ytPlayerInstanceRef.current.stopVideo?.();
      } catch (_) {}
    }
    if (ytIframeRef.current?.contentWindow) {
      try {
        ytIframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*"
        );
      } catch (_) {}
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (_) {}
    }
  }, []);

  // Re-arm voice listening cleanly after Intro or Informative video ends
  const startListeningNative = useCallback(
    (SpeechRecognitionClass: any, silentIfBlocked = false) => {
      stopVoiceRecognitionCompletely();
      const sessionId = recognitionSessionIdRef.current;

      try {
        const rec = new SpeechRecognitionClass();
        rec.continuous = false;
        rec.lang = "pt-BR";
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          if (recognitionSessionIdRef.current !== sessionId) return;
          setIsListening(true);
          setIsRecordingMedia(false);
          setSpeechError("");
          setRealtimeSpeech("");
        };

        rec.onresult = (event: any) => {
          if (recognitionSessionIdRef.current !== sessionId) return;
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (interimTranscript) {
            setRealtimeSpeech(interimTranscript);
          }

          if (finalTranscript) {
            setLastSpeechDetected(finalTranscript);
            setRealtimeSpeech("");
            setIsListening(false);
            handleIncomingCommand(finalTranscript);
          }
        };

        rec.onerror = (event: any) => {
          if (recognitionSessionIdRef.current !== sessionId) return;
          setIsListening(false);
          setRealtimeSpeech("");
          if (event.error === "aborted") return;

          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            if (!silentIfBlocked) {
              setMicPermission("denied");
              setSpeechError(
                "Reconhecimento nativo bloqueado. Use a gravação alternativa ou clique em um gatilho."
              );
              startMediaRecording();
            }
          } else if (event.error === "no-speech") {
            if (!silentIfBlocked) {
              setSpeechError(
                "Nenhuma fala detectada. Toque no microfone e fale claramente."
              );
            }
          } else if (event.error === "network") {
            if (!silentIfBlocked) {
              setSpeechError(
                "Rede indisponível no reconhecimento nativo. Comutando para gravação de áudio..."
              );
              startMediaRecording();
            }
          } else if (!silentIfBlocked) {
            setSpeechError(`Aviso do microfone: ${event.error}`);
          }
        };

        rec.onend = () => {
          if (recognitionSessionIdRef.current !== sessionId) return;
          setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        if (!silentIfBlocked) {
          startMediaRecording();
        }
      }
    },
    [stopVoiceRecognitionCompletely]
  );

  const startListeningAfterVideo = useCallback(() => {
    if (isPlayingVideoRef.current) return;
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
    }

    autoListenTimeoutRef.current = setTimeout(() => {
      if (isPlayingVideoRef.current) return;
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      // Only auto-start native Web Speech on desktop when permission was already granted or preferred engine supports it,
      // avoiding unwanted error modals; on mobile MediaRecorder remains 1-tap ready without stale locks.
      if (
        !isMobile &&
        preferredSpeechEngine !== "gemini" &&
        SpeechRecognitionClass &&
        micPermission === "granted"
      ) {
        startListeningNative(SpeechRecognitionClass, true);
      } else {
        setIsListening(false);
        setIsRecordingMedia(false);
      }
    }, 240);
  }, [isMobile, micPermission, preferredSpeechEngine, startListeningNative]);

  // Deterministic Video End Handler (runs ONCE per playback session via monotonic playId)
  const handleVideoEnded = useCallback(
    (playIdOverride?: number) => {
      const session = playbackSessionRef.current;
      if (session.endedHandled) return;
      if (
        typeof playIdOverride === "number" &&
        playIdOverride !== session.playId
      ) {
        return;
      }

      session.endedHandled = true;
      stopCurrentPlayerCleanly();
      setIsPlayingVideo(false);
      setVideoFinished(true);
      exitFullscreenClean();

      if (session.videoId) {
        const finishedId = session.videoId;
        setViewedVideoIds((prev) =>
          prev.includes(finishedId) ? prev : [...prev, finishedId]
        );
      }

      // Special Ending Rule (Only "Tchau" in Grupo Amazônia)
      if (session.actionType === "ending") {
        stopVoiceRecognitionCompletely();
        setPresentationEnded(true);
        setAiResponseText(
          "Apresentação encerrada! Escolha voltar à seleção de grupos ou retornar à tela inicial."
        );
        return;
      }

      // Informative or Intro ended: return cleanly to group interaction with all 4 triggers active & voice re-armed
      setPresentationEnded(false);
      setAiResponseText(
        "Vídeo concluído. Escolha uma das 4 perguntas disponíveis ou toque no microfone para falar."
      );
      startListeningAfterVideo();
    },
    [
      startListeningAfterVideo,
      stopCurrentPlayerCleanly,
      stopVoiceRecognitionCompletely,
    ]
  );

  handleVideoEndedRef.current = handleVideoEnded;

  // Periodic 1080p enforcement ONLY while playing
  useEffect(() => {
    if (
      !force1080pOnly ||
      appScreen !== "presentation" ||
      !isPlayingVideo ||
      videoFinished
    ) {
      return;
    }
    const interval = setInterval(() => {
      enforceYtQuality("hd1080");
    }, 1500);
    return () => clearInterval(interval);
  }, [
    appScreen,
    enforceYtQuality,
    force1080pOnly,
    isPlayingVideo,
    videoFinished,
    activeVideoId,
  ]);

  // Listen to YouTube postMessage events (ref-backed, deduplicated by playbackSessionRef)
  useEffect(() => {
    const handleYtMessage = (event: MessageEvent) => {
      try {
        let payload: any = event.data;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (_) {
            return;
          }
        }
        if (!payload || typeof payload !== "object") return;

        if (
          payload.event === "onReady" ||
          payload.event === "initialDelivery" ||
          payload.event === "listening" ||
          payload.info === 1 ||
          payload.info === 3 ||
          (payload.info &&
            (payload.info.playerState === 1 || payload.info.playerState === 3))
        ) {
          if (isPlayingVideoRef.current) {
            enforceYtQuality();
          }
        }

        const isEndedEvent =
          (payload.event === "onStateChange" && payload.info === 0) ||
          (payload.info && payload.info.playerState === 0);

        if (isEndedEvent && isPlayingVideoRef.current) {
          handleVideoEndedRef.current(playbackSessionRef.current.playId);
        }
      } catch (_) {}
    };

    window.addEventListener("message", handleYtMessage);
    return () => window.removeEventListener("message", handleYtMessage);
  }, [enforceYtQuality]);

  // Sync mute state cleanly
  useEffect(() => {
    if (ytIframeRef.current?.contentWindow && isPlayingVideo) {
      try {
        const cmd = videoMuted ? "mute" : "unMute";
        ytIframeRef.current.contentWindow.postMessage(
          `{"event":"command","func":"${cmd}","args":""}`,
          "*"
        );
      } catch (_) {}
    }
  }, [videoMuted, ytReloadKey, isPlayingVideo]);

  // Escape key allows concluding active video early cleanly during presentations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        appScreen === "presentation" &&
        isPlayingVideo &&
        !videoFinished
      ) {
        handleVideoEndedRef.current(playbackSessionRef.current.playId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appScreen, isPlayingVideo, videoFinished]);

  // Attach YouTube IFrame API Player Instance safely
  const attachYtPlayer = (boundPlayId: number) => {
    if (typeof window === "undefined") return;
    try {
      const YT = (window as any).YT;
      if (YT && YT.Player && ytIframeRef.current) {
        if (
          ytPlayerInstanceRef.current &&
          typeof ytPlayerInstanceRef.current.destroy === "function"
        ) {
          try {
            ytPlayerInstanceRef.current.destroy();
          } catch (_) {}
        }
        ytPlayerInstanceRef.current = new YT.Player(ytIframeRef.current, {
          events: {
            onReady: (e: any) => {
              const targetQ =
                preferredVideoQualityRef.current === "auto"
                  ? "hd1080"
                  : preferredVideoQualityRef.current;
              e.target.setPlaybackQuality?.(targetQ);
              e.target.setPlaybackQualityRange?.(targetQ, "highres");
              e.target.setSuggestedQuality?.(targetQ);
            },
            onStateChange: (e: any) => {
              if (e.data === 1 || e.data === 3) {
                const targetQ =
                  preferredVideoQualityRef.current === "auto"
                    ? "hd1080"
                    : preferredVideoQualityRef.current;
                e.target.setPlaybackQuality?.(targetQ);
                e.target.setPlaybackQualityRange?.(targetQ, "highres");
                e.target.setSuggestedQuality?.(targetQ);
              }
              if (e.data === 0) {
                handleVideoEndedRef.current(boundPlayId);
              }
            },
          },
        });
      }
    } catch (_) {}
  };

  // Start playing a video belonging strictly to a specific Group
  const playGroupVideo = (
    groupId: GroupId,
    videoId: string,
    announceText?: string
  ) => {
    const group = getGroupById(groupId);
    const targetVideo = getGroupVideoById(groupId, videoId);
    if (!targetVideo) {
      setVideoPlayError("Vídeo não encontrado na configuração deste grupo.");
      return;
    }

    // Prevent duplicate re-trigger of the exact same actively playing video
    if (
      isPlayingVideoRef.current &&
      !playbackSessionRef.current.endedHandled &&
      playbackSessionRef.current.groupId === groupId &&
      playbackSessionRef.current.videoId === targetVideo.id
    ) {
      return;
    }

    // Never play two videos simultaneously & disable voice recognition during video playback
    stopVoiceRecognitionCompletely();
    stopCurrentPlayerCleanly();

    const nextPlayId = ++playIdCounterRef.current;
    playbackSessionRef.current = {
      playId: nextPlayId,
      groupId: group.id,
      videoId: targetVideo.id,
      actionType: targetVideo.actionType,
      endedHandled: false,
    };

    setVideoPlayError("");
    setPresentationEnded(false);
    setVideoFinished(false);
    setIsPlayingVideo(true);
    setActiveVideoId(targetVideo.id);
    setYtReloadKey((prev) => prev + 1);

    if (announceText) {
      setAiResponseText(announceText);
    } else if (targetVideo.actionType === "intro") {
      setAiResponseText(
        `Reproduzindo introdução do ${group.name}. O reconhecimento de voz será reativado ao término.`
      );
    } else if (targetVideo.actionType === "ending") {
      setAiResponseText(
        `Reproduzindo encerramento "${(targetVideo as GroupTrigger).phrase}" do ${group.name}.`
      );
    } else {
      setAiResponseText(
        `Reproduzindo resposta: "${(targetVideo as GroupTrigger).phrase}".`
      );
    }

    if (isYouTubeUrl(targetVideo.videoUrl)) {
      triggerQualityAutoPulse();
    } else {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    }
  };

  // Navigation Handlers
  const handleEnterGroupSelection = () => {
    stopVoiceRecognitionCompletely();
    stopCurrentPlayerCleanly();
    playbackSessionRef.current.endedHandled = true;
    setIsPlayingVideo(false);
    setVideoFinished(false);
    setPresentationEnded(false);
    setActiveVideoId(null);
    setActiveTab("chat");
    setAppScreen("group-selection");
  };

  const handleReturnWelcome = () => {
    stopVoiceRecognitionCompletely();
    stopCurrentPlayerCleanly();
    playbackSessionRef.current.endedHandled = true;
    setSelectedGroupId(null);
    setActiveVideoId(null);
    setIsPlayingVideo(false);
    setVideoFinished(false);
    setPresentationEnded(false);
    setViewedVideoIds([]);
    setLastSpeechDetected("");
    setRealtimeSpeech("");
    setSpeechError("");
    setActiveTab("chat");
    setAppScreen("welcome");
  };

  const handleSelectGroup = (groupId: GroupId) => {
    const group = getGroupById(groupId);
    stopVoiceRecognitionCompletely();
    stopCurrentPlayerCleanly();

    setSelectedGroupId(group.id);
    // Automatically align visual identity to group's reference theme
    setSelectedThemeId(group.temaReferencia);
    try {
      safeStorage.setItem("an_selected_theme", group.temaReferencia);
    } catch (_) {}

    setViewedVideoIds([]);
    setLastSpeechDetected("");
    setRealtimeSpeech("");
    setSpeechError("");
    setHidePanels(false);
    setVideoMuted(false); // Unmute cleanly upon explicit user click
    setActiveTab("chat");
    setAppScreen("presentation");

    // Start strictly this group's introduction video
    playGroupVideo(
      group.id,
      group.intro.id,
      `${group.name} selecionado (${group.members.join(", ")}). Reproduzindo vídeo de introdução.`
    );
  };

  const handleReplayVideo = () => {
    if (!activeGroup) return;
    const videoIdToReplay = activeVideoId || activeGroup.intro.id;
    playGroupVideo(
      activeGroup.id,
      videoIdToReplay,
      `Reproduzindo novamente: ${
        videoIdToReplay === activeGroup.intro.id
          ? activeGroup.intro.title
          : activeGroup.triggers.find((t) => t.id === videoIdToReplay)?.phrase ||
            "Vídeo"
      }.`
    );
  };

  // Strict Group-Isolated Command Matcher (ONLY active group's 4 triggers)
  const handleIncomingCommand = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;
    if (!activeGroup) {
      setAiResponseText("Selecione um grupo antes de enviar uma pergunta.");
      return;
    }
    if (presentationEnded) {
      setAiResponseText(
        "A apresentação foi encerrada. Selecione um grupo para iniciar novamente."
      );
      return;
    }

    setLastSpeechDetected(trimmed);
    setInputText("");
    setIsAnalyzing(true);
    setSpeechError("");

    const groupTriggers = activeGroup.triggers;

    try {
      // 1. Deterministic local match strictly against the active group's 4 triggers
      const localMatch = matchGroupTrigger(trimmed, groupTriggers);
      if (localMatch.trigger && localMatch.score >= 0.62) {
        setIsAnalyzing(false);
        playGroupVideo(
          activeGroup.id,
          localMatch.trigger.id,
          `Pergunta reconhecida: "${localMatch.trigger.phrase}". Reproduzindo vídeo.`
        );
        return;
      }

      // 2. Semantic fallback via backend ONLY with active group's 4 triggers
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: trimmed,
          triggers: groupTriggers.map((t) => ({
            id: t.id,
            phrase: t.phrase,
            description: t.description,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de resposta do servidor de análise.");
      }

      const result = await response.json();
      const matchedTrigger = groupTriggers.find(
        (t) => t.id === result.matchedTriggerId
      );

      if (matchedTrigger) {
        playGroupVideo(
          activeGroup.id,
          matchedTrigger.id,
          result.response ||
            `Pergunta compreendida: "${matchedTrigger.phrase}".`
        );
      } else if (localMatch.trigger) {
        playGroupVideo(
          activeGroup.id,
          localMatch.trigger.id,
          `Pergunta aproximada: "${localMatch.trigger.phrase}".`
        );
      } else {
        const availablePhrases = groupTriggers
          .map((t) => `"${t.phrase}"`)
          .join(", ");
        setAiResponseText(
          `Não reconheci essa pergunta para o ${activeGroup.name}. Diga ou clique em uma das opções: ${availablePhrases}.`
        );
      }
    } catch (_) {
      const localFallback = matchGroupTrigger(trimmed, groupTriggers);
      if (localFallback.trigger) {
        playGroupVideo(
          activeGroup.id,
          localFallback.trigger.id,
          `Pergunta reconhecida localmente: "${localFallback.trigger.phrase}".`
        );
      } else {
        const availablePhrases = groupTriggers
          .map((t) => `"${t.phrase}"`)
          .join(", ");
        setAiResponseText(
          `Não foi possível compreender "${trimmed}". Escolha uma das frases do ${activeGroup.name}: ${availablePhrases}.`
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Microphone Permission & MediaRecorder Fallback
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError(
          "Navegador não possui suporte para acesso ao microfone."
        );
        setMicPermission("unsupported");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setMicPermission("granted");
      setSpeechError("");
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setMicPermission("denied");
        setSpeechError(
          "Microfone bloqueado pelo navegador. Clique em 'Habilitar Microfone'."
        );
        setShowMicModal(true);
      } else {
        setSpeechError(`Erro no microfone: ${err.message || err.name}`);
      }
      return false;
    }
  };

  const stopMediaRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {
        cleanupAudioRecording();
        setIsListening(false);
      }
    } else {
      cleanupAudioRecording();
      setIsListening(false);
    }
  };

  const startMediaRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError("Captura de microfone indisponível neste navegador.");
        return;
      }

      setSpeechError("");
      setRealtimeSpeech("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;
      setMicPermission("granted");
      setIsListening(true);
      setIsRecordingMedia(true);
      setRecordingDuration(0);

      try {
        const AudioCtxClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.5;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = ctx;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const tickLevel = () => {
            if (!audioStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const level = Math.min(
              100,
              Math.round((sum / dataArray.length / 120) * 100)
            );
            setAudioLevel(level);
            animationFrameRef.current = requestAnimationFrame(tickLevel);
          };
          tickLevel();
        }
      } catch (_) {}

      const candidateMimes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
        "audio/ogg;codecs=opus",
      ];
      let selectedMime = "";
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
        for (const m of candidateMimes) {
          if (MediaRecorder.isTypeSupported(m)) {
            selectedMime = m;
            break;
          }
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const recordedMime = recorder.mimeType || selectedMime || "audio/webm";
        const chunks = [...audioChunksRef.current];
        cleanupAudioRecording();
        setIsListening(false);

        if (chunks.length === 0) {
          setSpeechError("Nenhum áudio detectado.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: recordedMime });
        if (audioBlob.size < 400) {
          setSpeechError("Áudio muito curto. Fale uma das frases do grupo.");
          return;
        }

        setIsAnalyzing(true);
        setIsTranscribing(true);
        setSpeechError("");

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result as string;
              const res = await fetch("/api/transcribe-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audioData: base64Data,
                  mimeType: recordedMime,
                }),
              });

              if (!res.ok) {
                throw new Error(`Status ${res.status}`);
              }

              const data = await res.json();
              setIsTranscribing(false);
              setIsAnalyzing(false);

              if (data.transcript && data.transcript.trim()) {
                const text = data.transcript.trim();
                setLastSpeechDetected(text);
                setRealtimeSpeech("");
                handleIncomingCommand(text);
              } else {
                setSpeechError(
                  "Nenhuma fala detectada. Fale mais próximo ao microfone."
                );
              }
            } catch (_) {
              setIsTranscribing(false);
              setIsAnalyzing(false);
              setSpeechError("Não foi possível transcrever o áudio gravado.");
            }
          };
        } catch (_) {
          setIsTranscribing(false);
          setIsAnalyzing(false);
          setSpeechError("Erro ao processar áudio.");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      autoStopTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 7000);
    } catch (err: any) {
      cleanupAudioRecording();
      setIsListening(false);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setMicPermission("denied");
        setSpeechError("Acesso ao microfone negado.");
        setShowMicModal(true);
      } else {
        setSpeechError(`Erro ao abrir microfone: ${err.message || err.name}`);
      }
    }
  };

  // Toggle Voice Listening (strictly disabled while video is actively playing or after ending)
  const toggleListening = async () => {
    if (!activeGroup) return;
    if (isPlayingVideo && !videoFinished) {
      setSpeechError("Aguarde o vídeo terminar para falar.");
      return;
    }
    if (presentationEnded) {
      return;
    }

    if (isListening || isRecordingMedia) {
      if (isRecordingMedia) {
        stopMediaRecording();
      } else {
        stopVoiceRecognitionCompletely();
      }
      return;
    }

    setSpeechError("");
    setRealtimeSpeech("");

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (
      isMobile ||
      preferredSpeechEngine === "gemini" ||
      !SpeechRecognitionClass
    ) {
      await startMediaRecording();
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        setMicPermission("granted");
      }
      startListeningNative(SpeechRecognitionClass, false);
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setMicPermission("denied");
        setSpeechError(
          "Permissão de microfone negada. Libere no cadeado do navegador."
        );
        setShowMicModal(true);
      } else {
        await startMediaRecording();
      }
    }
  };

  // Save Visual Preferences & Export/Import Settings
  const handleSaveSettings = () => {
    try {
      safeStorage.setItem("an_selected_theme", selectedThemeId);
      safeStorage.setItem("an_video_quality", preferredVideoQuality);
      safeStorage.setItem("an_force_1080p_only", String(force1080pOnly));
      safeStorage.setItem("an_speech_engine", preferredSpeechEngine);
      safeStorage.setItem("an_show_bg_image", String(showBgImage));
      safeStorage.setItem("an_bg_opacity", String(bgOpacity));
      safeStorage.setItem("an_last_saved", new Date().toISOString());
      showSaveSuccess("Preferências visuais e de áudio salvas no navegador!");
    } catch (_) {
      showSaveSuccess("Preferências mantidas na sessão atual.");
    }
  };

  const handleExportSettings = () => {
    try {
      const payload = {
        app: "ASSISTENTES DA NATUREZA — ESCOLA NESTOR DE CAMARGO",
        course: "AMBIENTES INTELIGENTES",
        exportedAt: new Date().toISOString(),
        theme: selectedThemeId,
        settings: {
          preferredVideoQuality,
          force1080pOnly,
          preferredSpeechEngine,
          showBgImage,
          bgOpacity,
        },
        groupsRegistry: GROUP_LIST,
      };
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(payload, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute(
        "download",
        `assistentes-da-natureza-config-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(a);
      a.click();
      a.remove();
      showSaveSuccess("Arquivo de configuração (.JSON) exportado.");
    } catch (_) {
      showSaveSuccess("Não foi possível exportar o arquivo.");
    }
  };

  const handleImportSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target?.result || "{}"));
        if (isValidThemeId(data.theme)) {
          setSelectedThemeId(data.theme);
          safeStorage.setItem("an_selected_theme", data.theme);
        }
        if (data.settings) {
          if (data.settings.preferredVideoQuality) {
            setPreferredVideoQuality(data.settings.preferredVideoQuality);
          }
          if (typeof data.settings.force1080pOnly === "boolean") {
            setForce1080pOnly(data.settings.force1080pOnly);
          }
          if (data.settings.preferredSpeechEngine) {
            setPreferredSpeechEngine(data.settings.preferredSpeechEngine);
          }
          if (typeof data.settings.showBgImage === "boolean") {
            setShowBgImage(data.settings.showBgImage);
          }
          if (typeof data.settings.bgOpacity === "number") {
            setBgOpacity(data.settings.bgOpacity);
          }
        }
        showSaveSuccess("Preferências importadas com sucesso.");
      } catch (_) {
        showSaveSuccess("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
  };

  // Active video object strictly resolved from activeGroup
  const activeVideo =
    activeGroup && activeVideoId
      ? getGroupVideoById(activeGroup.id, activeVideoId)
      : null;
  const activeVideoUrl = activeVideo?.videoUrl || "";
  const activeVideoTitle = activeVideo
    ? activeVideo.actionType === "intro"
      ? activeVideo.title
      : (activeVideo as GroupTrigger).phrase
    : activeGroup?.intro.title || "";

  const canUseVoiceNow =
    appScreen === "presentation" &&
    Boolean(activeGroup) &&
    !isPlayingVideo &&
    !presentationEnded;

  return (
    <div
      id="app-root"
      className="min-h-screen font-sans flex flex-col selection:bg-emerald-400 selection:text-black relative overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.colors.bgApp,
        color: currentTheme.colors.textPrimary,
      }}
    >
      {/* Save / Status Toast */}
      {saveToast && saveToast.visible && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none animate-fade-in">
          <div
            className="font-mono font-bold text-xs px-5 py-2.5 rounded-xl shadow-2xl border-2 flex items-center gap-2.5"
            style={{
              backgroundColor: currentTheme.colors.bgElevated,
              color: currentTheme.colors.textPrimary,
              borderColor: currentTheme.colors.borderMain,
            }}
          >
            <CheckCircle2
              className="w-4 h-4 shrink-0"
              style={{ color: currentTheme.colors.primary }}
            />
            <span>{saveToast.message}</span>
          </div>
        </div>
      )}

      {/* Background Immersion Image */}
      {showBgImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700"
          aria-hidden="true"
          style={{ opacity: bgOpacity / 100 }}
        >
          <img
            key={currentTheme.id}
            src={currentTheme.bgImage}
            alt={`${currentTheme.name} — ${currentTheme.environmentTitle}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter contrast-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black pointer-events-none" />
        </div>
      )}

      {/* Subtle Ambient Particles for Active Biome */}
      <SmartAmbientParticles
        particleType={currentTheme.particleType}
        glowColor={currentTheme.glowColor}
      />

      {/* Persistent Clean Header Bar */}
      {!hidePanels && !isFullscreen && (
        <header
          id="app-header"
          className="backdrop-blur-md border-b py-3 px-3 sm:px-6 sticky top-0 z-30 transition-colors duration-300"
          style={{
            backgroundColor: currentTheme.colors.bgSurface,
            borderColor: currentTheme.colors.borderSubtle,
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
            {/* Left Branding: Exclusive Logo + Official Name & School */}
            <button
              type="button"
              onClick={handleReturnWelcome}
              className="flex items-center gap-3 text-left cursor-pointer group shrink-0"
              title="Voltar à Tela Inicial"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border p-1 transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: currentTheme.colors.bgCard,
                  borderColor: currentTheme.colors.borderMain,
                  boxShadow: `0 0 14px ${currentTheme.glowColor}`,
                }}
              >
                <NatureAssistantsLogo size={36} />
              </div>

              <div className="flex flex-col">
                <span
                  className="font-display font-extrabold text-sm sm:text-lg tracking-wide uppercase leading-tight"
                  style={{ color: currentTheme.colors.textPrimary }}
                >
                  ASSISTENTES DA NATUREZA
                </span>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider leading-tight mt-0.5"
                  style={{ color: currentTheme.colors.textMuted }}
                >
                  ESCOLA NESTOR DE CAMARGO · AMBIENTES INTELIGENTES
                </span>
              </div>
            </button>

            {/* Right Navigation & Actions */}
            <nav
              aria-label="Navegação principal"
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  handleReturnWelcome();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor:
                    activeTab === "chat" && appScreen === "welcome"
                      ? currentTheme.colors.primary
                      : currentTheme.colors.bgCard,
                  color:
                    activeTab === "chat" && appScreen === "welcome"
                      ? currentTheme.colors.primaryText
                      : currentTheme.colors.textSecondary,
                  borderColor:
                    activeTab === "chat" && appScreen === "welcome"
                      ? currentTheme.colors.borderMain
                      : currentTheme.colors.borderSubtle,
                }}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>Início</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  handleEnterGroupSelection();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor:
                    activeTab === "chat" && appScreen === "group-selection"
                      ? currentTheme.colors.primary
                      : currentTheme.colors.bgCard,
                  color:
                    activeTab === "chat" && appScreen === "group-selection"
                      ? currentTheme.colors.primaryText
                      : currentTheme.colors.textSecondary,
                  borderColor:
                    activeTab === "chat" && appScreen === "group-selection"
                      ? currentTheme.colors.borderMain
                      : currentTheme.colors.borderSubtle,
                }}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Grupos</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEcosystemModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: currentTheme.colors.bgCard,
                  color: currentTheme.colors.accent,
                  borderColor: currentTheme.colors.borderSubtle,
                }}
                title={`Ver sensores IoT e fauna de ${currentTheme.name}`}
              >
                {renderThemeIcon(currentTheme.iconName, "w-3.5 h-3.5 shrink-0")}
                <span className="hidden sm:inline">{currentTheme.name}</span>
              </button>

              {activeTab === "chat" &&
                appScreen === "presentation" &&
                activeGroup &&
                !presentationEnded && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isPlayingVideo && !videoFinished}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all border-2 cursor-pointer whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed ${
                      isListening || isRecordingMedia
                        ? "bg-red-600 text-white border-white animate-pulse"
                        : ""
                    }`}
                    style={
                      !(isListening || isRecordingMedia)
                        ? {
                            backgroundColor: currentTheme.colors.primary,
                            color: currentTheme.colors.primaryText,
                            borderColor: currentTheme.colors.borderMain,
                          }
                        : undefined
                    }
                    title={
                      isPlayingVideo && !videoFinished
                        ? "Voz desabilitada durante a reprodução do vídeo"
                        : "Falar comando de voz"
                    }
                  >
                    {isListening || isRecordingMedia ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isRecordingMedia
                            ? `Ouvindo (${recordingDuration}s)`
                            : "Ouvindo..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 shrink-0" />
                        <span>Falar</span>
                      </>
                    )}
                  </button>
                )}

              <button
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === "chat" ? "settings" : "chat")
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all border cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor:
                    activeTab === "settings"
                      ? currentTheme.colors.primary
                      : currentTheme.colors.bgCard,
                  color:
                    activeTab === "settings"
                      ? currentTheme.colors.primaryText
                      : currentTheme.colors.textSecondary,
                  borderColor:
                    activeTab === "settings"
                      ? currentTheme.colors.borderMain
                      : currentTheme.colors.borderSubtle,
                }}
              >
                {activeTab === "chat" ? (
                  <>
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span>Configurações</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-3.5 h-3.5 shrink-0" />
                    <span>Voltar</span>
                  </>
                )}
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto ${
          isFullscreen
            ? "p-0 max-w-none"
            : "px-3 sm:px-6 py-4 sm:py-8"
        } flex flex-col justify-start relative z-10`}
      >
        {/* TAB 1: PRESENTATION FLOW (WELCOME -> GROUP SELECTION -> PRESENTATION) */}
        {activeTab === "chat" && (
          <>
            {/* SCREEN 1: TELA INICIAL (Zero autoplay video!) */}
            {appScreen === "welcome" && (
              <section
                aria-label="Tela Inicial"
                className="flex-1 flex items-center justify-center py-4 sm:py-8 animate-fade-in"
              >
                <div
                  className="w-full max-w-4xl rounded-3xl border-2 p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl cyber-grid"
                  style={{
                    backgroundColor: currentTheme.colors.bgSurface,
                    borderColor: currentTheme.colors.borderMain,
                    boxShadow: `0 0 42px ${currentTheme.glowColor}, 0 18px 50px rgba(0,0,0,0.85)`,
                  }}
                >
                  {/* Ecosystem Corners Decoration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 text-left">
                    <div
                      className="p-3.5 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                      style={{
                        backgroundColor: THEMES.pantanal.colors.bgCard,
                        borderColor: THEMES.pantanal.colors.borderSubtle,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: THEMES.pantanal.colors.primary,
                          color: THEMES.pantanal.colors.primaryText,
                        }}
                      >
                        <Waves className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-display font-bold text-white uppercase tracking-wide">
                          Ecossistema Pantanal
                        </div>
                        <div className="text-[11px] font-mono text-cyan-200 truncate">
                          Rios, áreas alagadas & radares aquáticos
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3.5 rounded-2xl border flex items-center gap-3 backdrop-blur-sm"
                      style={{
                        backgroundColor: THEMES.amazonia.colors.bgCard,
                        borderColor: THEMES.amazonia.colors.borderSubtle,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: THEMES.amazonia.colors.primary,
                          color: THEMES.amazonia.colors.primaryText,
                        }}
                      >
                        <Trees className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-display font-bold text-white uppercase tracking-wide">
                          Ecossistema Amazônia
                        </div>
                        <div className="text-[11px] font-mono text-emerald-200 truncate">
                          Floresta tropical, fauna & sensores IoT
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Centered Exclusive Logo */}
                  <div className="flex justify-center mb-5">
                    <div
                      className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 flex items-center justify-center p-3 backdrop-blur-md"
                      style={{
                        backgroundColor: currentTheme.colors.bgCard,
                        borderColor: currentTheme.colors.borderMain,
                        boxShadow: `0 0 35px ${currentTheme.glowColor}`,
                      }}
                    >
                      <NatureAssistantsLogo size={108} />
                    </div>
                  </div>

                  {/* Titles */}
                  <div className="space-y-2.5 max-w-2xl mx-auto">
                    <div
                      className="text-xs sm:text-sm font-mono font-bold uppercase tracking-[0.22em]"
                      style={{ color: currentTheme.colors.accent }}
                    >
                      ESCOLA NESTOR DE CAMARGO
                    </div>
                    <h1
                      className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tight leading-none"
                      style={{ color: currentTheme.colors.textPrimary }}
                    >
                      ASSISTENTES DA NATUREZA
                    </h1>
                    <div
                      className="text-sm sm:text-base font-mono font-semibold uppercase tracking-widest pt-1"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      AMBIENTES INTELIGENTES
                    </div>
                    <p
                      className="text-xs sm:text-sm font-sans max-w-xl mx-auto pt-2 leading-relaxed"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      Plataforma interativa de apresentação dos projetos de
                      monitoramento ambiental, Internet das Coisas (IoT) e
                      inteligência artificial dos grupos da escola.
                    </p>
                  </div>

                  {/* Primary CTA */}
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleEnterGroupSelection}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl font-display font-extrabold text-sm sm:text-base uppercase tracking-wider border-2 cursor-pointer flex items-center justify-center gap-3 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.primaryText,
                        borderColor: currentTheme.colors.borderMain,
                        boxShadow: `0 0 24px ${currentTheme.glowColor}`,
                      }}
                    >
                      <Play className="w-5 h-5 fill-current shrink-0" />
                      <span>INICIAR APRESENTAÇÃO</span>
                      <ArrowRight className="w-5 h-5 shrink-0" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SCREEN 2: SELEÇÃO DOS DOIS GRUPOS */}
            {appScreen === "group-selection" && (
              <section
                aria-label="Seleção de Grupos"
                className="flex-1 flex flex-col justify-center py-4 sm:py-6 animate-fade-in max-w-5xl mx-auto w-full gap-6"
              >
                <div
                  className="rounded-3xl border-2 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{
                    backgroundColor: currentTheme.colors.bgSurface,
                    borderColor: currentTheme.colors.borderSubtle,
                  }}
                >
                  <div className="space-y-1">
                    <div
                      className="text-[11px] font-mono font-bold uppercase tracking-widest"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      ESCOLA NESTOR DE CAMARGO · AMBIENTES INTELIGENTES
                    </div>
                    <h2
                      className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight"
                      style={{ color: currentTheme.colors.textPrimary }}
                    >
                      Selecione o Grupo para Apresentar
                    </h2>
                    <p
                      className="text-xs sm:text-sm font-sans"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      Cada grupo carrega exclusivamente sua identidade visual,
                      vídeo de introdução e 4 perguntas cadastradas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReturnWelcome}
                    className="self-start sm:self-center px-4 py-2.5 rounded-xl border font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all shrink-0"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      color: currentTheme.colors.textPrimary,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tela Inicial</span>
                  </button>
                </div>

                {/* Strictly 2 Official Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {GROUP_LIST.map((group) => {
                    const groupTheme = THEMES[group.temaReferencia];
                    const hasEnding = group.triggers.some(
                      (t) => t.actionType === "ending"
                    );
                    return (
                      <div
                        key={group.id}
                        className="rounded-3xl border-2 overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-2xl"
                        style={{
                          backgroundColor: groupTheme.colors.bgSurface,
                          borderColor: groupTheme.colors.borderMain,
                          boxShadow: `0 0 28px ${groupTheme.glowColor}`,
                        }}
                      >
                        <div>
                          {/* Group Visual Banner */}
                          <div
                            className="relative h-44 overflow-hidden border-b"
                            style={{ borderColor: groupTheme.colors.borderSubtle }}
                          >
                            <img
                              src={groupTheme.bgImage}
                              alt={group.name}
                              className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                            <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between">
                              <span
                                className="px-3 py-1 rounded-lg font-mono text-[10px] font-extrabold uppercase border"
                                style={{
                                  backgroundColor: groupTheme.colors.primary,
                                  color: groupTheme.colors.primaryText,
                                  borderColor: groupTheme.colors.borderMain,
                                }}
                              >
                                Tema: {groupTheme.name}
                              </span>
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center border backdrop-blur-sm"
                                style={{
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  borderColor: groupTheme.colors.borderMain,
                                  color: groupTheme.colors.primary,
                                }}
                              >
                                {renderThemeIcon(
                                  groupTheme.iconName,
                                  "w-5 h-5"
                                )}
                              </div>
                            </div>
                            <div className="absolute bottom-3 left-4 right-4">
                              <h3 className="font-display font-extrabold text-2xl text-white uppercase tracking-wide">
                                {group.name}
                              </h3>
                              <p className="text-xs font-mono text-zinc-200 mt-0.5">
                                {groupTheme.environmentTitle}
                              </p>
                            </div>
                          </div>

                          {/* Group Details */}
                          <div className="p-5 sm:p-6 space-y-4">
                            <div>
                              <div
                                className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                                style={{ color: groupTheme.colors.textMuted }}
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Integrantes do Grupo</span>
                              </div>
                              <p
                                className="text-sm sm:text-base font-display font-bold"
                                style={{ color: groupTheme.colors.textPrimary }}
                              >
                                {group.members.join(", ")}
                              </p>
                            </div>

                            <p
                              className="text-xs font-sans leading-relaxed"
                              style={{ color: groupTheme.colors.textSecondary }}
                            >
                              {group.ecosystemSummary}
                            </p>

                            {/* 4 Registered Triggers Preview */}
                            <div
                              className="p-3.5 rounded-2xl border space-y-2"
                              style={{
                                backgroundColor: groupTheme.colors.bgCard,
                                borderColor: groupTheme.colors.borderSubtle,
                              }}
                            >
                              <div
                                className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-between"
                                style={{ color: groupTheme.colors.textMuted }}
                              >
                                <span>4 Gatilhos de Interação</span>
                                <span>
                                  {hasEnding
                                    ? "3 Informativos + Encerramento"
                                    : "4 Informativos"}
                                </span>
                              </div>
                              <ul className="space-y-1 text-xs font-mono">
                                {group.triggers.map((tr, idx) => (
                                  <li
                                    key={tr.id}
                                    className="flex items-center justify-between gap-2"
                                    style={{
                                      color: groupTheme.colors.textPrimary,
                                    }}
                                  >
                                    <span className="truncate">
                                      {idx + 1}. "{tr.phrase}"
                                    </span>
                                    {tr.actionType === "ending" && (
                                      <span
                                        className="text-[9px] font-bold uppercase shrink-0"
                                        style={{
                                          color: groupTheme.colors.accent,
                                        }}
                                      >
                                        Encerrar
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6 pt-0">
                          <button
                            type="button"
                            onClick={() => handleSelectGroup(group.id)}
                            className="w-full py-3.5 px-5 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider border-2 cursor-pointer flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                            style={{
                              backgroundColor: groupTheme.colors.primary,
                              color: groupTheme.colors.primaryText,
                              borderColor: groupTheme.colors.borderMain,
                            }}
                          >
                            <Play className="w-4 h-4 fill-current shrink-0" />
                            <span>Iniciar {group.name}</span>
                            <ArrowRight className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SCREEN 3: APRESENTAÇÃO & INTERAÇÃO DO GRUPO ATIVO */}
            {appScreen === "presentation" && activeGroup && (
              <div className="space-y-6 animate-fade-in max-w-7xl mx-auto w-full">
                {/* Active Group Identification Banner */}
                {!hidePanels && !isFullscreen && (
                  <div
                    className="max-w-5xl mx-auto w-full rounded-2xl border-2 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{
                      backgroundColor: currentTheme.colors.bgSurface,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                        style={{
                          backgroundColor: currentTheme.colors.primary,
                          color: currentTheme.colors.primaryText,
                          borderColor: currentTheme.colors.borderMain,
                        }}
                      >
                        {renderThemeIcon(currentTheme.iconName, "w-5 h-5")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2
                            className="font-display font-extrabold text-base sm:text-lg uppercase tracking-wide"
                            style={{ color: currentTheme.colors.textPrimary }}
                          >
                            {activeGroup.name}
                          </h2>
                          <span
                            className="text-[10px] font-mono uppercase font-bold"
                            style={{ color: currentTheme.colors.accent }}
                          >
                            · Visual: {currentTheme.name}
                          </span>
                        </div>
                        <p
                          className="text-xs font-mono truncate"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          Integrantes: {activeGroup.members.join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          playGroupVideo(
                            activeGroup.id,
                            activeGroup.intro.id,
                            `Reproduzindo introdução do ${activeGroup.name}.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                        style={{
                          backgroundColor: currentTheme.colors.bgCard,
                          color: currentTheme.colors.textPrimary,
                          borderColor: currentTheme.colors.borderSubtle,
                        }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Intro</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleEnterGroupSelection}
                        className="px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                        style={{
                          backgroundColor: currentTheme.colors.bgCard,
                          color: currentTheme.colors.textPrimary,
                          borderColor: currentTheme.colors.borderMain,
                        }}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Trocar Grupo</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
                  {/* Video Container — Strict AJUSTADO (FIT) mode, NEVER auto-fullscreen */}
                  <div className="w-full relative">
                    <div
                      ref={videoContainerRef}
                      className={
                        isFullscreen
                          ? "fixed inset-0 z-50 w-screen h-[100dvh] bg-black m-0 p-0 overflow-hidden flex flex-col justify-center items-center"
                          : "border-2 rounded-2xl sm:rounded-3xl relative w-full aspect-video max-h-[75vh] sm:max-h-[580px] min-h-[240px] sm:min-h-[360px] flex flex-col justify-center items-center overflow-hidden transition-all duration-300"
                      }
                      style={
                        !isFullscreen
                          ? {
                              backgroundColor: currentTheme.colors.bgSurface,
                              borderColor: currentTheme.colors.borderMain,
                              boxShadow: `0 0 28px ${currentTheme.glowColor}, 0 14px 40px rgba(0,0,0,0.85)`,
                            }
                          : undefined
                      }
                    >
                      <div
                        className={`absolute inset-0 ${
                          isFullscreen
                            ? "rounded-none"
                            : "rounded-[14px] sm:rounded-[22px]"
                        } overflow-hidden flex flex-col justify-center items-center w-full h-full max-w-full max-h-full`}
                      >
                        {/* Top-Right Video Toolbar (No Auto Fullscreen) */}
                        {!isFullscreen && (
                          <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-zinc-800 shadow-xl max-w-[calc(100%-1.25rem)] overflow-x-auto no-scrollbar">
                            <button
                              type="button"
                              onClick={toggleFullscreen}
                              className="bg-black/95 hover:bg-white hover:text-black border border-zinc-800 text-white text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                              title="Tela Cheia Manual"
                            >
                              <Maximize className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Tela Cheia</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const cycle: VideoQualityPreference[] = [
                                  "hd1080",
                                  "hd720",
                                  "large",
                                  "medium",
                                  "auto",
                                ];
                                const nextIdx =
                                  (cycle.indexOf(preferredVideoQuality) + 1) %
                                  cycle.length;
                                const nextQ = cycle[nextIdx];
                                setPreferredVideoQuality(nextQ);
                                triggerQualityAutoPulse(nextQ);
                              }}
                              className="bg-black/95 hover:bg-white hover:text-black border border-zinc-800 text-white text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                              title="Alternar resolução preferida"
                            >
                              <Sliders className="w-3 h-3 shrink-0" />
                              <span>
                                {preferredVideoQuality === "hd1080"
                                  ? "1080p FHD"
                                  : preferredVideoQuality === "hd720"
                                  ? "720p HD"
                                  : preferredVideoQuality === "large"
                                  ? "480p"
                                  : preferredVideoQuality === "medium"
                                  ? "360p"
                                  : "Auto"}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setVideoMuted((prev) => !prev)}
                              className="bg-black/95 hover:bg-white hover:text-black border border-zinc-800 text-white text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                              title={videoMuted ? "Ativar Áudio" : "Silenciar Áudio"}
                            >
                              {videoMuted ? (
                                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-white" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setHidePanels((prev) => !prev)}
                              className={`bg-black/95 hover:bg-white hover:text-black border border-zinc-800 text-white text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                                hidePanels ? "bg-white text-black border-white" : ""
                              }`}
                              title={
                                hidePanels
                                  ? "Mostrar Painéis Completos"
                                  : "Ocultar Painéis (Focar no Vídeo e Voz)"
                              }
                            >
                              {hidePanels ? (
                                <Eye className="w-3 h-3 shrink-0" />
                              ) : (
                                <EyeOff className="w-3 h-3 shrink-0" />
                              )}
                              <span className="hidden lg:inline">
                                {hidePanels ? "Ver Painel" : "Ocultar"}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Active Video Element (Strict FIT / contain, No Loop) */}
                        {activeVideoUrl ? (
                          <div className="absolute inset-0 bg-black flex items-center justify-center w-full h-full max-w-full max-h-full overflow-hidden">
                            {isYouTubeUrl(activeVideoUrl) ? (
                              <div className="w-full h-full max-w-full max-h-full relative overflow-hidden bg-black flex items-center justify-center">
                                <iframe
                                  ref={ytIframeRef}
                                  id="an-yt-iframe"
                                  key={`${activeGroup.id}-${activeVideoId}-${ytReloadKey}`}
                                  src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(
                                    activeVideoUrl
                                  )}?autoplay=1&mute=${
                                    videoMuted ? 1 : 0
                                  }&loop=0&enablejsapi=1&origin=${encodeURIComponent(
                                    typeof window !== "undefined"
                                      ? window.location.origin
                                      : ""
                                  )}&playsinline=1&rel=0&modestbranding=1&controls=1&vq=hd1080&hd=1&suggestedQuality=hd1080`}
                                  title={activeVideoTitle}
                                  onLoad={() => {
                                    triggerQualityAutoPulse();
                                    attachYtPlayer(
                                      playbackSessionRef.current.playId
                                    );
                                  }}
                                  className={`w-full h-full max-w-full max-h-full aspect-video border-0 select-none pointer-events-auto transition-all duration-300 video-fit-contain ${
                                    videoFinished ? "blur-[3px] opacity-40" : ""
                                  }`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  style={{
                                    objectFit: "contain",
                                    width: "100%",
                                    height: "100%",
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    aspectRatio: "16 / 9",
                                  }}
                                />

                                {force1080pOnly &&
                                  isPlayingVideo &&
                                  !isFullscreen && (
                                    <div className="absolute top-2.5 left-2.5 z-30 hidden sm:flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700 select-none">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="text-[10px] font-mono font-bold text-white uppercase">
                                        1080p · Ajustado
                                      </span>
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <video
                                key={`${activeGroup.id}-${activeVideoId}-${ytReloadKey}`}
                                ref={videoRef}
                                src={activeVideoUrl}
                                className={`w-full h-full max-w-full max-h-full object-contain aspect-video transition-all duration-300 video-fit-contain ${
                                  videoFinished ? "blur-[3px] opacity-40" : ""
                                }`}
                                style={{
                                  objectFit: "contain",
                                  width: "100%",
                                  height: "100%",
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  aspectRatio: "16 / 9",
                                }}
                                autoPlay
                                muted={videoMuted}
                                playsInline
                                onEnded={() =>
                                  handleVideoEndedRef.current(
                                    playbackSessionRef.current.playId
                                  )
                                }
                                onError={() =>
                                  setVideoPlayError(
                                    "Não foi possível reproduzir este vídeo."
                                  )
                                }
                              />
                            )}

                            {/* Manual "Concluir Vídeo" button during playback so presenters can advance immediately if desired */}
                            {isPlayingVideo && !videoFinished && (
                              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVideoEndedRef.current(
                                      playbackSessionRef.current.playId
                                    )
                                  }
                                  className="px-3 py-1.5 bg-black/85 hover:bg-black text-white border border-white/30 hover:border-white rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer backdrop-blur-md transition-all flex items-center gap-1.5"
                                  title="Concluir reprodução e voltar às opções do grupo"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Concluir Vídeo</span>
                                </button>
                              </div>
                            )}

                            {/* OVERLAY WHEN VIDEO ENDS */}
                            {videoFinished && (
                              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col justify-center items-center p-3 sm:p-6 z-40 select-none overflow-hidden animate-fade-in">
                                {/* SPECIAL ENDING OVERLAY (Amazônia "Tchau") */}
                                {presentationEnded ? (
                                  <div
                                    className="w-full max-w-lg rounded-3xl border-2 p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-slide-up"
                                    style={{
                                      backgroundColor:
                                        currentTheme.colors.bgSurface,
                                      borderColor:
                                        currentTheme.colors.borderMain,
                                      boxShadow: `0 0 36px ${currentTheme.glowColor}`,
                                    }}
                                  >
                                    <div
                                      className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border"
                                      style={{
                                        backgroundColor:
                                          currentTheme.colors.bgCard,
                                        borderColor:
                                          currentTheme.colors.borderMain,
                                      }}
                                    >
                                      <NatureAssistantsLogo size={46} />
                                    </div>

                                    <div className="space-y-2">
                                      <div
                                        className="text-[11px] font-mono font-bold uppercase tracking-widest"
                                        style={{
                                          color: currentTheme.colors.accent,
                                        }}
                                      >
                                        Apresentação Concluída
                                      </div>
                                      <h3
                                        className="font-display font-extrabold text-xl sm:text-2xl uppercase"
                                        style={{
                                          color:
                                            currentTheme.colors.textPrimary,
                                        }}
                                      >
                                        Obrigado por acompanhar o{" "}
                                        {activeGroup.name}!
                                      </h3>
                                      <p
                                        className="text-xs sm:text-sm font-sans"
                                        style={{
                                          color:
                                            currentTheme.colors.textSecondary,
                                        }}
                                      >
                                        Integrantes:{" "}
                                        {activeGroup.members.join(", ")} ·
                                        Escola Nestor de Camargo
                                      </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                      <button
                                        type="button"
                                        onClick={handleEnterGroupSelection}
                                        className="flex-1 py-3 px-4 rounded-xl font-mono text-xs font-extrabold uppercase border-2 cursor-pointer flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                                        style={{
                                          backgroundColor:
                                            currentTheme.colors.primary,
                                          color:
                                            currentTheme.colors.primaryText,
                                          borderColor:
                                            currentTheme.colors.borderMain,
                                        }}
                                      >
                                        <Users className="w-4 h-4" />
                                        <span>Selecionar Grupo</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={handleReturnWelcome}
                                        className="flex-1 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase border cursor-pointer flex items-center justify-center gap-2 transition-all"
                                        style={{
                                          backgroundColor:
                                            currentTheme.colors.bgCard,
                                          color:
                                            currentTheme.colors.textPrimary,
                                          borderColor:
                                            currentTheme.colors.borderSubtle,
                                        }}
                                      >
                                        <Home className="w-4 h-4" />
                                        <span>Tela Inicial</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* NORMAL INFORMATIVE / INTRO ENDED OVERLAY: ALL 4 TRIGGERS ALWAYS AVAILABLE */
                                  <div
                                    className="w-full max-w-2xl rounded-3xl border-2 p-4 sm:p-6 shadow-2xl animate-slide-up flex flex-col max-h-[90%] overflow-y-auto"
                                    style={{
                                      backgroundColor:
                                        currentTheme.colors.bgSurface,
                                      borderColor:
                                        currentTheme.colors.borderMain,
                                    }}
                                  >
                                    <div className="flex flex-col items-center text-center gap-1.5 mb-4">
                                      <div
                                        className="text-[10px] font-mono font-bold uppercase tracking-widest"
                                        style={{
                                          color: currentTheme.colors.primary,
                                        }}
                                      >
                                        {activeGroup.name} · Vídeo Concluído
                                      </div>
                                      <h3
                                        className="font-display font-extrabold text-base sm:text-lg uppercase"
                                        style={{
                                          color:
                                            currentTheme.colors.textPrimary,
                                        }}
                                      >
                                        Escolha a próxima pergunta ou fale no
                                        microfone
                                      </h3>
                                    </div>

                                    {/* Voice Action inside Overlay */}
                                    <div className="mb-4 flex justify-center">
                                      <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`px-5 py-2.5 rounded-xl border-2 font-mono text-xs font-extrabold uppercase flex items-center gap-2 cursor-pointer transition-all ${
                                          isListening || isRecordingMedia
                                            ? "bg-red-600 text-white border-white animate-pulse"
                                            : ""
                                        }`}
                                        style={
                                          !(isListening || isRecordingMedia)
                                            ? {
                                                backgroundColor:
                                                  currentTheme.colors.primary,
                                                color:
                                                  currentTheme.colors
                                                    .primaryText,
                                                borderColor:
                                                  currentTheme.colors
                                                    .borderMain,
                                              }
                                            : undefined
                                        }
                                      >
                                        {isListening || isRecordingMedia ? (
                                          <>
                                            <MicOff className="w-4 h-4" />
                                            <span>
                                              {isRecordingMedia
                                                ? `Gravando (${recordingDuration}s)...`
                                                : "Ouvindo... Fale agora"}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <Mic className="w-4 h-4" />
                                            <span>Falar no Microfone</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {/* ALL 4 Triggers of Active Group (NEVER hidden after use) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                                      {activeGroup.triggers.map((tr, idx) => {
                                        const wasViewed =
                                          viewedVideoIds.includes(tr.id);
                                        return (
                                          <button
                                            key={tr.id}
                                            type="button"
                                            onClick={() =>
                                              playGroupVideo(
                                                activeGroup.id,
                                                tr.id
                                              )
                                            }
                                            className="p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 hover:brightness-110 active:scale-[0.99]"
                                            style={{
                                              backgroundColor:
                                                currentTheme.colors.bgCard,
                                              borderColor:
                                                tr.actionType === "ending"
                                                  ? currentTheme.colors.accent
                                                  : currentTheme.colors
                                                      .borderSubtle,
                                            }}
                                          >
                                            <div className="min-w-0 flex-1">
                                              <div
                                                className="text-[9px] font-mono font-bold uppercase flex items-center gap-1.5"
                                                style={{
                                                  color:
                                                    currentTheme.colors
                                                      .textMuted,
                                                }}
                                              >
                                                <span>Pergunta {idx + 1}</span>
                                                {wasViewed && (
                                                  <span>· Assistido</span>
                                                )}
                                                {tr.actionType === "ending" && (
                                                  <span>· Encerramento</span>
                                                )}
                                              </div>
                                              <div
                                                className="font-display font-bold text-xs sm:text-sm truncate mt-0.5"
                                                style={{
                                                  color:
                                                    currentTheme.colors
                                                      .textPrimary,
                                                }}
                                              >
                                                "{tr.phrase}"
                                              </div>
                                            </div>
                                            <Play
                                              className="w-4 h-4 shrink-0"
                                              style={{
                                                color:
                                                  currentTheme.colors.primary,
                                              }}
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div
                                      className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t"
                                      style={{
                                        borderColor:
                                          currentTheme.colors.borderSubtle,
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={handleReplayVideo}
                                        className="px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1.5"
                                        style={{
                                          backgroundColor:
                                            currentTheme.colors.bgCard,
                                          color:
                                            currentTheme.colors.textSecondary,
                                          borderColor:
                                            currentTheme.colors.borderSubtle,
                                        }}
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Rever Vídeo</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          playGroupVideo(
                                            activeGroup.id,
                                            activeGroup.intro.id
                                          )
                                        }
                                        className="px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1.5"
                                        style={{
                                          backgroundColor:
                                            currentTheme.colors.bgCard,
                                          color:
                                            currentTheme.colors.textSecondary,
                                          borderColor:
                                            currentTheme.colors.borderSubtle,
                                        }}
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                        <span>Introdução</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-sm font-mono text-zinc-300">
                              Selecione um vídeo do {activeGroup.name}.
                            </p>
                          </div>
                        )}

                        {videoPlayError && (
                          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-5 text-center z-50">
                            <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                            <p className="text-xs font-mono text-white">
                              {videoPlayError}
                            </p>
                            <button
                              type="button"
                              onClick={() => setVideoPlayError("")}
                              className="mt-3 px-4 py-1.5 bg-white text-black text-xs font-mono font-bold rounded-lg cursor-pointer"
                            >
                              Fechar
                            </button>
                          </div>
                        )}

                        {isFullscreen && !videoFinished && (
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="absolute top-3 right-3 z-50 px-3 py-1.5 bg-black/80 text-white border border-white/25 rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                          >
                            <Minimize className="w-3.5 h-3.5" />
                            <span>Sair da Tela Cheia</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GROUP INTERACTION TRIGGERS PANEL (All 4 Triggers Always Visible Unless Presentation Ended) */}
                  {!hidePanels && !isFullscreen && !presentationEnded && (
                    <div
                      className="backdrop-blur-md border-2 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 text-left transition-all duration-300"
                      style={{
                        backgroundColor: currentTheme.colors.bgSurface,
                        borderColor: currentTheme.colors.borderSubtle,
                        boxShadow: `0 8px 30px rgba(0,0,0,0.45), 0 0 20px ${currentTheme.colors.glow}`,
                      }}
                    >
                      <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3"
                        style={{ borderColor: currentTheme.colors.borderSubtle }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              videoFinished ? "animate-ping" : ""
                            }`}
                            style={{
                              backgroundColor: currentTheme.colors.primary,
                            }}
                          />
                          <h3
                            className="font-display font-extrabold text-sm uppercase tracking-wider"
                            style={{ color: currentTheme.colors.textPrimary }}
                          >
                            Gatilhos do {activeGroup.name} (4 Perguntas)
                          </h3>
                        </div>
                        <span
                          className="text-[11px] font-mono"
                          style={{ color: currentTheme.colors.textMuted }}
                        >
                          {isPlayingVideo
                            ? "Reproduzindo vídeo — voz pausada"
                            : "Fale no microfone ou clique em uma opção"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {activeGroup.triggers.map((tr, idx) => {
                          const isCurrentVideo =
                            activeVideoId === tr.id && isPlayingVideo;
                          const wasViewed = viewedVideoIds.includes(tr.id);
                          return (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={() =>
                                playGroupVideo(activeGroup.id, tr.id)
                              }
                              className="group relative flex items-center justify-between gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left hover:brightness-110 active:scale-[0.99]"
                              style={{
                                backgroundColor: isCurrentVideo
                                  ? currentTheme.colors.bgElevated
                                  : currentTheme.colors.bgCard,
                                borderColor: isCurrentVideo
                                  ? currentTheme.colors.borderMain
                                  : tr.actionType === "ending"
                                  ? currentTheme.colors.accent
                                  : currentTheme.colors.borderSubtle,
                                boxShadow: isCurrentVideo
                                  ? `0 0 16px ${currentTheme.colors.glow}`
                                  : "none",
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                                  style={{
                                    backgroundColor: isCurrentVideo
                                      ? currentTheme.colors.primary
                                      : currentTheme.colors.bgApp,
                                    color: isCurrentVideo
                                      ? currentTheme.colors.primaryText
                                      : currentTheme.colors.primary,
                                    borderColor:
                                      currentTheme.colors.borderSubtle,
                                  }}
                                >
                                  <Mic className="w-4 h-4 shrink-0" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                                    style={{
                                      color: currentTheme.colors.textMuted,
                                    }}
                                  >
                                    <span>Gatilho {idx + 1}</span>
                                    {wasViewed && <span>· Assistido</span>}
                                    {tr.actionType === "ending" && (
                                      <span>· Encerramento</span>
                                    )}
                                  </div>
                                  <div
                                    className="font-display font-bold text-sm truncate mt-0.5"
                                    style={{
                                      color: currentTheme.colors.textPrimary,
                                    }}
                                  >
                                    "{tr.phrase}"
                                  </div>
                                  <div
                                    className="text-[11px] font-sans truncate mt-0.5"
                                    style={{
                                      color: currentTheme.colors.textSecondary,
                                    }}
                                  >
                                    {tr.description}
                                  </div>
                                </div>
                              </div>

                              <span
                                className="shrink-0 text-[10px] font-mono font-extrabold uppercase px-3 py-1.5 rounded-lg border flex items-center gap-1 whitespace-nowrap"
                                style={{
                                  backgroundColor:
                                    currentTheme.colors.bgApp,
                                  color: currentTheme.colors.primary,
                                  borderColor:
                                    currentTheme.colors.borderSubtle,
                                }}
                              >
                                <Play className="w-3 h-3 fill-current shrink-0" />
                                <span>
                                  {isCurrentVideo ? "No Ar" : "Assistir"}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* VOICE & TEXT COMPANION PANEL */}
                  {!hidePanels && !isFullscreen && !presentationEnded && (
                    <div
                      className="backdrop-blur-md border-2 rounded-3xl p-5 sm:p-6 text-left flex flex-col md:flex-row gap-6 items-stretch transition-all duration-300"
                      style={{
                        backgroundColor: currentTheme.colors.bgSurface,
                        borderColor: currentTheme.colors.borderSubtle,
                        boxShadow: `0 0 24px ${currentTheme.colors.glow}`,
                      }}
                    >
                      {/* Mic Button Card */}
                      <div
                        className="border-2 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 min-w-[230px] shrink-0"
                        style={{
                          backgroundColor: currentTheme.colors.bgCard,
                          borderColor: currentTheme.colors.borderSubtle,
                        }}
                      >
                        <button
                          type="button"
                          onClick={toggleListening}
                          disabled={!canUseVoiceNow}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                            isListening || isRecordingMedia
                              ? "bg-red-600 text-white border-white animate-pulse shadow-lg"
                              : "shadow-lg hover:scale-105 active:scale-95"
                          }`}
                          style={
                            !(isListening || isRecordingMedia)
                              ? {
                                  backgroundColor: currentTheme.colors.primary,
                                  color: currentTheme.colors.primaryText,
                                  borderColor: currentTheme.colors.borderMain,
                                }
                              : undefined
                          }
                          title={
                            isPlayingVideo
                              ? "Voz pausada durante a exibição do vídeo"
                              : isListening || isRecordingMedia
                              ? "Parar captura de voz"
                              : "Falar pergunta no microfone"
                          }
                        >
                          {isListening || isRecordingMedia ? (
                            <MicOff className="w-6 h-6" />
                          ) : (
                            <Mic className="w-6 h-6" />
                          )}
                        </button>

                        <div className="space-y-1 w-full">
                          {isPlayingVideo ? (
                            <span
                              className="text-xs font-mono font-bold block"
                              style={{ color: currentTheme.colors.textMuted }}
                            >
                              Voz pausada durante o vídeo
                            </span>
                          ) : isTranscribing ? (
                            <span className="text-xs font-mono font-bold text-white animate-pulse block">
                              Transcrevendo fala...
                            </span>
                          ) : isListening || isRecordingMedia ? (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-mono font-bold text-red-400 uppercase block animate-pulse">
                                {isRecordingMedia
                                  ? `Gravando (${recordingDuration}s)`
                                  : "Escuta ativa..."}
                              </span>
                              <div className="flex items-end justify-center gap-1.5 h-5">
                                <div
                                  className="w-1.5 bg-red-400 rounded-full transition-all duration-75"
                                  style={{
                                    height: `${Math.max(
                                      5,
                                      Math.round(audioLevel * 0.2)
                                    )}px`,
                                  }}
                                />
                                <div
                                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                                  style={{
                                    height: `${Math.max(
                                      8,
                                      Math.round(audioLevel * 0.35)
                                    )}px`,
                                  }}
                                />
                                <div
                                  className="w-1.5 bg-red-400 rounded-full transition-all duration-75"
                                  style={{
                                    height: `${Math.max(
                                      5,
                                      Math.round(audioLevel * 0.2)
                                    )}px`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : isAnalyzing ? (
                            <span className="text-xs font-mono text-zinc-200 animate-pulse block">
                              Analisando pergunta...
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span
                                className="text-xs font-bold block"
                                style={{
                                  color: currentTheme.colors.textPrimary,
                                }}
                              >
                                Toque para falar
                              </span>
                              <span
                                className="text-[10px] font-mono block"
                                style={{ color: currentTheme.colors.textMuted }}
                              >
                                {micPermission === "granted"
                                  ? "Microfone autorizado"
                                  : micPermission === "denied"
                                  ? "Microfone bloqueado"
                                  : "Pronto para captura"}
                              </span>
                            </div>
                          )}
                        </div>

                        {speechError && (
                          <div className="w-full p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-[10px] text-red-200 font-mono space-y-1.5">
                            <p className="leading-tight">{speechError}</p>
                            <button
                              type="button"
                              onClick={requestMicrophonePermission}
                              className="w-full py-1 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[9px] uppercase cursor-pointer"
                            >
                              Habilitar Microfone
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Transcript, Assistant Status & Manual Input */}
                      <div className="flex-1 flex flex-col justify-between gap-4">
                        <div
                          className="border-2 rounded-2xl p-4 flex-1 flex flex-col justify-center gap-2"
                          style={{
                            backgroundColor: currentTheme.colors.bgCard,
                            borderColor: currentTheme.colors.borderSubtle,
                          }}
                        >
                          <div
                            className="text-[10px] font-mono uppercase font-bold tracking-wider"
                            style={{ color: currentTheme.colors.textMuted }}
                          >
                            {isListening
                              ? "Transcrição em tempo real"
                              : "Status da Apresentação"}
                          </div>
                          <p
                            className="font-display font-bold text-sm"
                            style={{ color: currentTheme.colors.textPrimary }}
                          >
                            {isListening
                              ? realtimeSpeech
                                ? `"${realtimeSpeech}"`
                                : "Ouvindo atentamente... fale uma das 4 perguntas do grupo."
                              : lastSpeechDetected
                              ? `Última fala: "${lastSpeechDetected}" — ${aiResponseText}`
                              : aiResponseText}
                          </p>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleIncomingCommand(inputText);
                          }}
                          className="relative"
                        >
                          <input
                            type="text"
                            className="w-full border-2 rounded-xl pl-4 pr-12 py-3 text-xs font-mono focus:outline-none transition-all"
                            style={{
                              backgroundColor: currentTheme.colors.bgInput,
                              borderColor: currentTheme.colors.borderSubtle,
                              color: currentTheme.colors.textPrimary,
                            }}
                            placeholder={`Digite uma das 4 perguntas do ${activeGroup.name}...`}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isAnalyzing}
                          />
                          <button
                            type="submit"
                            disabled={isAnalyzing || !inputText.trim()}
                            className="absolute right-2 top-2 w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                            style={{
                              backgroundColor: currentTheme.colors.primary,
                              color: currentTheme.colors.primaryText,
                              borderColor: currentTheme.colors.borderMain,
                            }}
                            aria-label="Enviar pergunta"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: CONFIGURAÇÕES (2 OFFICIAL THEMES, VISUALS, QUALITY, MIC & REGISTRY OVERVIEW) */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in">
            <div
              className="border-2 rounded-3xl p-5 sm:p-7 text-left flex flex-col gap-6 shadow-2xl"
              style={{
                backgroundColor: currentTheme.colors.bgSurface,
                borderColor: currentTheme.colors.borderSubtle,
                boxShadow: `0 0 28px ${currentTheme.colors.glow}`,
                color: currentTheme.colors.textPrimary,
              }}
            >
              {/* Settings Header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4"
                style={{ borderColor: currentTheme.colors.borderSubtle }}
              >
                <div>
                  <div
                    className="text-[10px] font-mono font-bold uppercase tracking-widest"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    ASSISTENTES DA NATUREZA · ESCOLA NESTOR DE CAMARGO
                  </div>
                  <h2
                    className="text-lg sm:text-xl font-display font-extrabold uppercase tracking-wide mt-1"
                    style={{ color: currentTheme.colors.textPrimary }}
                  >
                    Configurações de Aparência, Áudio e Vídeo
                  </h2>
                  <p
                    className="text-xs font-sans mt-0.5"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Personalize o tema visual e preferências técnicas sem
                    alterar os vídeos ou gatilhos de cada grupo.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-mono uppercase"
                    style={{
                      backgroundColor: currentTheme.colors.primary,
                      color: currentTheme.colors.primaryText,
                      borderColor: currentTheme.colors.borderMain,
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Dados</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-mono uppercase"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      color: currentTheme.colors.textPrimary,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <span>Concluído</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SEÇÃO OFICIAL: APARÊNCIA DO APLICATIVO (EXATAMENTE 2 TEMAS: PANTANAL E AMAZÔNIA) */}
              <section
                aria-label="Aparência do Aplicativo"
                className="rounded-2xl p-4 sm:p-5 border-2"
                style={{
                  backgroundColor: currentTheme.colors.bgCard,
                  borderColor: currentTheme.colors.borderSubtle,
                }}
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-4"
                  style={{ borderColor: currentTheme.colors.borderSubtle }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.primaryText,
                        borderColor: currentTheme.colors.borderMain,
                      }}
                    >
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-display font-extrabold uppercase tracking-wider"
                        style={{ color: currentTheme.colors.textPrimary }}
                      >
                        APARÊNCIA DO APLICATIVO
                      </h3>
                      <p
                        className="text-xs font-sans"
                        style={{ color: currentTheme.colors.textMuted }}
                      >
                        Escolha entre os dois temas visuais oficiais (Pantanal ou
                        Amazônia). Muda apenas a identidade visual, sem alterar
                        os vídeos do grupo ativo.
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold uppercase shrink-0"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    2 Temas Oficiais
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {THEME_LIST.map((th) => {
                    const isCurrent = selectedThemeId === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleSelectTheme(th.id)}
                        className={`group text-left rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden ${
                          isCurrent ? "ring-2 shadow-xl" : "hover:brightness-110"
                        }`}
                        style={{
                          backgroundColor: isCurrent
                            ? th.colors.bgElevated
                            : th.colors.bgSurface,
                          borderColor: isCurrent
                            ? th.colors.borderMain
                            : th.colors.borderSubtle,
                          boxShadow: isCurrent
                            ? `0 0 22px ${th.glowColor}`
                            : "none",
                          // @ts-ignore
                          "--tw-ring-color": th.colors.primary,
                        }}
                      >
                        <div
                          className="relative h-28 w-full overflow-hidden border-b"
                          style={{ borderColor: th.colors.borderSubtle }}
                        >
                          <img
                            src={th.bgImage}
                            alt={th.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                          <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center border"
                              style={{
                                backgroundColor: th.colors.primary,
                                color: th.colors.primaryText,
                                borderColor: th.colors.borderMain,
                              }}
                            >
                              {renderThemeIcon(th.iconName, "w-4 h-4")}
                            </div>
                            <span
                              className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-lg border"
                              style={{
                                backgroundColor: isCurrent
                                  ? th.colors.primary
                                  : "rgba(0,0,0,0.7)",
                                color: isCurrent
                                  ? th.colors.primaryText
                                  : "#ffffff",
                                borderColor: th.colors.borderMain,
                              }}
                            >
                              {isCurrent ? "Ativo" : "Aplicar Tema"}
                            </span>
                          </div>
                          <div className="absolute bottom-2 left-3 right-3">
                            <div className="font-display font-extrabold text-base text-white">
                              {th.name}
                            </div>
                            <div
                              className="text-[11px] font-mono"
                              style={{ color: th.colors.accent }}
                            >
                              {th.environmentTitle}
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 flex items-center justify-between gap-2">
                          <span
                            className="text-xs font-mono truncate"
                            style={{ color: th.colors.textSecondary }}
                          >
                            {th.biome}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {th.swatches.map((color, idx) => (
                              <span
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-white/25"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Background, Video Quality & Microphone */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Background Opacity Card */}
                  <div
                    className="rounded-2xl p-4 border space-y-3"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                        <span>Cenário de Fundo ({currentTheme.name})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBgImage((prev) => !prev)}
                        className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg border cursor-pointer"
                        style={{
                          backgroundColor: showBgImage
                            ? currentTheme.colors.primary
                            : currentTheme.colors.bgApp,
                          color: showBgImage
                            ? currentTheme.colors.primaryText
                            : currentTheme.colors.textMuted,
                          borderColor: currentTheme.colors.borderSubtle,
                        }}
                      >
                        {showBgImage ? "Ativo" : "Inativo"}
                      </button>
                    </div>

                    {showBgImage && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span style={{ color: currentTheme.colors.textMuted }}>
                            Opacidade do cenário:
                          </span>
                          <strong>{bgOpacity}%</strong>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="85"
                          step="5"
                          value={bgOpacity}
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="w-full cursor-pointer accent-emerald-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Video Resolution & Fit Card */}
                  <div
                    className="rounded-2xl p-4 border space-y-3"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                        <Sliders className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                        <span>Reprodução & Enquadramento</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase" style={{ color: currentTheme.colors.accent }}>
                        AJUSTADO (FIT)
                      </span>
                    </div>

                    <p className="text-xs font-sans" style={{ color: currentTheme.colors.textSecondary }}>
                      Os vídeos sempre iniciam dentro do container (object-fit:
                      contain, 16:9), sem zoom automático e sem tela cheia
                      automática.
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "hd1080", label: "1080p FHD" },
                        { id: "hd720", label: "720p HD" },
                        { id: "auto", label: "Automático" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setPreferredVideoQuality(
                              item.id as VideoQualityPreference
                            )
                          }
                          className="py-2 px-2 rounded-xl border text-[11px] font-mono font-bold cursor-pointer transition-all"
                          style={{
                            backgroundColor:
                              preferredVideoQuality === item.id
                                ? currentTheme.colors.primary
                                : currentTheme.colors.bgApp,
                            color:
                              preferredVideoQuality === item.id
                                ? currentTheme.colors.primaryText
                                : currentTheme.colors.textSecondary,
                            borderColor:
                              preferredVideoQuality === item.id
                                ? currentTheme.colors.borderMain
                                : currentTheme.colors.borderSubtle,
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-mono">
                        Priorizar trava 1080p
                      </span>
                      <button
                        type="button"
                        onClick={() => setForce1080pOnly((prev) => !prev)}
                        className="px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase cursor-pointer"
                        style={{
                          backgroundColor: force1080pOnly
                            ? currentTheme.colors.primary
                            : currentTheme.colors.bgApp,
                          color: force1080pOnly
                            ? currentTheme.colors.primaryText
                            : currentTheme.colors.textMuted,
                          borderColor: currentTheme.colors.borderSubtle,
                        }}
                      >
                        {force1080pOnly ? "Ativado" : "Desativado"}
                      </button>
                    </div>
                  </div>

                  {/* Microphone & Backup Card */}
                  <div
                    className="rounded-2xl p-4 border space-y-3"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                        <Mic className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                        <span>Reconhecimento de Voz</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase">
                        {micPermission === "granted"
                          ? "Liberado"
                          : micPermission === "denied"
                          ? "Bloqueado"
                          : "Pendente"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={requestMicrophonePermission}
                      className="w-full py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase border cursor-pointer flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.primaryText,
                        borderColor: currentTheme.colors.borderMain,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Testar e Autorizar Microfone</span>
                    </button>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "auto", label: "Auto" },
                        { id: "gemini", label: "IA Gemini" },
                        { id: "native", label: "Nativo Web" },
                      ].map((eng) => (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() =>
                            setPreferredSpeechEngine(eng.id as any)
                          }
                          className="py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold uppercase cursor-pointer"
                          style={{
                            backgroundColor:
                              preferredSpeechEngine === eng.id
                                ? currentTheme.colors.bgElevated
                                : currentTheme.colors.bgApp,
                            color: currentTheme.colors.textPrimary,
                            borderColor:
                              preferredSpeechEngine === eng.id
                                ? currentTheme.colors.borderMain
                                : currentTheme.colors.borderSubtle,
                          }}
                        >
                          {eng.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <button
                        type="button"
                        onClick={handleExportSettings}
                        className="py-2 px-3 rounded-xl border font-mono text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: currentTheme.colors.bgApp,
                          color: currentTheme.colors.textPrimary,
                          borderColor: currentTheme.colors.borderSubtle,
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar JSON</span>
                      </button>

                      <label
                        className="py-2 px-3 rounded-xl border font-mono text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: currentTheme.colors.bgApp,
                          color: currentTheme.colors.textPrimary,
                          borderColor: currentTheme.colors.borderSubtle,
                        }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importar JSON</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImportSettings(f);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Centralized Groups Registry Inspection */}
                <div className="lg:col-span-7 space-y-4">
                  <div
                    className="rounded-2xl p-4 sm:p-5 border space-y-4"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                        <h3 className="text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider">
                          Grupos Cadastrados (groupsConfig.ts)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono uppercase" style={{ color: currentTheme.colors.textMuted }}>
                        2 Grupos · 10 Vídeos Isolados
                      </span>
                    </div>

                    <div className="space-y-4">
                      {GROUP_LIST.map((group) => (
                        <div
                          key={group.id}
                          className="p-4 rounded-2xl border space-y-3"
                          style={{
                            backgroundColor: currentTheme.colors.bgApp,
                            borderColor: currentTheme.colors.borderSubtle,
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="font-display font-extrabold text-sm uppercase">
                                {group.name}
                              </h4>
                              <p className="text-xs font-mono" style={{ color: currentTheme.colors.textSecondary }}>
                                Integrantes: {group.members.join(", ")} · Tema:{" "}
                                {THEMES[group.temaReferencia].name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectGroup(group.id)}
                              className="px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase cursor-pointer self-start"
                              style={{
                                backgroundColor: currentTheme.colors.primary,
                                color: currentTheme.colors.primaryText,
                                borderColor: currentTheme.colors.borderMain,
                              }}
                            >
                              Abrir Apresentação
                            </button>
                          </div>

                          <div className="space-y-1.5 text-[11px] font-mono">
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg border border-white/10">
                              <span className="truncate">
                                <strong>Introdução:</strong> {group.intro.title}
                              </span>
                              <a
                                href={group.intro.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 shrink-0 hover:underline"
                                style={{ color: currentTheme.colors.accent }}
                              >
                                <span>YouTube</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {group.triggers.map((tr, i) => (
                              <div
                                key={tr.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-white/10"
                              >
                                <span className="truncate">
                                  <strong>Gatilho {i + 1}:</strong> "{tr.phrase}"{" "}
                                  {tr.actionType === "ending"
                                    ? "(Encerramento)"
                                    : ""}
                                </span>
                                <a
                                  href={tr.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 shrink-0 hover:underline"
                                  style={{ color: currentTheme.colors.accent }}
                                >
                                  <span>YouTube</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Official Footer */}
      {!hidePanels && !isFullscreen && (
        <footer
          id="app-footer"
          className="mt-auto py-5 border-t backdrop-blur-md relative z-20"
          style={{
            backgroundColor: currentTheme.colors.bgSurface,
            borderColor: currentTheme.colors.borderSubtle,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono gap-2">
            <div className="flex items-center gap-2.5">
              <NatureAssistantsLogo size={22} />
              <span
                className="font-bold uppercase"
                style={{ color: currentTheme.colors.textPrimary }}
              >
                ASSISTENTES DA NATUREZA — ESCOLA NESTOR DE CAMARGO
              </span>
            </div>
            <span style={{ color: currentTheme.colors.textMuted }}>
              CURSO: AMBIENTES INTELIGENTES · PANTANAL & AMAZÔNIA
            </span>
          </div>
        </footer>
      )}

      {/* Hidden Panels Minimalist Dock (Falar com Assistente + Active Group 4 Triggers) */}
      {hidePanels &&
        !isFullscreen &&
        appScreen === "presentation" &&
        activeGroup &&
        !presentationEnded && (
          <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl px-3 sm:px-4 z-50 select-none pointer-events-auto animate-fade-in">
            <div
              className="backdrop-blur-md border-2 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2.5"
              style={{
                backgroundColor: currentTheme.colors.bgSurface,
                borderColor: currentTheme.colors.borderMain,
              }}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={!canUseVoiceNow}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-extrabold uppercase transition-all cursor-pointer border-2 shrink-0 disabled:opacity-45 ${
                      isListening || isRecordingMedia
                        ? "bg-red-600 text-white border-white animate-pulse"
                        : ""
                    }`}
                    style={
                      !(isListening || isRecordingMedia)
                        ? {
                            backgroundColor: currentTheme.colors.primary,
                            color: currentTheme.colors.primaryText,
                            borderColor: currentTheme.colors.borderMain,
                          }
                        : undefined
                    }
                  >
                    {isListening || isRecordingMedia ? (
                      <>
                        <MicOff className="w-4 h-4 shrink-0" />
                        <span>
                          {isRecordingMedia
                            ? `Gravando (${recordingDuration}s)`
                            : "Ouvindo..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 shrink-0" />
                        <span>Falar com a Assistente</span>
                      </>
                    )}
                  </button>

                  {(isListening || realtimeSpeech) && (
                    <div className="text-xs font-mono text-white italic truncate px-2.5 py-1.5 rounded-lg bg-black/50 min-w-0 flex-1">
                      {realtimeSpeech
                        ? `"${realtimeSpeech}"`
                        : "Fale uma das 4 perguntas do grupo..."}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReplayVideo}
                    className="px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase cursor-pointer flex items-center gap-1"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      color: currentTheme.colors.textPrimary,
                      borderColor: currentTheme.colors.borderSubtle,
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rever</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHidePanels(false)}
                    className="px-3 py-1.5 rounded-lg border text-[10px] font-mono font-extrabold uppercase cursor-pointer flex items-center gap-1.5"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      color: currentTheme.colors.textPrimary,
                      borderColor: currentTheme.colors.borderMain,
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Painel</span>
                  </button>
                </div>
              </div>

              {/* Active Group 4 Triggers Only */}
              <div
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t"
                style={{ borderColor: currentTheme.colors.borderSubtle }}
              >
                <span
                  className="text-[10px] font-mono font-bold uppercase whitespace-nowrap shrink-0"
                  style={{ color: currentTheme.colors.textMuted }}
                >
                  {activeGroup.shortName}:
                </span>
                {activeGroup.triggers.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => playGroupVideo(activeGroup.id, tr.id)}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold whitespace-nowrap cursor-pointer shrink-0 transition-all hover:brightness-125"
                    style={{
                      backgroundColor: currentTheme.colors.chipBg,
                      borderColor: currentTheme.colors.borderSubtle,
                      color: currentTheme.colors.textPrimary,
                    }}
                  >
                    "{tr.phrase}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Mobile Microphone Guide Modal */}
      {showMicModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="border-2 rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4 text-left shadow-2xl"
            style={{
              backgroundColor: currentTheme.colors.bgSurface,
              borderColor: currentTheme.colors.borderMain,
              color: currentTheme.colors.textPrimary,
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: currentTheme.colors.borderSubtle }}
            >
              <div className="flex items-center gap-2">
                <Mic
                  className="w-5 h-5"
                  style={{ color: currentTheme.colors.primary }}
                />
                <h3 className="font-display font-extrabold text-sm uppercase">
                  Autorizar Microfone no Navegador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="text-zinc-400 hover:text-white p-1 text-xs font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <p style={{ color: currentTheme.colors.textSecondary }}>
                Para usar os gatilhos por voz, permita o acesso ao microfone:
              </p>
              <div
                className="p-3 rounded-xl border space-y-1"
                style={{
                  backgroundColor: currentTheme.colors.bgCard,
                  borderColor: currentTheme.colors.borderSubtle,
                }}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android (Chrome) / Desktop</span>
                </div>
                <p style={{ color: currentTheme.colors.textSecondary }}>
                  Toque no cadeado ao lado da URL &gt; Permissões &gt; Microfone
                  &gt; Permitir.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="px-4 py-2 rounded-xl border font-mono text-xs font-bold uppercase cursor-pointer"
                style={{
                  backgroundColor: currentTheme.colors.bgCard,
                  borderColor: currentTheme.colors.borderSubtle,
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await requestMicrophonePermission();
                  if (ok) {
                    setShowMicModal(false);
                    setSpeechError("");
                  }
                }}
                className="px-4 py-2 rounded-xl border font-mono text-xs font-extrabold uppercase cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: currentTheme.colors.primaryText,
                  borderColor: currentTheme.colors.borderMain,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Testar Microfone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Ecosystem & Biome Telemetry Modal */}
      <SmartEcosystemModal
        isOpen={showEcosystemModal}
        onClose={() => setShowEcosystemModal(false)}
        theme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onOpenSettings={() => setActiveTab("settings")}
      />
    </div>
  );
}
