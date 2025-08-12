// src/components/forge/builtinTools.js

// 내장 프리셋 ISC(Interactive Storytelling Component) 데이터를 정의하고 export합니다.
export const BUILTIN_TOOLS = [
  { 
    id: 'builtin_stat_check', 
    type: 'component', 
    name: 'builtin:StatCheckModal', 
    description: 'TRPG 스타일의 능력치 판정을 수행하는 모달을 표시합니다.', 
    params: '{ "title": "string", "description": "string", "stat": "string", "difficulty": "number", "modifier": "number" }', 
    htmlCode: `<div id="modal-backdrop" class="fixed inset-0 bg-black/80 flex justify-center items-center font-sans">
  <div id="modal-content" class="bg-gray-800 border border-purple-700 rounded-xl shadow-2xl w-full max-w-md p-8 m-4 text-white">
    <h2 id="modal-title" class="text-3xl font-bold text-center mb-6 text-purple-400">능력치 판정</h2>
    <div id="modal-body" class="text-center">
      <p id="modal-description" class="text-gray-400 mb-4">운명의 주사위를 굴립니다.</p>
      <div class="bg-gray-900/50 p-4 rounded-lg mb-8">
        <p id="stat-line" class="text-2xl font-bold"><span class="text-cyan-400">민첩</span> 판정</p>
        <p id="difficulty-line" class="text-sm text-gray-400">목표치: 15 / 보정치: +2</p>
      </div>
      <button id="roll-button" class="px-8 py-4 bg-purple-600 text-white text-xl font-bold rounded-lg hover:bg-purple-500 transition-colors">
        판정 시작
      </button>
    </div>
  </div>
</div>`, 
    cssCode: `/* Tailwind CSS가 기본 적용됩니다. 추가적인 스타일링이 필요하면 여기에 작성하세요. */`, 
    jsCode: `const rollButton = document.getElementById('roll-button');
const modalBody = document.getElementById('modal-body');

rollButton.addEventListener('click', () => {
  modalBody.innerHTML = '<p class="text-xl text-gray-300 mb-4">주사위를 굴립니다...</p><p class="text-8xl font-bold text-white animate-pulse">?</p>';
  
  setTimeout(() => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + 2; // 예시 보정치 +2
    const success = total >= 15; // 예시 목표치 15
    
    modalBody.innerHTML = \`
      <p class="text-lg text-gray-400 mb-2">판정 결과</p>
      <p class="text-6xl font-bold \${success ? 'text-green-400' : 'text-red-400'}">\${success ? '성공' : '실패'}</p>
      <div class="bg-gray-900/50 p-3 rounded-lg text-lg mt-4">
        <p>
          <span class="font-bold text-cyan-400">\${roll}</span> (1d20) + 
          <span class="font-bold text-yellow-400">2</span> (보정치) = 
          <span class="font-bold text-xl text-white">\${total}</span>
        </p>
      </div>
      <button onclick="document.getElementById('modal-backdrop').remove()" class="mt-8 px-6 py-2 bg-gray-600 rounded-lg">닫기</button>
    \`;
  }, 1500);
});`, 
    isBuiltIn: true 
  },
  { 
    id: 'builtin_choice_selector', 
    type: 'component', 
    name: 'builtin:ChoiceSelector', 
    description: '사용자에게 여러 선택지를 제시하고 선택을 받습니다.', 
    params: '{ "title": "string", "description": "string", "choices": "Array<{id: string, label: string}>" }', 
    htmlCode: `<div id="choice-container" class="bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg w-full max-w-2xl mx-auto p-6 font-sans">
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-purple-400">선택의 시간</h2>
    <p class="text-gray-400 mt-2">어떤 길을 선택하시겠습니까?</p>
  </div>
  <div class="space-y-3">
    <button data-choice-id="path_a" class="choice-button w-full px-6 py-4 bg-gray-700 text-white text-lg rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">A. 동쪽 숲으로 들어간다.</button>
    <button data-choice-id="path_b" class="choice-button w-full px-6 py-4 bg-gray-700 text-white text-lg rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">B. 북쪽 산맥을 넘는다.</button>
    <button data-choice-id="path_c" class="choice-button w-full px-6 py-4 bg-gray-700 text-white text-lg rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">C. 서쪽 강을 따라간다.</button>
  </div>
</div>`, 
    cssCode: ``, 
    jsCode: `const buttons = document.querySelectorAll('.choice-button');
const container = document.getElementById('choice-container');

// 피드백 메시지를 표시할 엘리먼트를 생성합니다.
const feedbackEl = document.createElement('p');
feedbackEl.className = 'text-center text-green-400 mt-6 text-lg transition-opacity duration-300 opacity-0';
container.appendChild(feedbackEl);

buttons.forEach(button => {
  button.addEventListener('click', () => {
    const choiceId = button.getAttribute('data-choice-id');
    // 실제 앱에서는 이 결과가 상위로 전달됩니다.
    console.log('선택된 ID:', choiceId); 
    
    // alert() 대신 생성한 엘리먼트의 텍스트를 변경합니다.
    feedbackEl.innerText = '당신은 "' + button.innerText + '"를 선택했습니다.';
    feedbackEl.style.opacity = 1;

    // 모든 버튼을 비활성화하고, 선택된 버튼을 강조 표시합니다.
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('hover:bg-purple-600');
    });
    button.classList.remove('bg-gray-700');
    button.classList.add('bg-purple-700', 'ring-2', 'ring-purple-400');
  });
});`
, 
    isBuiltIn: true 
  },
    { 
    id: 'builtin_inventory_card', 
    type: 'component', 
    name: 'builtin:InventoryCard', 
    description: '인물의 소지품 목록을 카드로 보여줍니다.', 
    params: '{ "title": "string", "characterName": "string", "items": "Array<{id: string, name: string, description: string}>" }', 
    htmlCode: `<div class="bg-gray-800/70 border border-yellow-700/50 rounded-xl shadow-lg w-full max-w-md mx-auto font-sans backdrop-blur-sm">
  <div class="p-4 border-b border-gray-700">
    <h2 class="text-xl font-bold text-yellow-400">한세아의 소지품</h2>
  </div>
  <div class="p-4 max-h-96 overflow-y-auto">
    <ul class="space-y-4">
      <li class="flex items-start space-x-4 p-3 bg-gray-900/50 rounded-lg">
        <div class="w-16 h-16 bg-gray-700 rounded-md flex-shrink-0 flex items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M21 14v2a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16v-2"/><path d="M3 10v4"/><path d="M21 10v4"/><path d="m7.5 15.5 9-5.5"/><path d="m21 8-9 5.5-9-5.5"/><path d="M12 22V12"/></svg>
        </div>
        <div>
          <h3 class="font-bold text-lg text-white">낡은 만년필</h3>
          <p class="text-sm text-gray-400 mt-1">아버지의 유품. 중요한 계약서에만 사용한다.</p>
        </div>
      </li>
      <li class="flex items-start space-x-4 p-3 bg-gray-900/50 rounded-lg">
        <div class="w-16 h-16 bg-gray-700 rounded-md flex-shrink-0 flex items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
        </div>
        <div>
          <h3 class="font-bold text-lg text-white">스마트폰</h3>
          <p class="text-sm text-gray-400 mt-1">최신 기종. 업무용 연락과 개인적인 용무로 항상 손에 쥐고 있다.</p>
        </div>
      </li>
    </ul>
  </div>
</div>`, 
    cssCode: ``, 
    jsCode: `// 이 컴포넌트는 주로 정보 표시용이므로, 특별한 JS 로직은 필요하지 않을 수 있습니다.
// 아이템을 클릭했을 때 상세 정보를 보여주는 등의 상호작용을 추가할 수 있습니다.
console.log('인벤토리 카드가 렌더링되었습니다.');`, 
    isBuiltIn: true 
  },
  { 
    id: 'builtin_damage_calculator', 
    type: 'logic', 
    name: 'builtin:calculateDamage', 
    description: '기본 전투 데미지를 계산합니다.', 
    params: '{ "attackerPower": "number", "defenderDefense": "number", "isCritical": "boolean" }', 
    jsCode: `// AI는 이 함수의 실행을 요청하고, 결과(return 값)를 다음 서술에 활용합니다.
function execute(params) {
  const {
    attackerPower = 10,
    defenderDefense = 5,
    isCritical = false
  } = params;

  // 기본 데미지 계산 (최소 1의 피해는 보장)
  let baseDamage = Math.max(1, attackerPower - defenderDefense);

  // 치명타 보너스 적용
  if (isCritical) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }
  
  // 이 객체가 AI에게 반환됩니다.
  return {
    damageDealt: baseDamage,
    isFatal: false, // 실제로는 방어자의 체력을 알아야 계산 가능
  };
}`, 
    isBuiltIn: true 
  },
  { 
    id: 'builtin_loot_generator', 
    type: 'logic', 
    name: 'builtin:randomLootGenerator', 
    description: '아이템 테이블에 따라 랜덤 아이템을 생성합니다.', 
    params: '{ "itemTable": "Array<{id: string, name: string, weight: number}>" }', 
    jsCode: `function execute(params) {
  const {
    itemTable = [
      { id: 'potion', name: '하급 체력 물약', weight: 70 },
      { id: 'elixir', name: '비밀의 영약', weight: 5 },
      { id: 'sword', name: '녹슨 롱소드', weight: 25 },
    ]
  } = params;

  if (itemTable.length === 0) {
    return { acquiredItem: null, error: "아이템 테이블이 비어있습니다." };
  }

  const totalWeight = itemTable.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (totalWeight <= 0) {
    return { acquiredItem: null, error: "아이템 테이블의 총 가중치가 0 이하입니다." };
  }

  const randomValue = Math.random() * totalWeight;

  let weightSum = 0;
  for (const item of itemTable) {
    weightSum += item.weight || 0;
    if (randomValue <= weightSum) {
      return { acquiredItem: { id: item.id, name: item.name } };
    }
  }
  // 만약을 대비한 fallback
  return { acquiredItem: { id: itemTable[0].id, name: itemTable[0].name } };
}`, 
    isBuiltIn: true 
  },
    { 
    id: 'builtin_relationship_updater', 
    type: 'logic', 
    name: 'builtin:updateRelationship', 
    description: '두 인물 간의 관계 수치를 변경하는 명령을 생성합니다.', 
    params: '{ "characterId": "string", "targetId": "string", "changeAmount": "number", "reason": "string" }', 
    jsCode: `function execute(params) {
  const {
    characterId,
    targetId,
    changeAmount = 0,
    reason = "알 수 없는 이유"
  } = params;

  if (!characterId || !targetId) {
    return { error: "주체(characterId)와 대상(targetId)이 모두 필요합니다." };
  }

  // 이 스크립트는 실제 데이터를 직접 수정하지 않습니다.
  // 대신, 어떤 관계가 어떻게 변해야 하는지에 대한 '명령'을 생성하여 반환합니다.
  // 이 결과를 받은 시스템이 실제 캐릭터 상태를 업데이트하는 책임을 집니다.
  
  console.log(\`[Logic] 관계 변화: \${characterId} -> \${targetId} (\${changeAmount > 0 ? '+' : ''}\${changeAmount}) 이유: \${reason}\`);

  return {
    characterId,
    targetId,
    changeAmount,
    reason,
    message: \`\${characterId}와 \${targetId}의 관계가 \${changeAmount}만큼 변했습니다.\`
  };
}`, 
    isBuiltIn: true 
  },
];
