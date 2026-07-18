import { SettingsForm } from "@/presentation/components/admin/SettingsForm";
import { updateSettingsAction } from "@/presentation/actions/settings";
import { settingsService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const initial = await settingsService
    .getRaw()
    .catch(() => settingsService.get());

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">사이트 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          홈 화면 소개 문구, 브라우저 파비콘, 공유용 OG 이미지를 수정합니다.
          저장 즉시 공개 사이트에 반영됩니다.
        </p>
      </header>
      <SettingsForm initial={initial} action={updateSettingsAction} />
    </div>
  );
}
