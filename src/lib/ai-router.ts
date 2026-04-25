import { AIRouter, getProjectPreset } from "ai-router";

const preset = getProjectPreset("STT");

export const aiRouter = new AIRouter({
  ...preset,
  projectName: "STT",
});

export { aiRouter as router };
