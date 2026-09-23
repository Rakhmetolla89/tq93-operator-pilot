/* Compact pressure-test list: only wells that need an entry are added. */
(function(){
  const pressureEscape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function addPressureBlock(form){
    const original=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.startsWith('Сығымдау'));
    if(original){original.hidden=true;original.querySelectorAll('input,select,textarea,button').forEach(control=>control.disabled=true);}
    form.querySelector('#pressureTests')?.remove();
    const card=document.createElement('details');card.className='card pressure-tests';card.id='pressureTests';
    card.innerHTML=`<summary><span>Сығымдау (опрессовка)</span><small class="muted" id="pressureTestCount">Жазба жоқ</small></summary><div class="pressure-test-body"><p class="section-note">Тек тексерілген скважинаны қосыңыз.</p><div id="pressureTestRows"></div><button type="button" class="pressure-test-add" id="addPressureTest">+ Скважина қосу</button></div>`;
    /* Keep it close to the top of the journal so it cannot be missed on a phone. */
    const generalInfo=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.trim()==='Жалпы мәлімет');
    if(generalInfo) generalInfo.after(card);
    else (form.querySelector('.fast-pressure')||form.lastElementChild).before(card);
    const rows=card.querySelector('#pressureTestRows');
    const updateCount=()=>{
      const filled=[...rows.querySelectorAll('[data-pressure-well]')].filter(input=>input.value.trim()).length;
      card.querySelector('#pressureTestCount').textContent=filled?`${filled} жазба`:'Жазба жоқ';
    };
    const addRow=(well='',status='')=>{
      const index=rows.children.length;
      const row=document.createElement('div');row.className='pressure-test-row';
      row.innerHTML=`<input name="press_well_${index}" data-pressure-well inputmode="numeric" placeholder="Скв №" value="${pressureEscape(well)}" aria-label="Скважина нөмірі"><select name="press_status_${index}" aria-label="Опрессовка статусы"><option value="" ${!status?'selected':''}>+/−</option><option value="Бар (+)" ${status==='Бар (+)'?'selected':''}>+ Бар</option><option value="Жоқ (−)" ${status==='Жоқ (−)'?'selected':''}>− Жоқ</option></select><button type="button" aria-label="Өшіру">×</button>`;
      row.querySelector('input').addEventListener('input',updateCount);
      row.querySelector('button').addEventListener('click',()=>{row.remove();renumber();updateCount();});
      rows.append(row);updateCount();
    };
    const renumber=()=>rows.querySelectorAll('.pressure-test-row').forEach((row,index)=>row.querySelectorAll('input,select').forEach(control=>{control.name=control.name.replace(/_\d+$/,'_'+index)}));
    card.querySelector('#addPressureTest').addEventListener('click',()=>addRow());
  }
  const journalFormWithWorkers=journalForm;
  journalForm=function(){
    journalFormWithWorkers();
    const form=document.querySelector('#journalForm');if(form)addPressureBlock(form);
  };
  const journalViewWithWorkers=journalView;
  journalView=function(){
    journalViewWithWorkers();
    document.querySelector('#journalPressureTestView')?.remove();
    const journal=journalRecords().find(item=>item.id===selectedJournalId);if(!journal)return;
    const s=journal.sections||{};
    const keys=Object.keys(s).filter(key=>/^press_well_\d+$/.test(key)&&String(s[key]).trim()).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
    if(!keys.length)return;
    const card=document.createElement('section');card.className='card';card.id='journalPressureTestView';
    card.innerHTML=`<h3>Сығымдау (опрессовка)</h3>${keys.map(key=>{const i=key.match(/\d+/)[0],status=s['press_status_'+i]||'—',cls=status.startsWith('Бар')?'ok':'no';return `<div class="pressure-test-row"><b>№${pressureEscape(s[key])}</b><span class="pressure-test-state ${cls}">${pressureEscape(status)}</span></div>`}).join('')}`;
    (document.querySelector('#app .nav')||document.querySelector('#app')).before(card);
  };
})();
