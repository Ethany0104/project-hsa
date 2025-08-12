// src/components/forge/SandboxPreview.js
import React, { useMemo } from 'react';

/**
 * 사용자 코드를 안전한 iframe 내에서 렌더링하는 샌드박스 컴포넌트입니다.
 * @param {object} props - { htmlCode, cssCode, jsCode }
 */
const SandboxPreview = ({ htmlCode, cssCode, jsCode }) => {
  
  // html, css, js 코드가 변경될 때만 iframe 내용을 다시 계산합니다.
  const iframeSrcDoc = useMemo(() => {
    return `
      <html>
        <head>
          <style>
            ${cssCode}
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${htmlCode}
          <script>
            try {
              ${jsCode}
            } catch (e) {
              console.error(e);
            }
          </script>
        </body>
      </html>
    `;
  }, [htmlCode, cssCode, jsCode]);

  return (
    <div className="w-full h-full bg-black rounded-md overflow-hidden border border-[var(--border-primary)]">
      <iframe
        srcDoc={iframeSrcDoc}
        title="Sandbox Preview"
        sandbox="allow-scripts allow-modals" // 보안을 위해 권한을 제한합니다.
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default SandboxPreview;
