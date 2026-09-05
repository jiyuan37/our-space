"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { avatarAction } from "@/app/avatar-actions";
import { AVATAR, type AvatarJobView } from "@/lib/avatar/config";
import { useI18n } from "@/components/i18n/i18n-provider";
import { errorMessageKey, type UiErrorCode } from "@/lib/i18n/errors";
import {
  Notice,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/form-controls";
import { ResidentAvatar } from "@/components/avatar/resident-avatar";

export function AvatarWizard({
  currentUrl,
  initialJob,
  enabled,
  testMode = false,
}: {
  currentUrl: string | null;
  initialJob: AvatarJobView | null;
  enabled: boolean;
  testMode?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState(false);
  const [job, setJob] = useState(initialJob);
  const [error, setError] = useState<UiErrorCode | null>(null);
  const [saving, setSaving] = useState(false);
  const activeId = useRef(initialJob?.id ?? null);
  const submitting = useRef(false);
  const candidateHeading = useRef<HTMLHeadingElement>(null);
  const pending = job?.status === "PENDING";
  const pendingId = pending ? job.id : null;
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (job?.status === "READY") candidateHeading.current?.focus();
  }, [job?.status]);
  useEffect(() => {
    if (!pendingId) return;
    let stopped = false;
    const deadline = Date.now() + AVATAR.pendingTtlMs;
    const poll = async () => {
      if (Date.now() > deadline) {
        if (!stopped)
          setJob((current) =>
            current?.id === pendingId
              ? { ...current, status: "FAILED" }
              : current,
          );
        return;
      }
      try {
        const response = await fetch(`/api/avatar/jobs/${pendingId}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const result = (await response.json()) as AvatarJobView;
        if (!stopped && activeId.current === result.id) setJob(result);
      } catch {
        /* 网络恢复后继续读取同一任务，不重发生成。 */
      }
    };
    const timer = setInterval(() => void poll(), 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [pendingId]);
  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!file || !consent || !enabled || submitting.current || pending) return;
    submitting.current = true;
    setError(null);
    setSelected(false);
    const id = crypto.randomUUID();
    activeId.current = id;
    setJob({
      id,
      status: "PENDING",
      candidateUrl: null,
      expiresAt: new Date(Date.now() + AVATAR.candidateTtlMs).toISOString(),
    });
    const data = new FormData();
    data.set("photo", file);
    data.set("requestId", id);
    data.set("consent", AVATAR.policyVersion);
    try {
      const response = await fetch("/api/avatar/generate", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (activeId.current !== id) return;
      if (!response.ok) {
        setError(result.errorCode ?? "UNEXPECTED_ERROR");
        setJob(null);
      } else setJob(result);
    } catch {
      // 请求结果未知时保留任务编号并读取状态，绝不自动再生成。
      if (activeId.current === id) setError("AVATAR_CONNECTION_UNCERTAIN");
    } finally {
      submitting.current = false;
    }
  }
  async function cancel(returnHome: boolean) {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const id = activeId.current;
      if (id) {
        const result = await avatarAction("cancel", id);
        if (!result.ok) {
          setError(result.errorCode ?? "UNEXPECTED_ERROR");
          return;
        }
      }
      activeId.current = null;
      setJob(null);
      setSelected(false);
      if (returnHome) {
        setFile(null);
        router.push("/home");
        router.refresh();
      }
    } catch {
      setError("UNEXPECTED_ERROR");
    } finally {
      setSaving(false);
    }
  }
  async function confirm() {
    if (!job || !selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await avatarAction("confirm", job.id);
      if (!result.ok) {
        setError(result.errorCode ?? "UNEXPECTED_ERROR");
        return;
      }
      activeId.current = null;
      setFile(null);
      router.push("/home");
      router.refresh();
    } catch {
      setError("UNEXPECTED_ERROR");
    } finally {
      setSaving(false);
    }
  }
  return (
    <article className="avatar-studio" aria-labelledby="avatar-title">
      <header>
        <p className="eyebrow">{t("avatar.eyebrow")}</p>
        <h1 id="avatar-title">
          {t(currentUrl ? "avatar.replace" : "avatar.create")}
        </h1>
        <p>{t("avatar.intro")}</p>
      </header>
      {testMode && <Notice>{t("avatar.testMode")}</Notice>}
      {currentUrl && (
        <div className="avatar-current">
          <ResidentAvatar key={currentUrl} url={currentUrl} name="" />
          <p>{t("avatar.keepCurrent")}</p>
        </div>
      )}
      {!enabled && <Notice>{t("errors.AVATAR_UNAVAILABLE")}</Notice>}
      {error && (
        <Notice id="avatar-error" tone="error">
          {t(errorMessageKey(error))}
        </Notice>
      )}
      {pending ? (
        <section className="avatar-stage" role="status">
          <span className="avatar-progress" aria-hidden="true">
            ···
          </span>
          <h2>{t("avatar.generating")}</h2>
          <p>{t("avatar.generatingNote")}</p>
        </section>
      ) : job?.status === "READY" && job.candidateUrl ? (
        <section className="avatar-stage" aria-labelledby="candidate-title">
          <h2 id="candidate-title" ref={candidateHeading} tabIndex={-1}>
            {t("avatar.candidate")}
          </h2>
          <p>{t("avatar.candidateNote")}</p>
          <div className="avatar-candidate-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.candidateUrl}
              alt={t("avatar.candidateAlt")}
              width="256"
              height="256"
              className="avatar-candidate"
            />
            <div>
              <p>{t("avatar.normalSize")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={job.candidateUrl}
                width="60"
                height="60"
                alt=""
                className="avatar-normal"
              />
            </div>
          </div>
          <label className="avatar-consent">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => setSelected(e.target.checked)}
              disabled={saving}
            />
            <span>{t("avatar.select")}</span>
          </label>
          <div className="avatar-actions">
            <PrimaryButton
              type="button"
              pending={saving}
              disabled={!selected}
              onClick={() => void confirm()}
            >
              {t("avatar.confirm")}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={saving}
              onClick={() => void cancel(false)}
            >
              {t("avatar.regenerate")}
            </SecondaryButton>
          </div>
        </section>
      ) : (
        <form onSubmit={generate} className="avatar-form">
          {job?.status === "FAILED" && (
            <Notice tone="error">{t("errors.AVATAR_GENERATION_FAILED")}</Notice>
          )}
          <label htmlFor="avatar-photo" className="avatar-photo-label">
            {t("avatar.photo")}
          </label>
          <input
            id="avatar-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={`avatar-photo-hint${error ? " avatar-error" : ""}`}
            onChange={(e) => {
              const next = e.target.files?.[0];
              setConsent(false);
              setError(null);
              if (
                next &&
                (next.size > AVATAR.maxUploadBytes ||
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    next.type,
                  ))
              ) {
                setError("AVATAR_INVALID_PHOTO");
                setFile(null);
                e.target.value = "";
                return;
              }
              setFile(next ?? null);
            }}
          />
          <p id="avatar-photo-hint" className="field-hint">
            {t("avatar.photoHint")}
          </p>
          {preview && (
            <figure className="avatar-local-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={t("avatar.photoAlt")}
                width="200"
                height="200"
              />
              <figcaption>{t("avatar.localOnly")}</figcaption>
            </figure>
          )}
          <details className="avatar-policy" open>
            <summary>{t("avatar.privacyTitle")}</summary>
            <p>{t("avatar.privacyInput")}</p>
            <p>{t("avatar.privacyStorage")}</p>
            <p>{t("avatar.privacyProvider")}</p>
            <a
              href="https://developers.cloudflare.com/workers-ai/platform/data-usage/"
              target="_blank"
              rel="noreferrer"
            >
              {t("avatar.providerPolicy")}
            </a>
          </details>
          <label className="avatar-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={!file || !enabled}
            />
            <span>{t("avatar.consent")}</span>
          </label>
          {enabled && (
            <PrimaryButton disabled={!file || !consent}>
              {t("avatar.generate")}
            </PrimaryButton>
          )}
          <p className="field-hint">{t("avatar.costNote")}</p>
        </form>
      )}
      <SecondaryButton
        className="avatar-exit"
        type="button"
        disabled={saving}
        onClick={() => void cancel(true)}
      >
        {t("avatar.cancel")}
      </SecondaryButton>
    </article>
  );
}
