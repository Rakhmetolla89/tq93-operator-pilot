// Journal-general-information layout, kept separate so its structure is easy to refine.
const baseJournalForm=journalForm;
journalForm=function(){
  baseJournalForm();
  const form=document.querySelector('#journalForm');
  if(!form)return;
  const master=form.elements.master;
  if(master)master.readOnly=true;
  const block=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent==='Жалпы мәлімет');
  if(!block)return;
  block.innerHTML=`<h3>Жалпы мәлімет</h3>
    <div class="row"><label>Барлығы<input name="total" inputmode="numeric" value="70" /></label><label>Жұмыста<input name="working" inputmode="numeric" /></label></div>
    <div class="row"><label>Тоқтауда<input name="stopped" inputmode="numeric" /></label><label>Оптимас<input name="optimas" inputmode="numeric" /></label></div>
    <div class="row"><label>Бас құбыр<input name="mainPipeline" inputmode="numeric" /></label><label>Қазан<input name="boiler" inputmode="numeric" /></label></div>
    <label>ГӨЗ<input name="gez" inputmode="numeric" /></label>`;
};

const baseJournalView=journalView;
journalView=function(){
  baseJournalView();
  const item=journalRecords().find(entry=>entry.id===selectedJournalId);
  if(!item)return;
  const block=[...document.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent==='Жалпы мәлімет');
  if(!block)return;
  const s=item.sections||{};
  const field=(label,value)=>`<div class="journal-field"><span>${esc(label)}</span><b>${esc(value||'—')}</b></div>`;
  block.innerHTML=`<h3>Жалпы мәлімет</h3><div class="journal-grid">${field('Барлығы',s.total)}${field('Жұмыста',s.working)}${field('Тоқтауда',s.stopped)}${field('Оптимас',s.optimas)}${field('Бас құбыр',s.mainPipeline)}${field('Қазан',s.boiler)}${field('ГӨЗ',s.gez)}</div>`;
};
