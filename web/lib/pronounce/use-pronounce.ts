"use client";

import { useCallback, useSyncExternalStore } from "react";

const WORD = "kicking";
const LANGUAGE = "en-US";
const RATE = 0.9;

const noopSubscribe = () => () => {};

export function useSpeechSupported() {
  return useSyncExternalStore(
    noopSubscribe,
    () => "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    () => false,
  );
}

export function usePronounce() {
  return useCallback(() => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(WORD);
    utterance.lang = LANGUAGE;
    utterance.rate = RATE;
    const voice = synth.getVoices().find((candidate) => candidate.lang === LANGUAGE) ??
      synth.getVoices().find((candidate) => candidate.lang.startsWith(LANGUAGE.slice(0, 2)));
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  }, []);
}
