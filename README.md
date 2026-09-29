# Supabase Multi-Project Keep-Alive System 🚀

Supabase Free Tier 프로젝트들의 7일 자동 일시정지(Pause)를 방지하기 위해 정기적으로 실제 데이터 조회를 수행하는 자동 핑(Keep-Alive) 시스템입니다.

## 🎯 주요 기능
- **멀티 프로젝트 자동 순회**: 시모니 1.0(`Simony`), 경남 학생정신건강전담센터(`Student Center`) 등 복수 프로젝트 지원
- **실제 PostgreSQL DB 쿼리**: RLS 빈 배열 반환을 방지하고 실제 활성 테이블(`regions`, `forms`, `smhc_clients` 등)의 레코드를 조회하여 안정적인 DB 활동 인정
- **1일 2회 정기 점검**: UTC 00:00, 12:00 (한국 시간 오전 9시, 오후 9시) 자동 실행
- **GitHub Actions 60일 자동 중단 방지**: 주기적으로 `STATUS.md`를 자동 갱신하여 깃허브의 비활동 비활성화 정책 우회

## 📊 현재 상태
최신 핑 결과는 [STATUS.md](./STATUS.md) 파일에서 확인하실 수 있습니다.