const fs = require('fs'); // 파일 시스템 모듈
const path = require('path'); // 경로 모듈

const srcDir = path.resolve(__dirname, 'src'); // src 폴더 경로
const outputFilePath = path.resolve(__dirname, '.combined_project-hsa.js'); // 결과 파일 경로
let combinedContent = ''; // 합쳐질 내용을 저장할 변수

console.log(`[Script] Starting to combine .js files from: ${srcDir}`);

// 폴더를 재귀적으로 탐색하는 함수
function readFilesRecursively(directory) {
  const files = fs.readdirSync(directory); // 해당 폴더의 파일/폴더 목록 읽기

  files.forEach(file => {
    const filePath = path.join(directory, file); // 파일/폴더의 전체 경로
    const stat = fs.statSync(filePath); // 파일/폴더 정보 가져오기

    if (stat.isDirectory()) {
      // 폴더인 경우, 재귀적으로 다시 탐색
      readFilesRecursively(filePath);
    } else if (stat.isFile() && file.endsWith('.js')) {
      // .js 파일인 경우, 내용을 읽어서 합치기
      console.log(`[Script] Reading file: ${filePath}`);
      const fileContent = fs.readFileSync(filePath, 'utf8'); // 파일 내용 읽기
      
      // 각 파일의 시작을 구분하기 위한 주석 추가 (선택 사항)
      combinedContent += `\n\n// --- Start of file: ${path.relative(srcDir, filePath)} ---\n\n`;
      combinedContent += fileContent; // 내용 추가
      combinedContent += `\n\n// --- End of file: ${path.relative(srcDir, filePath)} ---\n\n`;
    }
  });
}

try {
  // src 폴더 탐색 시작
  readFilesRecursively(srcDir);

  // 합쳐진 내용을 새로운 파일에 쓰기
  fs.writeFileSync(outputFilePath, combinedContent, 'utf8');
  console.log(`[Script] All .js files combined successfully into: ${outputFilePath}`);
  console.log(`[Script] Total combined content length: ${combinedContent.length} characters.`);
} catch (error) {
  console.error(`[Script] An error occurred:`, error);
}
