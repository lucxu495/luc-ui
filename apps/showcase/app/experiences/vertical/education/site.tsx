"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  Progress,
  Radio,
  RadioGroup,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

// Course — a learning module.
//
// The quiz is a real assessment: choosing an answer reveals whether it was
// right, explains why, and scores out of four. Lesson progress accumulates
// across the module, and completion is a state the reader reaches rather than a
// banner that appears.
//
// The feedback rule matters most. A wrong answer here is explained, not marked:
// the explanation is the product, and a quiz that only says "incorrect" has
// taught nothing.

interface Lesson {
  id: string;
  title: string;
  duration: string;
  body: string[];
}

const LESSONS: Lesson[] = [
  {
    id: "l1",
    title: "What a queue promises",
    duration: "8 min",
    body: [
      "A queue is a promise that somebody will get to the work later. The promise is cheap to make and expensive to keep, because everything waiting in it has to be owned, monitored and eventually explained.",
      "Before adding a queue, write the sentence that says what happens when it is full. If the sentence is hard to write, the queue is a hope rather than a design.",
    ],
  },
  {
    id: "l2",
    title: "Backpressure as a contract",
    duration: "12 min",
    body: [
      "Backpressure is the mechanism by which a slow consumer tells a fast producer to wait. It is a contract, which means both sides have to implement it: a producer that ignores the signal has removed the pressure and kept the queue.",
      "The diagnostic question is not how deep the buffer is. It is what happens at the moment the buffer stops accepting.",
    ],
  },
  {
    id: "l3",
    title: "Choosing what to refuse",
    duration: "10 min",
    body: [
      "Every system that survives load has a policy about refusal, whether or not anyone wrote it down. The policies that work name the work that may be dropped: a status check, a retry, an analytics event.",
      "Write the list before the incident, and the incident becomes a decision rather than an argument.",
    ],
  },
];

interface Question {
  id: string;
  prompt: string;
  options: Array<{ id: string; label: string; correct: boolean; why: string }>;
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "A consumer is ten times slower than its producer. Which change actually removes the risk?",
    options: [
      {
        id: "a",
        label: "A bigger buffer",
        correct: false,
        why: "A buffer buys time. It does not change the ratio, so the same conversation happens later, with more data at stake.",
      },
      {
        id: "b",
        label: "A backpressure signal the producer obeys",
        correct: true,
        why: "The ratio is the problem, so the fix has to reach the producer. A signal that is ignored is not backpressure.",
      },
      {
        id: "c",
        label: "More consumers",
        correct: false,
        why: "Often right, and still not the risk removed: with no signal, the producer simply fills the larger pool.",
      },
    ],
  },
  {
    id: "q2",
    prompt: "Which sentence belongs in a design review?",
    options: [
      {
        id: "a",
        label: "The queue absorbs the burst",
        correct: false,
        why: "It describes a hope. Every queue absorbs a burst until it does not, and the sentence does not say where that point is.",
      },
      {
        id: "b",
        label: "At 40,000 events a second we drop analytics before retries",
        correct: true,
        why: "It names the threshold and the refusal. That is a decision someone can disagree with, which is what a review needs.",
      },
    ],
  },
];

export function CourseModule() {
  const { tcs } = useI18n();
  const [lessonIndex, setLessonIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const lesson = LESSONS[lessonIndex]!;
  const allReviewed = QUESTIONS.every((question) => answers[question.id]);
  const score = QUESTIONS.filter(
    (question) => question.options.find((option) => option.id === answers[question.id])?.correct,
  ).length;
  const progress = Math.round((completed.length / LESSONS.length) * 100);

  return (
    <div data-slot="course-module" className="grid gap-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav
        aria-label={tcs("Lessons")}
        className="flex flex-col gap-2 border-b border-line-subtle bg-surface-sunken p-4 lg:border-r lg:border-b-0"
      >
        <h2 className="text-label font-semibold text-fg-primary">{tcs("Reliability foundations")}</h2>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-micro text-fg-muted">
            <span>{tcs("Progress")}</span>
            <span className="luc-numeric">{progress}%</span>
          </span>
          <Progress value={progress} aria-label={tcs("Module progress")} />
        </div>
        <ul className="flex list-none flex-col gap-1 pt-1">
          {LESSONS.map((entry, index) => {
            const done = completed.includes(entry.id);
            const current = index === lessonIndex;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-current={current ? "step" : undefined}
                  onClick={() => setLessonIndex(index)}
                  className={
                    current
                      ? "luc-focus flex w-full flex-col rounded-sm bg-surface-selected px-2 py-1.5 text-left"
                      : "luc-focus luc-transition flex w-full flex-col rounded-sm px-2 py-1.5 text-left hover:bg-surface-interactive"
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className="text-label text-fg-primary">
                      {index + 1}. {tcs(entry.title)}
                    </span>
                    {done ? (
                      <Badge tone="positive" size="sm">
                        {tcs("Done")}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-micro text-fg-muted luc-numeric">{entry.duration}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-6 p-6">
        <article className="flex max-w-[64ch] flex-col gap-4">
          <p className="text-micro text-fg-accent">
            {tcs("Lesson")} {lessonIndex + 1} / {LESSONS.length}
          </p>
          <h3 className="font-display text-heading font-semibold text-fg-primary text-balance">
            {tcs(lesson.title)}
          </h3>
          {lesson.body.map((paragraph) => (
            <p key={paragraph} className="text-body-lg text-fg-secondary text-pretty">
              {tcs(paragraph)}
            </p>
          ))}
        </article>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={completed.includes(lesson.id) ? "outline" : "accent"}
            onClick={() =>
              setCompleted((current) =>
                current.includes(lesson.id) ? current : [...current, lesson.id],
              )
            }
            disabled={completed.includes(lesson.id)}
          >
            {completed.includes(lesson.id) ? tcs("Lesson complete") : tcs("Mark as read")}
          </Button>
          <Button
            variant="ghost"
            disabled={lessonIndex === 0}
            onClick={() => setLessonIndex((index) => Math.max(0, index - 1))}
          >
            {tcs("Previous lesson")}
          </Button>
          <Button
            variant="ghost"
            disabled={lessonIndex === LESSONS.length - 1}
            onClick={() => setLessonIndex((index) => Math.min(LESSONS.length - 1, index + 1))}
          >
            {tcs("Next lesson")}
          </Button>
        </div>

        <Card variant="raised">
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-title font-semibold text-fg-primary">{tcs("Check your reading")}</h3>
              <Badge tone={checked ? (score === QUESTIONS.length ? "positive" : "warning") : "neutral"} size="sm">
                {checked ? `${score} / ${QUESTIONS.length}` : tcs("Not checked yet")}
              </Badge>
            </div>

            {QUESTIONS.map((question) => {
              const chosen = answers[question.id];
              const option = question.options.find((entry) => entry.id === chosen);
              return (
                <fieldset key={question.id} className="flex flex-col gap-3 border-t border-line-subtle pt-4 first:border-t-0 first:pt-0">
                  <legend className="text-body font-medium text-fg-primary text-pretty">
                    {tcs(question.prompt)}
                  </legend>
                  <RadioGroup
                    value={chosen ?? ""}
                    onValueChange={(next) => {
                      setAnswers((current) => ({ ...current, [question.id]: next }));
                      setChecked(false);
                    }}
                    aria-label={tcs(question.prompt)}
                    className="flex flex-col gap-2"
                  >
                    {question.options.map((entry) => (
                      <Radio
                        key={entry.id}
                        value={entry.id}
                        label={tcs(entry.label)}
                        invalid={checked && chosen === entry.id && !entry.correct}
                      />
                    ))}
                  </RadioGroup>
                  {checked && option ? (
                    <Callout tone={option.correct ? "success" : "warning"} title={option.correct ? tcs("Correct") : tcs("Not quite")}>
                      <p className="text-body text-fg-secondary text-pretty">{tcs(option.why)}</p>
                    </Callout>
                  ) : null}
                </fieldset>
              );
            })}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="accent"
                disabled={!allReviewed}
                onClick={() => setChecked(true)}
              >
                {tcs("Check my answers")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAnswers({});
                  setChecked(false);
                }}
              >
                {tcs("Start again")}
              </Button>
              <span className="text-caption text-fg-muted">
                {allReviewed
                  ? tcs("Both questions answered.")
                  : tcs("Answer both questions to see the explanation for each.")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
