/* Shift personnel directory and daily attendance block for the master journal. */
(function(){
  const WORKERS_KEY='tq93ShiftWorkers';
  const DEFAULT_WORKERS={
    'Вахта 1':['Мұнайшы 1','Мұнайшы 2'],
    'Вахта 2':['Мұнайшы 1','Мұнайшы 2']
  };
  const STATUSES=['Жұмыста','Оқуда','Отпуск','Больничный','Без содержания'];
  const escWorker=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function workers(){
    try{
      const saved=JSON.parse(localStorage.getItem(WORKERS_KEY)||'null');
      if(saved&&Array.isArray(saved['Вахта 1'])&&Array.isArray(saved['Вахта 2'])) return saved;
    }catch(error){}
    return JSON.parse(JSON.stringify(DEFAULT_WORKERS));
  }
  function saveWorkers(value){localStorage.setItem(WORKERS_KEY,JSON.stringify(value));}
  function statusClass(value){return value==='Жұмыста'?'status-work':value==='Больничный'?'status-sick':'status-away';}
  function workerSection(form){
    const base=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.trim()==='Мұнайшылар');
    if(base){
      base.hidden=true;
      base.querySelectorAll('input,select,textarea,button').forEach(control=>control.disabled=true);
    }
    const old=form.querySelector('#shiftWorkersCard'); if(old)old.remove();
    const card=document.createElement('section');
    card.className='card workers-card'; card.id='shiftWorkersCard';
    card.innerHTML=`<h3>Мұнайшылар</h3><p class="section-note">Вахтаны таңдаңыз, қажет болса адамның жанынан статусын өзгертіңіз.</p>
      <div class="shift-tabs"><button type="button" data-shift="Вахта 1">Вахта 1</button><button type="button" data-shift="Вахта 2">Вахта 2</button></div>
      <input type="hidden" name="workers_shift" value="Вахта 1"><div class="workers-list"></div>`;
    (form.querySelector('.fast-pressure')||form.lastElementChild).before(card);
    const stateByShift={'Вахта 1':{},'Вахта 2':{}};
    let current='Вахта 1';
    const collect=()=>{
      card.querySelectorAll('.worker-row').forEach(row=>{
        stateByShift[current][row.dataset.index]=row.querySelector('select').value;
      });
    };
    const draw=shift=>{
      current=shift; card.querySelector('input[name="workers_shift"]').value=shift;
      card.querySelectorAll('[data-shift]').forEach(button=>button.classList.toggle('active',button.dataset.shift===shift));
      const names=workers()[shift]||[];
      const rows=names.length?names.map((name,index)=>{
        const selected=stateByShift[shift][index]||'Жұмыста';
        return `<div class="worker-row" data-index="${index}"><input type="hidden" name="worker_name_${index}" value="${escWorker(name)}"><b>${escWorker(name)}</b><select class="worker-status ${statusClass(selected)}" name="worker_status_${index}" aria-label="${escWorker(name)} статусы">${STATUSES.map(status=>`<option ${status===selected?'selected':''}>${status}</option>`).join('')}</select></div>`;
      }).join(''):'<p class="muted">Бұл вахтаға мұнайшы қосылмаған. Баптаулардан тізімді толтырыңыз.</p>';
      card.querySelector('.workers-list').innerHTML=`<div class="workers-head"><span>Мұнайшы</span><span>Статусы</span></div>${rows}`;
      card.querySelectorAll('select').forEach(select=>select.addEventListener('change',()=>{
        select.className=`worker-status ${statusClass(select.value)}`;
      }));
    };
    card.querySelectorAll('[data-shift]').forEach(button=>button.addEventListener('click',()=>{collect();draw(button.dataset.shift)}));
    draw(current);
  }
  const journalFormWithFurnaces=journalForm;
  journalForm=function(){
    journalFormWithFurnaces();
    const form=document.querySelector('#journalForm');
    if(form&&user?.role==='master')workerSection(form);
  };
  const journalViewWithFurnaces=journalView;
  journalView=function(){
    journalViewWithFurnaces();
    const journal=journalRecords().find(item=>item.id===selectedJournalId);
    const target=document.querySelector('#journalWorkerView'); if(target)target.remove();
    if(!journal)return;
    const s=journal.sections||{};
    const names=Object.keys(s).filter(key=>/^worker_name_\d+$/.test(key)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
    if(!names.length)return;
    const card=document.createElement('section'); card.className='card';card.id='journalWorkerView';
    card.innerHTML=`<h3>Мұнайшылар · ${escWorker(s.workers_shift||'Вахта')}</h3><div class="workers-head"><span>Мұнайшы</span><span>Статусы</span></div>${names.map(key=>{const i=key.match(/\d+/)[0];const status=s['worker_status_'+i]||'Жұмыста';return `<div class="worker-row"><b>${escWorker(s[key])}</b><span class="worker-status ${statusClass(status)}">${escWorker(status)}</span></div>`}).join('')}`;
    (document.querySelector('#app .nav')||document.querySelector('#app')).before(card);
  };
  const baseSettings=settings;
  settings=function(){
    baseSettings();
    if(user?.role!=='master')return;
    const card=document.createElement('section'); card.className='card shift-worker-settings';card.id='shiftWorkerSettings';
    card.innerHTML=`<h2>Мұнайшылар тізімі</h2><p class="section-note">Бұл тізім Кезекшілік журналындағы сәйкес вахтаға шығады.</p><div class="tabs"><button type="button" class="active" data-worker-shift="Вахта 1">Вахта 1</button><button type="button" data-worker-shift="Вахта 2">Вахта 2</button></div><div class="settings-worker-list"></div><div class="workers-actions"><button type="button" class="secondary" id="addShiftWorker">+ Мұнайшы қосу</button></div>`;
    (document.querySelector('#app .nav')||document.querySelector('#app')).before(card);
    let active='Вахта 1';
    const draw=()=>{
      const list=workers()[active]||[];
      card.querySelectorAll('[data-worker-shift]').forEach(button=>button.classList.toggle('active',button.dataset.workerShift===active));
      card.querySelector('.settings-worker-list').innerHTML=list.map((name,index)=>`<div class="settings-worker-row"><input value="${escWorker(name)}" aria-label="${active} мұнайшысы ${index+1}" data-worker-name="${index}" placeholder="Мұнайшының аты-жөні"><button type="button" data-delete-worker="${index}" aria-label="Өшіру">×</button></div>`).join('')||'<p class="muted">Тізім бос.</p>';
      card.querySelectorAll('[data-worker-name]').forEach(input=>input.addEventListener('input',()=>{const all=workers();all[active][Number(input.dataset.workerName)]=input.value;saveWorkers(all)}));
      card.querySelectorAll('[data-delete-worker]').forEach(button=>button.addEventListener('click',()=>{const all=workers();all[active].splice(Number(button.dataset.deleteWorker),1);saveWorkers(all);draw()}));
    };
    card.querySelectorAll('[data-worker-shift]').forEach(button=>button.addEventListener('click',()=>{active=button.dataset.workerShift;draw()}));
    card.querySelector('#addShiftWorker').addEventListener('click',()=>{const all=workers();all[active].push(`Мұнайшы ${all[active].length+1}`);saveWorkers(all);draw()});
    draw();
  };
})();
