const th = "border border-border-default bg-background-subtle px-3 py-2 text-left font-semibold text-text-secondary";
const td = "border border-border-default px-3 py-2 text-text-secondary";
const pre = "text-sm text-text-secondary tracking-tight leading-5.5 whitespace-pre-wrap";

const BehavioralContent = () => (
  <div className="text-sm text-text-secondary tracking-tight leading-5.5 space-y-3">
    <pre className={pre}>{`ToneFit 행태정보 수집·이용 고지
ToneFit(이하 "서비스")은 「개인정보 보호법」 및 개인정보보호위원회·한국인터넷진흥원(KISA)의 「온라인 맞춤형 광고 개인정보보호 가이드라인」에 따라, 서비스 이용 과정에서 발생하는 행태정보의 수집·이용 현황과 이용자의 통제권 행사 방법을 다음과 같이 알려드립니다.

운영자: 김성식 (개인 개인정보처리자, 비사업자)
시행일: 2026년 6월 3일


1. 행태정보란
"행태정보"란 이용자가 서비스를 이용하는 과정에서 생성되는 서비스 이용기록, 방문기록 등 이용자의 관심·성향·이용 형태를 나타내는 정보를 말합니다.


2. 수집하는 행태정보 항목 및 수집 방법`}</pre>
    <table className="w-full border-collapse">
      <tbody>
        <tr>
          <th className={th}>구분</th>
          <th className={th}>내용</th>
        </tr>
        <tr>
          <td className={td}>수집 항목</td>
          <td className={td}>웹/앱 서비스 이용기록 (기능 사용 내역, 화면 이동·이벤트 발생 기록 등)</td>
        </tr>
        <tr>
          <td className={td}>수집 방법</td>
          <td className={td}>이용자가 서비스를 이용할 때 분석 도구(SDK·스크립트)를 통해 자동 수집</td>
        </tr>
      </tbody>
    </table>
    <pre className={pre}>{`서비스는 위 항목 외의 행태정보(검색기록, 구매기록, 기기·광고식별자 등)는 수집하지 않습니다. 추가 항목을 수집하게 될 경우 본 고지를 갱신하고 사전에 안내합니다.


3. 행태정보 수집·이용 목적
서비스는 행태정보를 다음 목적으로만 수집·이용합니다.

서비스 이용 현황 분석 및 통계 산출
기능 사용성 측정 및 서비스·교정 품질 개선

맞춤형 광고 관련 안내 현재 서비스는 행태정보를 이용한 온라인 맞춤형 광고를 시행하지 않습니다. 또한 행태정보를 광고 목적으로 외부 광고 플랫폼에 전송하지 않습니다. 향후 맞춤형 광고를 도입하거나 행태정보를 광고 목적으로 제3자에게 전송하게 될 경우, 그 항목·목적·제3자·거부 방법을 사전에 고지하고 필요한 동의를 받겠습니다.


4. 행태정보를 수집·처리하는 자 (수탁자)`}</pre>
    <table className="w-full border-collapse">
      <tbody>
        <tr>
          <th className={th}>수집·처리 주체</th>
          <th className={th}>처리 업무</th>
          <th className={th}>비고</th>
        </tr>
        <tr>
          <td className={td}>Amplitude, Inc.</td>
          <td className={td}>서비스 이용 통계 분석</td>
          <td className={td}>행태정보는 비식별·가명 처리된 형태로 처리되며, 미국으로 이전됩니다.</td>
        </tr>
      </tbody>
    </table>
    <pre className={pre}>{`위탁 및 국외 이전에 관한 상세 내용은 「ToneFit 개인정보처리방침」 제6조(처리의 위탁) 및 제7조(국외 이전)를 참고하시기 바랍니다.


5. 행태정보의 보유·이용 기간 및 파기
수집된 행태정보는 분석 목적 달성 시까지 또는 분석 도구 위탁계약 종료 시까지 보유한 후 파기합니다.
보유 기간이 경과하거나 처리 목적이 달성된 경우 복구·재생이 불가능한 방법으로 지체 없이 파기합니다.


6. 이용자의 통제권 및 행사 방법
이용자는 행태정보의 수집·이용에 대한 통제권을 행사할 수 있습니다.

웹 브라우저 쿠키 설정을 통한 차단
브라우저 설정 → 개인정보 보호 및 보안 → 쿠키 차단/삭제
분석 도구 수집 거부
분석 도구가 제공하는 수집 거부(Opt-out) 수단을 통해 행태정보 수집을 거부할 수 있습니다.
행태정보 수집을 거부하더라도 서비스의 기본 이용에는 제한이 없습니다. 다만 일부 사용성 개선이 제한될 수 있습니다.

행태정보 관련 문의나 통제권 행사 요청은 아래 개인정보 보호책임자에게 하실 수 있습니다.`}</pre>
  </div>
);

export default BehavioralContent;
