const DEFAULT_FURNACES=['ПНЭ-2,7','ЗУ «Б» ПП-0,63','ЗУ «Д» ПП-0,63','ПП-063'];
function furnaceTargets(){try{const saved=JSON.parse(localStorage.getItem('tq93FurnaceTargets')||'null');return Array.isArray(saved)&&saved.length?saved:DEFAULT_FURNACES}catch{return DEFAULT_FURNACES}}
function saveFurnaceTargets(items){localStorage.setItem('tq93FurnaceTargets',JSON.stringify(items.map(item=>String(item||'').trim())))}

const journalFormWithFurnaces=journalForm;
journalForm=function(){
  journalFormWithFurnaces();
  const form=document.querySelector('#journalForm');
  if(!form)return;
  const oldFurnaceBlock=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent==='Пештер');
  if(oldFurnaceBlock)oldFurnaceBlock.hidden=true;
  const block=document.createElement('section');
  block.className='card furnace-card';
  block.innerHTML='<div class="row"><h3>Пештер</h3><button type="button" class="secondary furnace-add">+ Жол қосу</button></div><p class="section-note">Пеш атаулары келесі журналдарда сақталады.</p><div class="furnace-head"><span>Пеш</span><span>Жағдайы</span><span>Су деңгейі</span><span></span></div><div class="furnace-list"></div>';
  const anchor=form.querySelector('.fast-pressure');
  if(anchor)anchor.before(block);else form.prepend(block);
  const list=block.querySelector('.furnace-list');
  const snapshot=()=>Object.fromEntries([...list.querySelectorAll('.furnace-row')].map(row=>[row.dataset.key,{state:row.querySelector('.furnace-state')?.value||'',water:row.querySelector('.furnace-water')?.value||''}]));
  const draw=(values={})=>{
    const targets=furnaceTargets();
    list.innerHTML=targets.map((target,index)=>`<div class="furnace-row" data-key="${index}"><input class="furnace-name" name="furnace_name_${index}" value="${esc(target)}" aria-label="Пеш атауы" /><select class="furnace-state" name="furnace_state_${index}" aria-label="Пеш жағдайы"><option value="">Таңдаңыз</option><option ${values[index]?.state==='Жанып тұр'?'selected':''}>Жанып тұр</option><option ${values[index]?.state==='Сөніп тұр'?'selected':''}>Сөніп тұр</option><option ${values[index]?.state==='Ақау'?'selected':''}>Ақау</option></select><select class="furnace-water" name="furnace_water_${index}" aria-label="Су деңгейі"><option value="">Таңдаңыз</option><option ${values[index]?.water==='Аз'?'selected':''}>Аз</option><option ${values[index]?.water==='Орташа'?'selected':''}>Орташа</option><option ${values[index]?.water==='Толып тұр'?'selected':''}>Толып тұр</option></select><button type="button" class="furnace-remove" aria-label="Пешті өшіру">×</button></div>`).join('');
    list.querySelectorAll('.furnace-name').forEach(input=>input.addEventListener('input',()=>saveFurnaceTargets([...list.querySelectorAll('.furnace-name')].map(field=>field.value))));
    list.querySelectorAll('.furnace-remove').forEach((button,index)=>button.addEventListener('click',()=>{const values=snapshot();const next=furnaceTargets();next.splice(index,1);saveFurnaceTargets(next);draw(values)}));
  };
  draw();
  block.querySelector('.furnace-add').addEventListener('click',()=>{const values=snapshot();saveFurnaceTargets([...furnaceTargets(),'']);draw(values);list.querySelector('.furnace-row:last-child .furnace-name')?.focus()});
};

const journalViewWithFurnaces=journalView;
journalView=function(){
  journalViewWithFurnaces();
  const item=journalRecords().find(entry=>entry.id===selectedJournalId);
  if(!item)return;
  const s=item.sections||{};
  const rows=Object.keys(s).filter(key=>key.startsWith('furnace_name_')).map(key=>{const index=key.slice('furnace_name_'.length);return {name:s[key],state:s[`furnace_state_${index}`],water:s[`furnace_water_${index}`]}}).filter(row=>row.name||row.state||row.water);
  if(!rows.length)return;
  const anchor=[...document.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent==='Химреагент')||[...document.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent==='Жалпы мәлімет');
  if(!anchor)return;
  const block=document.createElement('section');
  block.className='card furnace-card';
  block.innerHTML=`<h3>Пештер</h3><div class="furnace-head"><span>Пеш</span><span>Жағдайы</span><span>Су деңгейі</span><span></span></div><div class="furnace-list">${rows.map(row=>`<div class="furnace-row saved"><b>${esc(row.name||'—')}</b><b>${esc(row.state||'—')}</b><b>${esc(row.water||'—')}</b></div>`).join('')}</div>`;
  anchor.after(block);
};
