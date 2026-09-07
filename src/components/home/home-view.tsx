"use client";

import Link from "next/link";
import { ResidentMarker } from "@/components/map/resident-marker";
import type { ReactNode } from "react";

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
const presenceHintId = "presence-hint";
const presenceErrorId = "presence-error";

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
  const describedBy = [presenceHintId, state.errorCode ? presenceErrorId : ""]
    .filter(Boolean)
    .join(" ");

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
        aria-describedby={describedBy}
      />
      <p id={presenceHintId} className="field-hint">
        {t("presence.hint", { max: PRESENCE_MAX_LENGTH })}
      </p>
      {state.errorCode && (
        <Notice id={presenceErrorId} tone="error">
          {t(errorMessageKey(state.errorCode))}
        </Notice>
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
  map,
}: Readonly<{ home: HomeViewModel; showWelcome?: boolean; map?: ReactNode }>) {
  const { locale, t } = useI18n();
  const now = useViewerNow();
  const [editing, setEditing] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcome);
  const [announcement, setAnnouncement] = useState<NonNullable<
    PresenceActionState["status"]
  > | null>(null);
  const hasEditorHistoryEntry = useRef(false);
  const editorHistoryToken = useRef("presence-editor");
  const welcomeLocale = useRef(locale);
  useEffect(() => {
    if (!showWelcome) return;
    window.history.replaceState(window.history.state, "", "/home");
  }, [locale, showWelcome]);
  useEffect(() => {
    if (!showWelcome || locale !== welcomeLocale.current) {
      setWelcomeVisible(false);
    }
  }, [locale, showWelcome]);
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
    <article className="home map-home" aria-labelledby="home-title">
      <header className="home-intro">
        <h1 id="home-title">{home.space.name}</h1>
        <p className="home-private-note">{t("home.private")}</p>
      </header>
      {map}

      {welcomeVisible && (
        <p className="home-welcome" role="status">
          {t("home.welcome")}
        </p>
      )}

      <section className="residents" aria-labelledby="residents-title">
        <h2 id="residents-title">{t("map.residentShortcuts")}</h2>
        <p className="resident-location-note">{t("map.unlocated")}</p>
        <ul className="resident-list">
          {orderedResidents.map((resident) => {
            const text = currentText(resident);
            return (
              <li className="resident" key={resident.id}>
                <ResidentMarker
                  id={resident.id}
                  name={resident.displayName}
                  avatarUrl={resident.avatarUrl}
                  selected={selectedResident === resident.id}
                  onSelect={() =>
                    setSelectedResident(
                      selectedResident === resident.id ? null : resident.id,
                    )
                  }
                />
                <div className="resident-presence">
                  <h3 className="sr-only">{resident.displayName}</h3>
                  <div
                    id={`resident-details-${resident.id}`}
                    hidden={selectedResident !== resident.id}
                    className="resident-details"
                  >
                    <p>{t("map.unlocated")}</p>
                  </div>
                  {resident.isViewer && resident.avatarUrl && (
                    <Link
                      className="presence-edit avatar-change"
                      href="/avatar"
                    >
                      {t("avatar.replace")}
                    </Link>
                  )}
                  {resident.isViewer && !resident.avatarUrl && (
                    <Link
                      className="presence-edit avatar-create"
                      href="/avatar"
                    >
                      {t("avatar.create")}
                    </Link>
                  )}
                  <div className="presence-line" aria-live="polite">
                    {now && text ? <p>{text}</p> : null}
                  </div>
                  {resident.isViewer && !editing && now && (
                    <button
                      className="presence-edit"
                      type="button"
                      onClick={() => {
                        setAnnouncement(null);
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
                        setAnnouncement(status);
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
        {announcement
          ? t(announcement === "saved" ? "presence.saved" : "presence.cleared")
          : ""}
      </p>
    </article>
  );
}
