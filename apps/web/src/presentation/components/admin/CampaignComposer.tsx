"use client";

import { useState, useTransition } from "react";

import type { TiptapDocument } from "@/application/articles/model";
import type {
  broadcastCampaignAction,
  sendTestCampaignAction,
} from "@/presentation/actions/campaigns";
import { TiptapEditor } from "./TiptapEditor";

const EMPTY_DOC: TiptapDocument = { type: "doc", content: [] };

type Message = { type: "success" | "error"; text: string } | null;

export function CampaignComposer({
  confirmedCount,
  defaultTestEmail,
  testAction,
  broadcastAction,
}: {
  confirmedCount: number;
  defaultTestEmail: string;
  testAction: typeof sendTestCampaignAction;
  broadcastAction: typeof broadcastCampaignAction;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [contentJson, setContentJson] = useState<TiptapDocument>(EMPTY_DOC);
  const [subject, setSubject] = useState("");
  const [testEmail, setTestEmail] = useState(defaultTestEmail);

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("subject", subject);
    fd.set("contentJson", JSON.stringify(contentJson));
    fd.set("testEmail", testEmail);
    return fd;
  };

  const runTest = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await testAction(buildFormData());
      setMessage(
        res.ok
          ? { type: "success", text: `테스트 메일을 ${testEmail}로 보냈습니다.` }
          : { type: "error", text: res.error },
      );
    });
  };

  const runBroadcast = () => {
    if (
      !window.confirm(
        `확인 완료된 구독자 ${confirmedCount}명에게 발송합니다. 계속할까요?`,
      )
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await broadcastAction(buildFormData());
      setMessage(
        res.ok
          ? { type: "success", text: `${res.sent ?? 0}명에게 발송했습니다.` }
          : { type: "error", text: res.error },
      );
    });
  };

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-foreground">제목</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="이번 주 웰니스 인사이트"
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-card-foreground outline-none focus:border-accent"
        />
      </label>

      <div className="block">
        <span className="text-sm font-medium text-foreground">본문</span>
        <div className="mt-1">
          <TiptapEditor initialValue={EMPTY_DOC} onChange={setContentJson} />
        </div>
      </div>

      {message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-accent/15 text-accent"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="flex-1 min-w-[200px]">
          <span className="text-sm text-muted-foreground">테스트 수신 이메일</span>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="me@example.com"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={runTest}
          disabled={pending}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          {pending ? "처리 중…" : "테스트 발송"}
        </button>
        <button
          type="button"
          onClick={runBroadcast}
          disabled={pending || confirmedCount === 0}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {confirmedCount > 0
            ? `전체 발송 (${confirmedCount}명)`
            : "발송할 구독자 없음"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        발송 전 반드시 테스트 메일로 레이아웃을 확인하세요. 발송은 확인 완료
        상태의 구독자에게만 전달되며, 각 메일에는 구독 해지 링크가 자동으로
        포함됩니다.
      </p>
    </div>
  );
}
