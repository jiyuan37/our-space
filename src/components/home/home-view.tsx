"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  updatePresenceAction,
  type PresenceActionState,
} from "@/app/presence-actions";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  Notice,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/form-controls";
import { errorMessageKey } from "@/lib/i18n/errors";
import {
  isPresenceCurrentForViewer,
  millisecondsUntilNextLocalDay,
} from "@/lib/presence/freshness";
import { PRESENCE_MAX_LENGTH } from "@/lib/validation/presence";
import type { HomeViewModel } from "@/server/services/home-service";

const initialActionState: PresenceActionState = {};

function initials(name: string): string {
  return Array.from(name.trim()).slice(0, 2).join("").toUpperCase() || "OS";
}

function useViewerNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const current = new Date();
      setNow(current);
      timer = setTimeout(refresh, millisecondsUntilNextLocalDay(current) + 50);
    };
    refresh();
    return () => clearTimeout(timer);
  }, []);
  return now;
}

function PresenceEditor({
  initialText,
  onComplete,
  onCancel,
}: Readonly<{
  initialText: string;
  onComplete: (status: NonNullable<PresenceActionState["status"]>) => void;
  onCancel: () => void;
}>) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(
    updatePresenceAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status) onComplete(state.status);
  }, [onComplete, state.status]);

  return (
    <form action={action} className="presence-editor">
      <label htmlFor="presence-short-text">{t("presence.label")}</label>
      <textarea
        autoFocus
        id="presence-short-text"
        name="shortText"
        defaultValue={initialText}
        rows={3}
        aria-describedby="presence-hint"
      />
      <p id="presence-hint" className="field-hint">
        {t("presence.hint", { max: PRESENCE_MAX_LENGTH })}
      </p>
      {state.errorCode && (
        <Notice tone="error">{t(errorMessageKey(state.errorCode))}</Notice>
      )}
      <div className="presence-editor-actions">
        <PrimaryButton pending={pending}>
          {pending ? t("presence.saving") : t("presence.save")}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel} disabled={pending}>
          {t("presence.cancel")}
        </SecondaryButton>
        {initialText && (
          <SecondaryButton
            name="intent"
            value="clear"
            disabled={pending}
            className="presence-clear"
          >
            {t("presence.clear")}
          </SecondaryButton>
        )}
      </div>
    </form>
  );
}

export function HomeView({
  home,
  showWelcome = false,
}: Readonly<{ home: HomeViewModel; showWelcome?: boolean }>) {
  const { t } = useI18n();
  const now = useViewerNow();
  const [editing, setEditing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const hasEditorHistoryEntry = useRef(false);
  const editorHistoryToken = useRef("presence-editor");
  useEffect(() => {
    if (!editing) return;
    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        presenceEditor: editorHistoryToken.current,
      },
      "",
      window.location.href,
    );
    hasEditorHistoryEntry.current = true;
    const closeOnBack = () => {
      hasEditorHistoryEntry.current = false;
      setEditing(false);
    };
    window.addEventListener("popstate", closeOnBack);
    return () => window.removeEventListener("popstate", closeOnBack);
  }, [editing]);
  const closeEditor = useCallback(() => {
    if (
      hasEditorHistoryEntry.current &&
      window.history.state?.presenceEditor === editorHistoryToken.current
    ) {
      window.history.back();
      return;
    }
    hasEditorHistoryEntry.current = false;
    setEditing(false);
  }, []);
  const orderedResidents = useMemo(
    () =>
      [...home.residents].sort(
        (a, b) => Number(a.isViewer) - Number(b.isViewer),
      ),
    [home.residents],
  );
  const currentText = (resident: HomeViewModel["residents"][number]) =>
    now &&
    resident.presence &&
    isPresenceCurrentForViewer(resident.presence.updatedAt, now)
      ? resident.presence.shortText
      : "";
  const hasCurrentPresence = now
    ? orderedResidents.some((resident) => Boolean(currentText(resident)))
    : false;

  return (
    <article className="home" aria-labelledby="home-title">
      <header className="home-intro">
        <p className="eyebrow">{t("home.eyebrow")}</p>
        <h1 id="home-title">{home.space.name}</h1>
        <p className="home-private-note">{t("home.private")}</p>
      </header>

      {showWelcome && (
        <p className="home-welcome" role="status">
          {t("home.welcome")}
        </p>
      )}

      <section className="residents" aria-labelledby="residents-title">
        <h2 id="residents-title">{t("home.residentsHeading")}</h2>
        <ul className="resident-list">
          {orderedResidents.map((resident) => {
            const text = currentText(resident);
            return (
              <li className="resident" key={resident.id}>
                <div className="resident-avatar" aria-hidden="true">
                  {initials(resident.displayName)}
                </div>
                <div className="resident-presence">
                  <h3>{resident.displayName}</h3>
                  <div className="presence-line" aria-live="polite">
                    {now && text ? <p>{text}</p> : null}
                  </div>
                  {resident.isViewer && !editing && now && (
                    <button
                      className="presence-edit"
                      type="button"
                      onClick={() => {
                        setAnnouncement("");
                        setEditing(true);
                      }}
                    >
                      {text ? t("presence.edit") : t("presence.add")}
                    </button>
                  )}
                  {resident.isViewer && editing && now && (
                    <PresenceEditor
                      initialText={text}
                      onComplete={(status) => {
                        setAnnouncement(
                          status === "saved"
                            ? t("presence.saved")
                            : t("presence.cleared"),
                        );
                        closeEditor();
                      }}
                      onCancel={closeEditor}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="quiet-state" aria-live="polite">
        {now && !hasCurrentPresence ? (
          <>
            <p className="quiet-title">{t("home.quiet")}</p>
            <p>{t("home.quietSupporting")}</p>
          </>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </article>
  );
}
