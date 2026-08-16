interface Props {
  message: string | null;
  tone?: "error" | "info";
}

export function StatusBanner({ message, tone = "error" }: Props): JSX.Element | null {
  if (!message) return null;
  return <div className={`status-banner ${tone}`}>{message}</div>;
}
