import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export function FormField({
  label,
  id,
  hint,
  error,
  ...input
}: Readonly<
  {
    label: string;
    id: string;
    hint?: string;
    error?: string;
  } & InputHTMLAttributes<HTMLInputElement>
>) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      <input id={id} aria-describedby={describedBy || undefined} {...input} />
      {error && (
        <span id={`${id}-error`} className="notice notice-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  pending,
  className = "",
  disabled,
  ...button
}: Readonly<
  {
    children: ReactNode;
    pending?: boolean;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>) {
  return (
    <button
      className={`button button-primary ${className}`.trim()}
      disabled={pending || disabled}
      {...button}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...button
}: Readonly<
  { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>
>) {
  return (
    <button
      className={`button button-secondary ${className}`.trim()}
      {...button}
    >
      {children}
    </button>
  );
}

export function Notice({
  children,
  tone = "quiet",
}: Readonly<{ children: ReactNode; tone?: "quiet" | "error" }>) {
  return (
    <p
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
