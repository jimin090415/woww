const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cabinet = document.getElementById('gameCabinet');

let score = 0;
let time = 60;
let timer;
let selectedDifficulty = 'normal';

let totalShots = 0;
let successfulShots = 0; // 여기서는 맞춘 정답 수 개수

// 물리 환경 설정
const gravity = 0.22;
const baseSpringX = 315; 
const baseSpringY = 390;

let ball = { x: baseSpringX, y: baseSpringY, vx: 0, vy: 0, radius: 11, isLaunched: false, color: '#ff4757' };
let spring = { x: baseSpringX, y: baseSpringY, dragStartX: 0, dragStartY: 0, offsetX: 0, offsetY: 0, isDragging: false };

// 위쪽에 일렬로 배치된 정답 구멍 4개 (Y축을 75로 통일)
let holes = [
  { x: 45,  y: 75, r: 24, val: 0, color: '#ff4757' },
  { x: 115, y: 75, r: 24, val: 0, color: '#2ed573' },
  { x: 185, y: 75, r: 24, val: 0, color: '#1e90ff' },
  { x: 255, y: 75, r: 24, val: 0, color: '#ffa502' }
];

let currentAnswer = 0; // 현재 문제의 실제 정답

function startGame(difficulty) {
  selectedDifficulty = difficulty;
  score = 0;
  time = 60;
  totalShots = 0;
  successfulShots = 0;

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('playScreen').classList.remove('hidden');
  document.getElementById('score').textContent = score;
  
  makeNewQuestion();
  initEventListeners();
  
  timer = setInterval(() => {
    time--;
    document.getElementById('time').textContent = time;
    
    const percent = (time / 60) * 100;
    document.getElementById('timeBar').style.width = percent + '%';

    if (time <= 0) endGame();
  }, 1000);

  requestAnimationFrame(update);
}

// 수학 문제 실시간 랜덤 출제기
function makeNewQuestion() {
  let num1, num2, symbol;
  
  if (selectedDifficulty === 'easy') {
    num1 = Math.floor(Math.random() * 20) + 5;
    num2 = Math.floor(Math.random() * 20) + 1;
    symbol = '+';
    currentAnswer = num1 + num2;
  } else if (selectedDifficulty === 'normal') {
    if (Math.random() > 0.5) {
      num1 = Math.floor(Math.random() * 30) + 10;
      num2 = Math.floor(Math.random() * 20) + 5;
      symbol = '+';
      currentAnswer = num1 + num2;
    } else {
      num1 = Math.floor(Math.random() * 40) + 15;
      num2 = Math.floor(Math.random() * 14) + 1;
      symbol = '-';
      currentAnswer = num1 - num2;
    }
  } else { // hard (구구단 곱셈)
    num1 = Math.floor(Math.random() * 8) + 2; // 2~9단
    num2 = Math.floor(Math.random() * 9) + 1; 
    symbol = '×';
    currentAnswer = num1 * num2;
  }

  // 문제 화면 출력
  document.getElementById('questionBox').textContent = `${num1} ${symbol} ${num2} = ?`;

  // 4개의 구멍 중 하나에 정답을 무작위 배정하고 나머지는 오답 주입
  let correctHoleIndex = Math.floor(Math.random() * 4);
  let usedValues = [currentAnswer];

  for (let i = 0; i < 4; i++) {
    if (i === correctHoleIndex) {
      holes[i].val = currentAnswer;
    } else {
      let wrongVal;
      // 정답 주변의 그럴싸한 가짜 오답 만들기
      do {
        let diff = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
        wrongVal = currentAnswer + diff;
      } while (wrongVal < 0 || usedValues.includes(wrongVal));
      
      holes[i].val = wrongVal;
      usedValues.push(wrongVal);
    }
  }
}

function resetBall() {
  ball.x = baseSpringX;
  ball.y = baseSpringY;
  ball.vx = 0;
  ball.vy = 0;
  ball.isLaunched = false;
  const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9b5de5', '#ff33aa'];
  ball.color = colors[Math.floor(Math.random() * colors.length)];
}

function initEventListeners() {
  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', doDrag);
  canvas.addEventListener('mouseup', endDrag);

  canvas.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
  canvas.addEventListener('touchmove', (e) => doDrag(e.touches[0]));
  canvas.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  if (ball.isLaunched) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (mx > 270 && my > 320) {
    spring.isDragging = true;
    spring.dragStartX = mx;
    spring.dragStartY = my;
  }
}

function doDrag(e) {
  if (!spring.isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  let dx = mx - spring.dragStartX;
  let dy = my - spring.dragStartY;

  if (dy < 0) dy = 0; 
  if (dy > 70) dy = 70;
  if (dx < -45) dx = -45; 
  if (dx > 45) dx = 45;

  spring.offsetX = dx;
  spring.offsetY = dy;

  ball.x = baseSpringX + dx;
  ball.y = baseSpringY + dy;
}

function endDrag() {
  if (!spring.isDragging) return;
  spring.isDragging = false;

  const powerY = spring.offsetY;
  const powerX = spring.offsetX;

  if (powerY > 5 || Math.abs(powerX) > 5) {
    ball.vy = -powerY * 0.65; // 위쪽 구멍 도달률 상승을 위해 탄성력 상향
    ball.vx = -powerX * 0.45 - 1.0 - (Math.random() * 1.5);
    ball.isLaunched = true;
    totalShots++;
  }

  spring.offsetX = 0;
  spring.offsetY = 0;
  if(!ball.isLaunched) resetBall();
}

function triggerFlash(type) {
  const className = type === 'success' ? 'flash-correct' : 'flash-wrong';
  cabinet.classList.add(className);
  setTimeout(() => cabinet.classList.remove(className), 200);
}

function drawNeonHole(h) {
  // 구멍 내부
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2e2b'; 
  ctx.fill();
  
  // 구멍 테두리 선명한 네온화
  ctx.lineWidth = 4;
  ctx.strokeStyle = h.color;
  ctx.shadowColor = h.color;
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 보기가 적힌 풍선 숫자를 구멍 정중앙에 렌더링
  ctx.fillStyle = '#4a3b32';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(h.val, h.x, h.y + 5);
}

function drawCrystalStick() {
  let currentStickX = baseSpringX + spring.offsetX;
  let currentStickY = baseSpringY + spring.offsetY;

  ctx.beginPath();
  ctx.moveTo(baseSpringX, 420);
  ctx.lineTo(currentStickX, currentStickY);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#b3d9ff';
  ctx.stroke();
  
  ctx.beginPath();
  let r = 14; 
  ctx.moveTo(currentStickX, currentStickY - r);
  for (let i = 1; i <= 6; i++) {
    let angle = i * (Math.PI / 3);
    ctx.lineTo(currentStickX + r * Math.sin(angle), currentStickY - r * Math.cos(angle));
  }
  ctx.closePath();
  ctx.fillStyle = '#ff4757';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 일렬로 선 채점 구멍 렌더링
  holes.forEach(drawNeonHole);

  // 보드 곡선 가이드라인 테두리
  ctx.beginPath();
  ctx.moveTo(295, 420);
  ctx.lineTo(295, 120);
  ctx.arc(150, 120, 145, 0, Math.PI, true);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#ffcc00';
  ctx.stroke();

  // 2. 조준 점선 가이드라인
  if (spring.isDragging && (spring.offsetY > 5 || Math.abs(spring.offsetX) > 5)) {
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.moveTo(baseSpringX, baseSpringY - 20);
    let targetX = baseSpringX - spring.offsetX * 4.2;
    let targetY = baseSpringY - spring.offsetY * 4.2;
    ctx.lineTo(targetX, targetY);
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3. 레버 스틱 드로우
  drawCrystalStick();

  // 4. 탱탱볼 물리 엔진 및 수학 정오 판정
  if (ball.isLaunched) {
    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 양측 및 천장 바운스 반동
    if (ball.x - ball.radius < 5) { ball.x = 5 + ball.radius; ball.vx = -ball.vx * 0.76; }
    if (ball.x + ball.radius > 290 && ball.y > 120) { ball.x = 290 - ball.radius; ball.vx = -ball.vx * 0.76; }
    if (ball.x + ball.radius > canvas.width) { ball.x = canvas.width - ball.radius; ball.vx = -ball.vx * 0.76; }
    if (ball.y - ball.radius < 5) { ball.y = 5 + ball.radius; ball.vy = -ball.vy * 0.76; }

    // 정답 일자 구멍 충돌 체크
    holes.forEach(h => {
      let dist = Math.sqrt((ball.x - h.x)**2 + (ball.y - h.y)**2);
      if (dist < h.r - 1) {
        // 공이 들어간 구멍의 값이 진짜 정답인지 연산 검증
        if (h.val === currentAnswer) {
          score += 100; // 맞추면 대폭 100점 추가!
          successfulShots++;
          document.getElementById('feedback').textContent = `🎯 정답! 정답은 ${currentAnswer} 입니다! (+100점)`;
          triggerFlash('success');
        } else {
          score = Math.max(0, score - 30); // 틀리면 30점 감점 처리
          document.getElementById('feedback').textContent = `❌ 오답! 앗, 정답은 ${currentAnswer}였어요! (-30점)`;
          triggerFlash('fail');
        }
        
        document.getElementById('score').textContent = score;
        makeNewQuestion(); // 신규 연산 문제 출제
        resetBall();
      }
    });

    // 바닥 낙하 아웃 판정 (아무것도 못 맞추고 떨어졌을 때)
    if (ball.y > canvas.height + 20) {
      document.getElementById('feedback').textContent = '구멍에 넣지 못했어요! 다시 조준해 보세요 😢';
      triggerFlash('fail');
      resetBall();
    }
  }

  // 5. 주인공 탱탱볼 드로잉
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  if (time > 0) requestAnimationFrame(update);
}

function endGame() {
  clearInterval(timer);
  document.getElementById('playScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.remove('hidden');
  
  // 성공률 = 정답 맞춘 횟수 / 쏜 횟수 비율 계산
  let accuracyPercent = totalShots > 0 ? Math.round((successfulShots / totalShots) * 100) : 0;
  
  let diffText = '🌸 더하기 모드';
  if(selectedDifficulty === 'normal') diffText = '🍊 덧뺄셈 혼합 모드';
  if(selectedDifficulty === 'hard') diffText = '🍇 구구단 곱셈 모드';

  document.getElementById('finalDifficulty').textContent = diffText;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('totalCount').textContent = successfulShots;
  document.getElementById('accuracy').textContent = accuracyPercent + '%';
}
