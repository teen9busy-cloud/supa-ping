const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 등록된 Supabase 프로젝트 목록 구성
const targets = [
  {
    name: '시모니 1.0 (Simony)',
    url: process.env.SIMONY_URL,
    key: process.env.SIMONY_KEY,
    tables: ['regions', 'forms', 'survey_questions']
  },
  {
    name: '경남 학생정신건강전담센터 (Student Center)',
    url: process.env.STUDENT_URL,
    key: process.env.STUDENT_KEY,
    tables: ['smhc_clients', 'smhc_psych_tests']
  }
];

// 레거시 SUPABASE_URL이 별도로 있을 경우 추가 (단, 이미 등록된 URL과 다를 때만)
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  const isDuplicate = targets.some(t => t.url && t.url.trim() === process.env.SUPABASE_URL.trim());
  if (!isDuplicate) {
    targets.push({
      name: '기본 등록 프로젝트 (Legacy)',
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_ANON_KEY,
      tables: ['clients']
    });
  }
}

async function pingProject(target) {
  if (!target.url || !target.key) {
    console.warn(`⚠️ [${target.name}] URL 또는 KEY가 설정되지 않아 건너뜁니다.`);
    return { name: target.name, success: false, message: 'Missing credentials' };
  }

  console.log(`\n======================================================`);
  console.log(`🚀 [${target.name}] 핑(Keep-Alive) 점검 시작...`);
  console.log(`🌐 엔드포인트: ${target.url}`);

  try {
    const supabase = createClient(target.url, target.key, {
      auth: { persistSession: false }
    });

    let overallSuccess = false;
    let details = [];

    for (const table of target.tables) {
      try {
        const { data, error, status, statusText } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.warn(`  - [테이블 ${table}] 응답 에러 (status: ${status}): ${error.message}`);
          details.push(`${table}: error (${error.message})`);
        } else {
          const rowCount = data ? data.length : 0;
          console.log(`  - [테이블 ${table}] 조회 성공! 반환 행 수: ${rowCount}`);
          details.push(`${table}: OK (${rowCount} rows)`);
          overallSuccess = true;
        }
      } catch (tableErr) {
        console.warn(`  - [테이블 ${table}] 예외 발생: ${tableErr.message}`);
        details.push(`${table}: exception (${tableErr.message})`);
      }
    }

    if (overallSuccess) {
      console.log(`✅ [${target.name}] 핑 성공! 활성 상태 유지 완료.`);
      return { name: target.name, success: true, details: details.join(', ') };
    } else {
      console.error(`❌ [${target.name}] 모든 대상 테이블 조회 실패.`);
      return { name: target.name, success: false, details: details.join(', ') };
    }
  } catch (err) {
    console.error(`❌ [${target.name}] 클라이언트 연결 실패:`, err.message);
    return { name: target.name, success: false, message: err.message };
  }
}

async function run() {
  console.log(`⚡ Supabase Multi-Project Keep-Alive 실행 시작 (${new Date().toISOString()})`);
  const results = [];

  for (const target of targets) {
    const res = await pingProject(target);
    results.push(res);
  }

  console.log(`\n======================================================`);
  console.log(`📊 최종 핑 결과 요약:`);
  let hasFailure = false;
  for (const r of results) {
    const mark = r.success ? '✅' : '❌';
    console.log(`${mark} ${r.name}: ${r.success ? '성공' : '실패'} (${r.details || r.message})`);
    if (!r.success && r.message !== 'Missing credentials') {
      hasFailure = true;
    }
  }

  // STATUS.md 생성 (최근 실행 기록 및 60일 깃허브 액션 중단 방지용)
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  let statusMd = `# Supabase Multi-Ping Status\n\n`;
  statusMd += `> 자동 핑 시스템이 정상 작동 중입니다. (매일 2회 정기 점검)\n\n`;
  statusMd += `**마지막 점검 시각:** \`${nowStr}\`\n\n`;
  statusMd += `| 프로젝트명 | 상태 | 세부 정보 |\n`;
  statusMd += `| :--- | :---: | :--- |\n`;
  for (const r of results) {
    const mark = r.success ? '🟢 정상 (Active)' : '🔴 확인 필요';
    statusMd += `| **${r.name}** | ${mark} | ${r.details || r.message} |\n`;
  }
  statusMd += `\n*본 파일은 GitHub Actions의 60일 미활동 자동 비활성화를 방지하기 위해 정기 업데이트됩니다.*\n`;

  fs.writeFileSync('STATUS.md', statusMd, 'utf8');
  console.log(`📝 STATUS.md 갱신 완료.`);

  if (hasFailure) {
    console.error(`\n❌ 하나 이상의 활성 프로젝트 핑에 실패했습니다.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 모든 활성 프로젝트의 핑이 성공적으로 완료되었습니다.`);
  }
}

run();
