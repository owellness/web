export const dynamic = "force-dynamic";

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        메일함을 확인하세요
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        입력하신 이메일로 로그인 링크를 보내드렸습니다.
        <br />
        링크는 5분 동안만 유효하며, 한 번만 사용할 수 있습니다.
      </p>
    </div>
  );
}
