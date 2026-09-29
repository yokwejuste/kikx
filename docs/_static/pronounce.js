document.addEventListener("DOMContentLoaded", () => {
  if (!("speechSynthesis" in window)) return;
  const labels = { en: "Listen to the pronunciation", fr: "Écouter la prononciation" };
  const label = labels[document.documentElement.lang.slice(0, 2)] ?? labels.en;
  const icon =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a10 10 0 0 1 0 14"></path></svg>';

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance("kicking");
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  document.querySelectorAll("p.pronunciation").forEach((paragraph) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pronounce-button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = icon;
    button.addEventListener("click", speak);
    paragraph.append(" ", button);
  });
});
