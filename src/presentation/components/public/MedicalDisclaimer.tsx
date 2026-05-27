export function MedicalDisclaimer({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  if (variant === "compact") {
    return (
      <p className="rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">의료 면책:</strong> 정보 제공이 목적이며 진단·치료를 대체하지 않습니다.
      </p>
    );
  }
  return (
    <aside
      role="note"
      aria-label="의료 면책 고지"
      className="mt-12 rounded-md border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground"
    >
      <strong className="text-foreground">의료 면책 고지.</strong>{" "}
      이 콘텐츠는 정보 제공을 목적으로 합니다. 진단·치료를 위한 의료 조언을
      대체하지 않으며, 증상이 있거나 기존 질환·약물 복용 중이라면 반드시 의료
      전문가와 상담하세요.
    </aside>
  );
}
