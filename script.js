// ==========================================
// ESTADO E DADOS INICIAIS (MOCK DATA)
// ==========================================
const DEFAULT_STUDENTS = [
  { id: '1', nome: 'Ana Clara Silva', matricula: '2026-001', turma: '9º Ano A' },
  { id: '2', nome: 'Bruno Oliveira', matricula: '2026-002', turma: '9º Ano A' },
  { id: '3', nome: 'Carla Souza', matricula: '2026-003', turma: '9º Ano B' },
  { id: '4', nome: 'Diego Santos', matricula: '2026-004', turma: '9º Ano B' },
  { id: '5', nome: 'Elena Rostova', matricula: '2026-005', turma: '1º Ano EM' },
  { id: '6', nome: 'Felipe Mendes', matricula: '2026-006', turma: '1º Ano EM' },
  { id: '7', nome: 'Gabriela Lima', matricula: '2026-007', turma: '2º Ano EM' },
  { id: '8', nome: 'Heitor Castro', matricula: '2026-008', turma: '2º Ano EM' },
];

const DEFAULT_CARDAPIO = {
  prato: 'Strogonoff de Frango com Arroz e Salada',
  acompanhamentos: 'Arroz branco soltinho, Feijão carioca temperado, Batata palha crocante e Salada de alface e tomate.',
  img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
};

// Estrutura em memória / LocalStorage
let students = JSON.parse(localStorage.getItem('sismerenda_students')) || DEFAULT_STUDENTS;
let cardapio = JSON.parse(localStorage.getItem('sismerenda_cardapio')) || DEFAULT_CARDAPIO;
let registros = JSON.parse(localStorage.getItem('sismerenda_registros')) || {}; 
// Formato de registros: { "studentId": { vaiAlmocar: true/false, restricoes: ['lactose'], timestamp: '08:15' } }
let observacoesCozinha = JSON.parse(localStorage.getItem('sismerenda_obs')) || [
  { data: 'Hoje 08:10', texto: 'Recebidos 50kg de frango em boas condições térmicas.' }
];

let currentStudentId = students[0]?.id || '1';
let currentSimulatedTime = '08:30'; // Formato HH:MM
const TIME_LIMIT = '09:00';

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = function() {
  renderCardapio();
  populateStudentSelector();
  updateStudentView();
  updateKitchenDashboard();
  updateAdminView();
  checkTimeLockStatus();
};

// ==========================================
// NAVEGAÇÃO DE ABAS
// ==========================================
function switchTab(tabName) {
  const tabs = ['aluno', 'cozinha', 'admin'];
  tabs.forEach(t => {
    const viewEl = document.getElementById('view' + capitalize(t));
    const btnEl = document.getElementById('btnTab' + capitalize(t));
    
    if (t === tabName) {
      viewEl.classList.remove('hidden');
      btnEl.classList.add('bg-slate-100', 'text-slate-900', 'shadow-sm');
      btnEl.classList.remove('text-slate-600');
    } else {
      viewEl.classList.add('hidden');
      btnEl.classList.remove('bg-slate-100', 'text-slate-900', 'shadow-sm');
      btnEl.classList.add('text-slate-600');
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// SIMULADOR DE HORÁRIO
// ==========================================
function updateSimulatedTime(timeStr) {
  currentSimulatedTime = timeStr;
  checkTimeLockStatus();
  showToast(`Horário simulado alterado para ${timeStr}`, 'info');
}

function toggleTimeLockMode() {
  const input = document.getElementById('simulatedTimeInput');
  if (currentSimulatedTime < TIME_LIMIT) {
    input.value = '09:15';
  } else {
    input.value = '08:30';
  }
  updateSimulatedTime(input.value);
}

function isTimeExpired() {
  return currentSimulatedTime >= TIME_LIMIT;
}

function checkTimeLockStatus() {
  const badge = document.getElementById('statusHorarioBadge');
  const actionBtns = document.getElementById('studentActionButtons');
  const blockedNotice = document.getElementById('studentBlockedNotice');
  const currentReg = registros[currentStudentId];

  const expired = isTimeExpired();

  if (expired) {
    badge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800";
    badge.innerHTML = `<i class="fa-solid fa-lock mr-1"></i> Encerrado (${currentSimulatedTime})`;
  } else {
    badge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800";
    badge.innerHTML = `<i class="fa-solid fa-clock mr-1"></i> Aberto (${currentSimulatedTime})`;
  }

  // Trava botões do aluno se passou da hora ou se ele já respondeu
  if (expired || currentReg !== undefined) {
    actionBtns.classList.add('hidden');
    blockedNotice.classList.remove('hidden');
  } else {
    actionBtns.classList.remove('hidden');
    blockedNotice.classList.add('hidden');
  }
}

// ==========================================
// LOGICA VISÃO ALUNO
// ==========================================
function populateStudentSelector() {
  const select = document.getElementById('selectCurrentStudent');
  select.innerHTML = '';
  students.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st.id;
    opt.textContent = `${st.nome} (${st.turma})`;
    if (st.id === currentStudentId) opt.selected = true;
    select.appendChild(opt);
  });
}

function changeCurrentStudent(id) {
  currentStudentId = id;
  updateStudentView();
  checkTimeLockStatus();
}

function updateStudentView() {
  const student = students.find(s => s.id === currentStudentId);
  if (!student) return;

  document.getElementById('studentDisplayName').textContent = `Olá, ${student.nome}!`;
  document.getElementById('studentDisplayMeta').textContent = `Turma: ${student.turma} | Matrícula: ${student.matricula}`;

  // Carregar resposta existente se houver
  const reg = registros[currentStudentId];
  const statusBox = document.getElementById('studentStatusBox');
  const dietarySection = document.getElementById('dietarySection');

  // Limpar checkboxes
  document.getElementById('restLactose').checked = false;
  document.getElementById('restGluten').checked = false;
  document.getElementById('restVeg').checked = false;
  document.getElementById('restAlergia').checked = false;

  if (reg !== undefined) {
    dietarySection.classList.add('opacity-50', 'pointer-events-none');
    if (reg.vaiAlmocar) {
      statusBox.className = "mb-4 p-3 rounded-xl text-sm font-medium border flex items-center gap-3 bg-emerald-50 border-emerald-200 text-emerald-800";
      
      let restDesc = reg.restricoes.length > 0 ? ` (Restrições: ${reg.restricoes.join(', ')})` : '';
      statusBox.innerHTML = `<i class="fa-solid fa-circle-check text-xl text-emerald-600"></i>
        <div>
          <p class="font-bold">Presença CONFIRMADA!</p>
          <p class="text-xs text-emerald-700">Você respondeu SIM às ${reg.timestamp}${restDesc}.</p>
        </div>`;
    } else {
      statusBox.className = "mb-4 p-3 rounded-xl text-sm font-medium border flex items-center gap-3 bg-rose-50 border-rose-200 text-rose-800";
      statusBox.innerHTML = `<i class="fa-solid fa-circle-xmark text-xl text-rose-600"></i>
        <div>
          <p class="font-bold">Ausência REGISTRADA.</p>
          <p class="text-xs text-rose-700">Você informou que NÃO almoçará hoje (${reg.timestamp}).</p>
        </div>`;
    }
  } else {
    dietarySection.classList.remove('opacity-50', 'pointer-events-none');
    statusBox.className = "mb-4 p-3 rounded-xl text-sm font-medium border flex items-center gap-3 bg-slate-50 border-slate-200 text-slate-600";
    statusBox.innerHTML = `<i class="fa-solid fa-circle-question text-xl text-slate-400"></i>
      <span>Você ainda não registrou sua resposta para hoje.</span>`;
  }
}

function registrarRespostaAluno(vaiAlmocar) {
  if (isTimeExpired()) {
    showToast('Horário limite atingido! Não é possível registrar.', 'error');
    return;
  }

  // Coletar restrições
  const restricoes = [];
  if (document.getElementById('restLactose').checked) restricoes.push('Lactose');
  if (document.getElementById('restGluten').checked) restricoes.push('Glúten');
  if (document.getElementById('restVeg').checked) restricoes.push('Vegetariano');
  if (document.getElementById('restAlergia').checked) restricoes.push('Alergia');

  registros[currentStudentId] = {
    vaiAlmocar: vaiAlmocar,
    restricoes: vaiAlmocar ? restricoes : [],
    timestamp: currentSimulatedTime
  };

  saveState();
  updateStudentView();
  checkTimeLockStatus();
  updateKitchenDashboard();

  if (vaiAlmocar) {
    showToast('Presença confirmada no almoço!', 'success');
  } else {
    showToast('Ausência registrada com sucesso.', 'info');
  }
}

// ==========================================
// LOGICA VISÃO COZINHA (DASHBOARD)
// ==========================================
function updateKitchenDashboard() {
  let confirmados = 0;
  let recusados = 0;
  let countLactose = 0;
  let countGluten = 0;
  let countVeg = 0;
  let countAlergia = 0;

  // Agrupamento por turma
  const classMap = {};

  students.forEach(st => {
    if (!classMap[st.turma]) {
      classMap[st.turma] = { confirmados: 0, recusados: 0, pendentes: 0, total: 0 };
    }
    classMap[st.turma].total++;

    const reg = registros[st.id];
    if (reg !== undefined) {
      if (reg.vaiAlmocar) {
        confirmados++;
        classMap[st.turma].confirmados++;

        // Restrições
        if (reg.restricoes.includes('Lactose')) countLactose++;
        if (reg.restricoes.includes('Glúten')) countGluten++;
        if (reg.restricoes.includes('Vegetariano')) countVeg++;
        if (reg.restricoes.includes('Alergia')) countAlergia++;
      } else {
        recusados++;
        classMap[st.turma].recusados++;
      }
    } else {
      classMap[st.turma].pendentes++;
    }
  });

  const totalStudents = students.length;
  const pendentes = totalStudents - (confirmados + recusados);
  const pctAdesao = totalStudents > 0 ? Math.round((confirmados / totalStudents) * 100) : 0;

  // Atualizar KPIs
  document.getElementById('kpiConfirmados').textContent = confirmados;
  document.getElementById('kpiRecusados').textContent = recusados;
  document.getElementById('kpiPendentes').textContent = pendentes;
  document.getElementById('kpiTotal').textContent = totalStudents;
  document.getElementById('kpiAdesaoPct').textContent = `${pctAdesao}%`;

  // Atualizar Contadores de Restrições
  document.getElementById('dietLactoseCount').textContent = countLactose;
  document.getElementById('dietGlutenCount').textContent = countGluten;
  document.getElementById('dietVegCount').textContent = countVeg;
  document.getElementById('dietAlergiaCount').textContent = countAlergia;

  // Atualizar Tabela por Turmas
  const tbody = document.getElementById('kitchenClassTable');
  tbody.innerHTML = '';

  Object.keys(classMap).sort().forEach(turmaName => {
    const data = classMap[turmaName];
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-slate-100";
    tr.innerHTML = `
      <td class="py-3 px-4 font-semibold text-slate-800">${turmaName}</td>
      <td class="py-3 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">${data.confirmados}</td>
      <td class="py-3 px-4 text-center text-rose-600 font-semibold">${data.recusados}</td>
      <td class="py-3 px-4 text-center text-amber-600">${data.pendentes}</td>
      <td class="py-3 px-4 text-center font-bold text-slate-700">${data.total}</td>
    `;
    tbody.appendChild(tr);
  });

  renderKitchenNotes();
}

function saveKitchenNotes() {
  const input = document.getElementById('kitchenNotesInput');
  const val = input.value.trim();
  if (!val) return;

  observacoesCozinha.unshift({
    data: `Hoje as ${currentSimulatedTime}`,
    texto: val
  });

  input.value = '';
  saveState();
  renderKitchenNotes();
  showToast('Observação da cozinha registrada.', 'success');
}

function renderKitchenNotes() {
  const container = document.getElementById('kitchenNotesHistory');
  container.innerHTML = '<span class="font-bold block text-slate-700 mb-1">Histórico de Anotações:</span>';

  if (observacoesCozinha.length === 0) {
    container.innerHTML += '<p class="text-slate-400 italic">Nenhuma observação registrada hoje.</p>';
    return;
  }

  observacoesCozinha.forEach(obs => {
    const item = document.createElement('div');
    item.className = "bg-slate-50 p-2.5 rounded-lg border border-slate-200";
    item.innerHTML = `<span class="font-semibold text-slate-500 text-[11px]">${obs.data}:</span> <span class="text-slate-800">${obs.texto}</span>`;
    container.appendChild(item);
  });
}

function exportKitchenReport() {
  window.print();
}

// ==========================================
// LOGICA VISÃO ADMIN
// ==========================================
function renderCardapio() {
  document.getElementById('cardapioPrato').textContent = cardapio.prato;
  document.getElementById('cardapioAcompanhamentos').textContent = cardapio.acompanhamentos;
  document.getElementById('cardapioImg').src = cardapio.img;

  // Inputs Admin
  document.getElementById('adminPratoInput').value = cardapio.prato;
  document.getElementById('adminAcompInput').value = cardapio.acompanhamentos;
  document.getElementById('adminImgInput').value = cardapio.img;
}

function handleCardapioSubmit(e) {
  e.preventDefault();
  cardapio.prato = document.getElementById('adminPratoInput').value;
  cardapio.acompanhamentos = document.getElementById('adminAcompInput').value;
  cardapio.img = document.getElementById('adminImgInput').value || cardapio.img;

  saveState();
  renderCardapio();
  showToast('Cardápio atualizado com sucesso!', 'success');
}

function updateAdminView() {
  const tbody = document.getElementById('adminStudentsTableList');
  tbody.innerHTML = '';

  students.forEach(st => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50";
    tr.innerHTML = `
      <td class="p-3 font-mono text-slate-600">${st.matricula}</td>
      <td class="p-3 font-semibold text-slate-800">${st.nome}</td>
      <td class="p-3 text-slate-600">${st.turma}</td>
      <td class="p-3 text-right">
        <button onclick="removeStudent('${st.id}')" class="text-rose-500 hover:text-rose-700 p-1" title="Excluir Aluno">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('adminTotalStudentCount').textContent = students.length;
}

function handleAddStudent(e) {
  e.preventDefault();
  const nome = document.getElementById('newStudentName').value.trim();
  const matricula = document.getElementById('newStudentMatricula').value.trim();
  const turma = document.getElementById('newStudentClass').value;

  if (!nome || !matricula) return;

  const newSt = {
    id: Date.now().toString(),
    nome,
    matricula,
    turma
  };

  students.push(newSt);
  saveState();
  
  document.getElementById('newStudentName').value = '';
  document.getElementById('newStudentMatricula').value = '';

  populateStudentSelector();
  updateAdminView();
  updateKitchenDashboard();
  showToast('Novo aluno cadastrado!', 'success');
}

function removeStudent(id) {
  students = students.filter(s => s.id !== id);
  delete registros[id];
  saveState();
  
  if (currentStudentId === id && students.length > 0) {
    currentStudentId = students[0].id;
  }
  
  populateStudentSelector();
  updateStudentView();
  updateAdminView();
  updateKitchenDashboard();
  showToast('Aluno removido.', 'info');
}

function resetSystemData() {
  localStorage.clear();
  students = [...DEFAULT_STUDENTS];
  cardapio = { ...DEFAULT_CARDAPIO };
  registros = {};
  observacoesCozinha = [];
  saveState();
  
  currentStudentId = students[0].id;
  renderCardapio();
  populateStudentSelector();
  updateStudentView();
  updateKitchenDashboard();
  updateAdminView();
  checkTimeLockStatus();
  showToast('Dados restaurados para o padrão de teste.', 'info');
}

// ==========================================
// PERSISTÊNCIA & UTILITÁRIOS
// ==========================================
function saveState() {
  localStorage.setItem('sismerenda_students', JSON.stringify(students));
  localStorage.setItem('sismerenda_cardapio', JSON.stringify(cardapio));
  localStorage.setItem('sismerenda_registros', JSON.stringify(registros));
  localStorage.setItem('sismerenda_obs', JSON.stringify(observacoesCozinha));
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  let bg = 'bg-slate-800 text-white';
  let icon = 'fa-circle-info';
  if (type === 'success') { bg = 'bg-emerald-600 text-white'; icon = 'fa-circle-check'; }
  if (type === 'error') { bg = 'bg-rose-600 text-white'; icon = 'fa-triangle-exclamation'; }

  toast.className = `${bg} px-4 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-3 fade-in`;
  toast.innerHTML = `<i class="fa-solid ${icon} text-lg"></i><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
