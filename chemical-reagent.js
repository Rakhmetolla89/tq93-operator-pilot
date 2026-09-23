const DEFAULT_CHEMICAL_TARGETS=['Оптимас 6862','Оптимас 9811','Оптимас 7509','Оптимас 8938','Оптимас 6443','Оптимас 1189','ЗУ-93а','ЗУ-93б','ЗУ-93в','ЗУ-93г'];
function chemicalTargets(){try{const saved=JSON.parse(localStorage.getItem('tq93ChemicalTargets')||'null');return Array.isArray(saved)&&saved.length?saved:DEFAULT_CHEMICAL_TARGETS}catch{return DEFAULT_CHEMICAL_TARGETS}}
function saveChemicalTargets(items){localStorage.setItem('tq93ChemicalTargets',JSON.stringify(items.map(item=>String(item||'').trim())))}

const journalFormWithChemical=journalForm;
journalForm=function(){
  journalFormWithChemical();
  const form=document.querySelector('#journalForm');
  if(!form)return;
  const block=document.createElement('section');
  block.className='card chemical-card';
  block.innerHTML='<div class="row"><h3>Химреагент</h3><button type="button" class="secondary chemical-add">+ Жол қосу</button></div><p class="section-note">Сол жақтағы тізім келесі журналдарда да сақталады. Оң жаққа осы күнгі химия деңгейін жазыңыз.</p><div class="chemical-head"><span>Нысан / атауы</span><span>Химия деңгейі</span><span></span></div><div class="chemical-list"></div>';
  const anchor=form.querySelector('.fast-pressure');
  if(anchor)anchor.before(block);else form.prepend(block);
  const list=block.querySelector('.chemical-list');
  const snapshot=()=>Object.fromEntries([...list.querySelectorAll('.chemical-row')].map(row=>[row.dataset.key,row.querySelector('.chemical-level')?.value||'']));
  const draw=(levels={})=>{
    const targets=chemicalTargets();
    list.innerHTML=targets.map((target,index)=>`<div class="chemical-row" data-key="${index}"><input class="chemical-target" name="chemical_target_${index}" value="${esc(target)}" aria-label="Химреагент нысаны" /><input class="chemical-level" name="chemical_level_${index}" inputmode="decimal" value="${esc(levels[index]||'')}" aria-label="Химия деңгейі" placeholder="Мысалы: 265" /><button type="button" class="chemical-remove" aria-label="Жолды өшіру">×</button></div>`).join('');
    list.querySelectorAll('.chemical-target').forEach(input=>input.addEventListener('input',()=>saveChemicalTargets([...list.querySelectorAll('.chemical-target')].map(field=>field.value))));
    list.querySelectorAll('.chemical-remove').forEach((button,index)=>button.addEventListener('click',()=>{const values=snapshot();const next=chemicalTargets();next.splice(index,1);saveChemicalTargets(next);draw(values)}));
  };
  draw();
  block.querySelector('.chemical-add').addEventListener('click',()=>{const values=snapshot();saveChemicalTargets([...chemicalTargets(),'']);draw(values);list.querySelector('.chemical-row:last-child .chemical-target')?.focus()});
};

const journalViewWithChemical=journalView;
journalView=function(){
  journalViewWithChemical();
  const item=journalRecords().find(entry=>entry.id===selectedJournalId);
  if(!item)return;
  const s=item.sections||{};
  const pairs=Object.keys(s).filter(key=>key.startsWith('chemical_target_')).map(key=>{const index=key.slice('chemical_target_'.length);return {target:s[key],level:s[`chemical_level_${index}`]}}).filter(row=>row.target||row.level);
  if(!pairs.length)return;
  const general=[...document.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent==='Жалпы мәлімет');
  if(!general)return;
  const block=document.createElement('section');
  block.className='card chemical-card';
  block.innerHTML=`<h3>Химреагент</h3><div class="chemical-head"><span>Нысан / атауы</span><span>Химия деңгейі</span><span></span></div><div class="chemical-list">${pairs.map(row=>`<div class="chemical-row saved"><b>${esc(row.target||'—')}</b><b>${esc(row.level||'—')}</b></div>`).join('')}</div>`;
  general.after(block);
};
