import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, SITE_URL } from "@/config/site";

const EFFECTIVE_DATE = "2026년 9월 5일";
const PRIVACY_URL = `${SITE_URL}/privacy`;

const operatorName =
  process.env.PRIVACY_OPERATOR_NAME?.trim() || SITE_NAME;
const officerName =
  process.env.PRIVACY_OFFICER_NAME?.trim() || `${SITE_NAME} 개인정보 보호 담당자`;
const contactEmail = process.env.PRIVACY_CONTACT_EMAIL?.trim() || "";
const contactPhone = process.env.PRIVACY_CONTACT_PHONE?.trim() || "";
const contactAddress = process.env.PRIVACY_CONTACT_ADDRESS?.trim() || "";
const vercelRegion =
  process.env.PRIVACY_VERCEL_REGION?.trim() || "대한민국 서울";
const neonRegion =
  process.env.PRIVACY_NEON_REGION?.trim() || "싱가포르";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: `${SITE_NAME}가 개인정보를 어떤 목적으로 수집하고 안전하게 관리하는지 안내합니다.`,
  alternates: { canonical: PRIVACY_URL },
  openGraph: {
    type: "website",
    url: PRIVACY_URL,
    title: `개인정보 처리방침 | ${SITE_NAME}`,
    description: `${SITE_NAME} 개인정보 처리방침`,
    siteName: SITE_NAME,
  },
};

const sectionClass = "scroll-mt-24 space-y-4 border-t border-border pt-10";
const headingClass = "text-xl font-semibold tracking-tight text-foreground";
const bodyClass = "text-sm leading-7 text-muted-foreground sm:text-base";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6">
      <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          홈
        </Link>
        <span aria-hidden> · </span>
        <span>개인정보 처리방침</span>
      </nav>

      <header className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Privacy Policy
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          개인정보 처리방침
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          {operatorName}(이하 “서비스”)는 이용자의 개인정보를 소중히 다루며,
          개인정보 보호 관련 법령에 따라 아래와 같이 처리합니다. 이 방침은 웹과
          모바일 앱에 함께 적용됩니다.
        </p>
        <p className="text-sm text-muted-foreground">
          시행일 {EFFECTIVE_DATE} · 최초 공고일 {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          ["최소 수집", "서비스 제공에 필요한 항목만 처리합니다."],
          ["목적 제한", "고지한 목적 범위 안에서만 이용합니다."],
          ["권리 보장", "열람·정정·삭제·처리정지를 요청할 수 있습니다."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold text-card-foreground">{title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>

      <nav
        aria-label="개인정보 처리방침 목차"
        className="my-12 rounded-2xl bg-muted p-6"
      >
        <p className="font-semibold text-foreground">목차</p>
        <ol className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {[
            ["purpose", "1. 처리 목적·항목·보유기간"],
            ["automatic", "2. 자동으로 생성되는 정보"],
            ["third-party", "3. 제3자 제공"],
            ["processors", "4. 처리위탁 및 국외 이전"],
            ["destruction", "5. 파기 절차와 방법"],
            ["rights", "6. 이용자의 권리와 행사 방법"],
            ["security", "7. 안전성 확보 조치"],
            ["contact", "8. 보호책임자와 권익침해 구제"],
            ["changes", "9. 처리방침 변경"],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="hover:text-foreground hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-12">
        <section id="purpose" className={sectionClass}>
          <h2 className={headingClass}>1. 개인정보의 처리 목적·항목·보유기간</h2>
          <p className={bodyClass}>
            서비스는 아래 목적에 필요한 범위에서 개인정보를 처리합니다. 원문
            비밀번호는 저장하지 않고, 무작위 salt가 적용된 단방향 해시만
            저장합니다.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead className="bg-muted/70 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">구분</th>
                  <th className="px-4 py-3 font-semibold">처리 항목</th>
                  <th className="px-4 py-3 font-semibold">목적</th>
                  <th className="px-4 py-3 font-semibold">보유기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr>
                  <td className="px-4 py-4 align-top font-medium text-foreground">
                    이메일 회원가입
                  </td>
                  <td className="px-4 py-4 align-top">
                    이름, 이메일, 비밀번호 해시, 성별, 생년월일, 전화번호
                  </td>
                  <td className="px-4 py-4 align-top">
                    계정 생성·식별, 회원 관리, 맞춤형 웰니스 서비스 제공, 부정 이용
                    방지
                  </td>
                  <td className="px-4 py-4 align-top">
                    회원 탈퇴 또는 처리 목적 달성 시까지
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 align-top font-medium text-foreground">
                    카카오 로그인
                  </td>
                  <td className="px-4 py-4 align-top">
                    카카오 회원번호, 닉네임, 이메일(제공에 동의한 경우)
                  </td>
                  <td className="px-4 py-4 align-top">
                    외부 계정을 이용한 본인 식별과 로그인
                  </td>
                  <td className="px-4 py-4 align-top">
                    회원 탈퇴 또는 카카오 연결 해제 시까지
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 align-top font-medium text-foreground">
                    OWTI 검사
                  </td>
                  <td className="px-4 py-4 align-top">
                    회원 식별자, 영역별 평균, 웰니스 유형 코드, 검사 일시
                  </td>
                  <td className="px-4 py-4 align-top">
                    검사 결과 제공, 결과 이력 관리, 맞춤 콘텐츠 추천
                  </td>
                  <td className="px-4 py-4 align-top">
                    회원 탈퇴 또는 이용자가 삭제를 요청할 때까지
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 align-top font-medium text-foreground">
                    뉴스레터
                  </td>
                  <td className="px-4 py-4 align-top">
                    이메일, 동의·확인·해지 일시, 유입 경로, 구독 상태
                  </td>
                  <td className="px-4 py-4 align-top">
                    구독 확인과 뉴스레터 발송, 수신 거부 관리
                  </td>
                  <td className="px-4 py-4 align-top">
                    구독 해지 시까지. 해지 후에는 재발송 방지 기록만 법령상 또는
                    분쟁 대응에 필요한 기간 보관
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 align-top font-medium text-foreground">
                    문의·권리행사
                  </td>
                  <td className="px-4 py-4 align-top">
                    이름, 회신 연락처, 문의 내용, 본인 확인에 필요한 정보
                  </td>
                  <td className="px-4 py-4 align-top">
                    문의 처리, 권리행사 본인 확인, 분쟁 대응
                  </td>
                  <td className="px-4 py-4 align-top">
                    처리 완료 후 3년 또는 관계 법령상 보존기간
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={bodyClass}>
            법령에 따라 별도 보관이 필요한 경우 해당 정보는 다른 정보와 분리하여
            법정 기간 동안만 보관합니다. 필수 항목의 처리를 거부할 수 있으나,
            이 경우 회원가입 또는 해당 기능 이용이 제한될 수 있습니다.
          </p>
        </section>

        <section id="automatic" className={sectionClass}>
          <h2 className={headingClass}>2. 서비스 이용 중 자동으로 생성되는 정보</h2>
          <p className={bodyClass}>
            서비스 이용 과정에서 IP 주소, 접속 일시, 기기·브라우저 정보, 오류 및
            보안 로그가 자동으로 생성될 수 있습니다. OWTI의 익명 이용 통계에는
            임의의 세션 식별자, 진행 단계, 결과 유형과 생성 일시가 포함될 수
            있으며 회원 계정과 직접 결합하지 않습니다.
          </p>
          <p className={bodyClass}>
            이러한 정보는 서비스 안정성, 보안, 장애 대응과 이용 현황 분석을 위해
            필요한 기간만 보관합니다. 서비스는 맞춤형 광고를 위한 행태정보를
            수집하지 않으며, Google Analytics가 설정된 경우에도 광고 개인화와
            브라우저 저장소 사용을 비활성화한 상태로 통계 정보를 처리합니다.
          </p>
        </section>

        <section id="third-party" className={sectionClass}>
          <h2 className={headingClass}>3. 개인정보의 제3자 제공</h2>
          <p className={bodyClass}>
            서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
            이용자가 별도로 동의한 경우, 법령에 특별한 규정이 있는 경우, 또는
            급박한 생명·신체의 이익을 위해 필요한 경우에만 법이 허용하는 범위에서
            제공합니다. 제3자 제공이 새로 발생하면 제공받는 자, 목적, 항목,
            보유기간과 거부권을 사전에 알립니다.
          </p>
        </section>

        <section id="processors" className={sectionClass}>
          <h2 className={headingClass}>4. 개인정보 처리위탁 및 국외 이전</h2>
          <p className={bodyClass}>
            안정적인 서비스 제공을 위해 아래 사업자에게 일부 처리를 위탁할 수
            있습니다. 이전은 이용자가 회원가입·로그인·구독·페이지 이용을 요청할
            때 암호화된 네트워크를 통해 이루어지며, 위탁 계약 종료 또는 각 처리
            목적 달성 시까지 처리됩니다.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead className="bg-muted/70 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">수탁자</th>
                  <th className="px-4 py-3 font-semibold">위탁 업무·이전 항목</th>
                  <th className="px-4 py-3 font-semibold">처리 위치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr>
                  <td className="px-4 py-4 align-top">Vercel, Inc.</td>
                  <td className="px-4 py-4 align-top">
                    웹 호스팅, 서버 기능 실행, 보안·접속 로그와 집계형 이용 통계 처리
                  </td>
                  <td className="px-4 py-4 align-top">{vercelRegion}</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 align-top">Neon, Inc.</td>
                  <td className="px-4 py-4 align-top">
                    회원·검사 결과·구독 정보의 데이터베이스 저장과 백업
                  </td>
                  <td className="px-4 py-4 align-top">{neonRegion}</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 align-top">Resend, Inc.</td>
                  <td className="px-4 py-4 align-top">
                    구독자 이메일과 수신 거부 링크를 이용한 뉴스레터 발송
                  </td>
                  <td className="px-4 py-4 align-top">
                    미국 등 서비스 제공자가 운영하는 리전
                  </td>
                </tr>
                {process.env.NEXT_PUBLIC_GA_ID ? (
                  <tr>
                    <td className="px-4 py-4 align-top">Google LLC</td>
                    <td className="px-4 py-4 align-top">
                      광고 기능·브라우저 저장소를 사용하지 않는 접속 통계 분석
                    </td>
                    <td className="px-4 py-4 align-top">
                      미국 등 Google이 운영하는 리전
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className={bodyClass}>
            국외 이전을 원하지 않는 이용자는 회원가입·뉴스레터 구독을 하지 않거나
            아래 연락처로 처리정지를 요청할 수 있습니다. 다만 클라우드 처리가
            필수인 기능은 이용이 제한될 수 있습니다. 운영 인프라나 수탁자가
            변경되면 이 방침을 갱신합니다.
          </p>
        </section>

        <section id="destruction" className={sectionClass}>
          <h2 className={headingClass}>5. 개인정보의 파기 절차와 방법</h2>
          <p className={bodyClass}>
            보유기간이 끝나거나 처리 목적이 달성되면 지체 없이 개인정보를
            파기합니다. 관계 법령에 따라 보존해야 하는 정보는 별도 저장한 뒤 해당
            기간이 끝나면 파기합니다. 전자 파일은 복구하기 어려운 방법으로
            삭제하고, 출력물이 있는 경우 분쇄하거나 소각합니다. 백업본은 정해진
            백업 순환 주기에 따라 안전하게 삭제될 때까지 접근을 제한합니다.
          </p>
        </section>

        <section id="rights" className={sectionClass}>
          <h2 className={headingClass}>6. 이용자의 권리와 행사 방법</h2>
          <p className={bodyClass}>
            이용자와 법정대리인은 개인정보의 열람, 정정·삭제, 처리정지, 동의 철회
            및 회원 탈퇴를 요청할 수 있습니다. 아래 개인정보 문의 연락처로 요청하면
            본인 또는 정당한 대리인인지 확인한 뒤 법령에서 정한 기간 안에 처리
            결과를 안내합니다. 다른 법령에서 보존을 요구하거나 타인의 권리를
            침해할 우려가 있는 경우에는 일부 요청이 제한될 수 있으며 그 사유를
            설명합니다.
          </p>
        </section>

        <section id="security" className={sectionClass}>
          <h2 className={headingClass}>7. 개인정보의 안전성 확보 조치</h2>
          <ul className={`${bodyClass} list-disc space-y-2 pl-5`}>
            <li>비밀번호 단방향 해시와 전송 구간 암호화</li>
            <li>업무상 필요한 최소 인원에게만 데이터 접근 권한 부여</li>
            <li>관리자 인증, 비밀정보의 환경변수 분리, 접근·오류 기록 점검</li>
            <li>수탁자와 클라우드 서비스의 보안 설정 및 권한 정기 점검</li>
          </ul>
          <p className={bodyClass}>
            OWTI는 의료 진단 서비스가 아니며 개별 문항 응답을 계정 이력에 저장하지
            않습니다. 법령상 별도 동의가 필요한 민감정보를 처리하게 되는 경우에는
            해당 항목과 목적을 구분해 안내하고 필요한 동의를 받습니다.
          </p>
        </section>

        <section id="contact" className={sectionClass}>
          <h2 className={headingClass}>8. 개인정보 보호책임자와 권익침해 구제</h2>
          <div className="rounded-2xl border border-border bg-card p-6 text-sm leading-7 text-muted-foreground sm:text-base">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
              <dt className="font-medium text-foreground">개인정보처리자</dt>
              <dd>{operatorName}</dd>
              <dt className="font-medium text-foreground">보호책임자/담당자</dt>
              <dd>{officerName}</dd>
              <dt className="font-medium text-foreground">이메일</dt>
              <dd>
                {contactEmail ? (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-accent underline underline-offset-4"
                  >
                    {contactEmail}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">
                    운영 전 PRIVACY_CONTACT_EMAIL 설정 필요
                  </span>
                )}
              </dd>
              {contactPhone ? (
                <>
                  <dt className="font-medium text-foreground">전화번호</dt>
                  <dd>{contactPhone}</dd>
                </>
              ) : null}
              {contactAddress ? (
                <>
                  <dt className="font-medium text-foreground">주소</dt>
                  <dd>{contactAddress}</dd>
                </>
              ) : null}
            </dl>
          </div>
          <p className={bodyClass}>
            개인정보 침해에 관한 상담이나 구제가 필요한 경우 개인정보침해신고센터
            (국번 없이 118), 개인정보분쟁조정위원회(1833-6972), 또는
            <a
              href="https://www.privacy.go.kr"
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-accent underline underline-offset-4"
            >
              개인정보 포털
            </a>
            을 이용할 수 있습니다.
          </p>
        </section>

        <section id="changes" className={sectionClass}>
          <h2 className={headingClass}>9. 개인정보 처리방침의 변경</h2>
          <p className={bodyClass}>
            이 방침을 변경하는 경우 시행일 전에 웹사이트 또는 앱을 통해 알립니다.
            이용자의 권리에 중대한 영향을 주는 변경은 적용 전에 알아보기 쉽게
            별도로 안내합니다.
          </p>
          <div className="rounded-xl bg-muted px-5 py-4 text-sm text-muted-foreground">
            <p>현재 버전: 2026.09.05 — 최초 제정</p>
          </div>
        </section>
      </div>
    </article>
  );
}
