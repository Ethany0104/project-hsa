// comment-cleanup.js
// 이 스크립트는 지정된 디렉토리와 그 하위의 모든 .js 파일에서
// 특정 패턴의 주석을 제거하는 Node.js 스크립트입니다.

const fs = require('fs');
const path = require('path');

// --- 설정 (Configuration) ---
// 스크립트를 실행할 루트 디렉토리를 지정합니다.
// 이 스크립트 파일이 프로젝트 루트에 있다면 '.'으로 설정하세요.
const rootDirectory = './src'; 

// 제거할 주석의 정규식 패턴 목록입니다.
const commentPatterns = [
    /\/\/ \[롤백\].*?\r?\n/g,         // 예: // [롤백] useStoryStore 대신 ...
    /\/\/ \[경로 수정\].*?\r?\n/g,       // 예: // [경로 수정] ../../../ -> ../../
    /\/\*\*?\s*\[롤백\].*?\*\/\s*\r?\n?/gs, // 예: /** [롤백] ... */
];

// --- 로직 (Logic) ---

/**
 * 지정된 디렉토리부터 시작하여 모든 파일을 재귀적으로 탐색하는 함수
 * @param {string} dir - 탐색을 시작할 디렉토리 경로
 * @returns {string[]} 발견된 모든 파일의 경로 배열
 */
function getAllFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            // node_modules 와 같은 불필요한 디렉토리는 건너뜁니다.
            if (file !== 'node_modules') {
                results = results.concat(getAllFiles(filePath));
            }
        } else {
            results.push(filePath);
        }
    });
    return results;
}

/**
 * 단일 파일에서 지정된 패턴의 주석을 제거하는 함수
 * @param {string} filePath - 처리할 파일의 경로
 */
function cleanupFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // 모든 주석 패턴을 순회하며 제거합니다.
        commentPatterns.forEach(pattern => {
            content = content.replace(pattern, '');
        });

        // 변경사항이 있을 경우에만 파일을 다시 씁니다.
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ [정리 완료] ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ [오류 발생] ${filePath} 처리 중 오류:`, error);
    }
}

// --- 실행 (Execution) ---

function run() {
    console.log(`'${rootDirectory}' 디렉토리에서 주석 정리를 시작합니다...`);

    // 모든 .js 파일 목록을 가져옵니다.
    const allFiles = getAllFiles(rootDirectory);
    const jsFiles = allFiles.filter(file => file.endsWith('.js'));

    if (jsFiles.length === 0) {
        console.log('정리할 JavaScript 파일이 없습니다.');
        return;
    }

    console.log(`총 ${jsFiles.length}개의 JavaScript 파일을 대상으로 작업을 수행합니다.`);

    // 각 파일을 순회하며 정리 함수를 실행합니다.
    jsFiles.forEach(cleanupFile);

    console.log('\n✨ 모든 작업이 완료되었습니다.');
}

// 스크립트를 실행합니다.
run();

/*
--- 사용 방법 (How to Run) ---
1. 이 파일을 프로젝트의 루트 디렉토리에 `comment-cleanup.js` 라는 이름으로 저장하세요.
2. `rootDirectory` 변수를 당신의 소스 코드가 있는 디렉토리(예: './src')로 맞게 수정하세요.
3. 터미널을 열고 다음 명령어를 실행하세요:
   node comment-cleanup.js
4. 스크립트가 실행되면서 정리된 파일 목록이 콘솔에 출력됩니다.

--- 주의사항 ---
- 이 스크립트는 파일을 직접 수정합니다.
- 만약을 위해 스크립트 실행 전에 Git으로 현재 상태를 커밋하거나 파일을 백업해두는 것을 강력히 권장합니다.
*/
