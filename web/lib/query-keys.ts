export const queryKeys = {
  components: ["components"] as const,
  project: (dir: string) => ["project", dir] as const,
};
