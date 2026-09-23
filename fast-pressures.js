const journalFormWithSummary=journalForm;
journalForm=function(){
  journalFormWithSummary();
  const form=document.querySelector('#journalForm');
  if(!form)return;

  const sourceRows=window.SHIFT_JOURNAL_93||[];
  const oldRows=[...form.querySelectorAll(':scope > details.card')];
  oldRows.forEach(row=>row.hidden=true);

  const wellHeading=[...form.querySelectorAll('h2')].find(node=>node.textContent.startsWith('Скважиналар'));
  if(!wellHeading)return;

  const byOutlet=new Map();
  sourceRows.forEach((row,index)=>{
    const key=row.group||'ТҚ-93';
    if(!byOutlet.has(key))byOutlet.set(key,[]);
    byOutlet.get(key).push({...row,index});
  });

  const fast=document.createElement('section');
  fast.className='card fast-pressure';
  fast.innerHTML=`<h3>Буфер және Затруб</h3>
    <p class="section-note">Бастапқы мәнді енгізіп, барлық скважинаға қолданыңыз. Төмендегі кестеде тек қажет скважинаның мәнін өзгертіңіз.</p>
    <div class="row"><label>Буфер, атм<input id="defaultBuffer" inputmode="decimal" value="3" /></label><label>Затруб, атм<input id="defaultAnnulus" inputmode="decimal" value="3" /></label></div>
    <button type="button" class="secondary wide" id="applyPressureDefaults">Барлық скважинаға қолдану</button>
    <p class="section-note" id="pressureState">70 скважинаға бастапқы мән: Буфер 3 атм · Затруб 3 атм.</p>
    <div class="pressure-groups">${[...byOutlet.entries()].map(([title,rows],groupIndex)=>`<details class="pressure-group" ${groupIndex===0?'open':''}><summary><b>${esc(title)}</b><span>${rows.length} скв</span></summary><div class="pressure-head"><span>Скв №</span><span>Буфер</span><span>Затруб</span><span>Ескерту</span></div>${rows.map(row=>`<div class="pressure-row" data-index="${row.index}"><b>№${esc(row.well)}</b><input class="fast-buffer" inputmode="decimal" aria-label="№${esc(row.well)} Буфер, атм" /><input class="fast-annulus" inputmode="decimal" aria-label="№${esc(row.well)} Затруб, атм" /><input class="fast-note" aria-label="№${esc(row.well)} ескерту" placeholder="ПРС, т.б." /><small class="pressure-edited" hidden>өзгертілді</small></div>`).join('')}</details>`).join('')}</div>`;
  wellHeading.before(fast);

  const bufferDefault=fast.querySelector('#defaultBuffer');
  const annulusDefault=fast.querySelector('#defaultAnnulus');
  const state=fast.querySelector('#pressureState');
  const originalValue=(name,index)=>form.elements[`${name}_${index}`]?.value?.trim()||'';
  const syncRow=(row,fromDefaults=false)=>{
    const index=Number(row.dataset.index);
    const buffer=row.querySelector('.fast-buffer');
    const annulus=row.querySelector('.fast-annulus');
    const note=row.querySelector('.fast-note');
    if(fromDefaults){buffer.value=bufferDefault.value;annulus.value=annulusDefault.value;}
    form.elements[`buf_${index}`].value=buffer.value;
    form.elements[`zat_${index}`].value=annulus.value;
    form.elements[`note_${index}`].value=note.value;
    const changed=buffer.value!==bufferDefault.value||annulus.value!==annulusDefault.value||note.value.trim()!=='';
    row.classList.toggle('changed',changed);
    row.querySelector('.pressure-edited').hidden=!changed;
  };

  fast.querySelectorAll('.pressure-row').forEach(row=>{
    const index=Number(row.dataset.index);
    row.querySelector('.fast-buffer').value=originalValue('buf',index)||bufferDefault.value;
    row.querySelector('.fast-annulus').value=originalValue('zat',index)||annulusDefault.value;
    row.querySelector('.fast-note').value=originalValue('note',index);
    syncRow(row);
    row.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>syncRow(row)));
  });

  fast.querySelector('#applyPressureDefaults').addEventListener('click',()=>{
    const buffer=bufferDefault.value.trim();
    const annulus=annulusDefault.value.trim();
    if(!buffer||!annulus){alert('Буфер мен Затрубтың бастапқы мәнін енгізіңіз.');return;}
    if(!confirm(`Барлық 70 скважинаға Буфер ${buffer} атм және Затруб ${annulus} атм қою керек пе?`))return;
    fast.querySelectorAll('.pressure-row').forEach(row=>syncRow(row,true));
    state.textContent=`70 скважинаға қолданылды: Буфер ${buffer} атм · Затруб ${annulus} атм.`;
  });
};
