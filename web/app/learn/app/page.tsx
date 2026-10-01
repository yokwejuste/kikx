import { LessonChooser } from "@/components/teach/lesson-chooser";

export default function LearnAppPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
      <LessonChooser mode="app" />
    </main>
  );
}
