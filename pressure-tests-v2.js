/* Fixed two-column pressure-test table placed immediately after Pumps. */
(function(){
  function compactPressureTable(form){
    form.querySelector('#pressureTests')?.remove();
    const original=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.startsWith('Сығымдау'));
    if(original){original.hidden=true;original.querySelectorAll('input,select,textarea,button').forEach(control=>control.disabled=true);}
    const pumps=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.trim()==='Сораптар');
    if(!pumps)return;
    const section=document.createElement('section');section.className='card pressure-tests pressure-table';section.id='pressureTests';
    section.innerHTML=`<h3>Сығымдау (опрессовка)</h3><div class="pressure-test-body"><div class="pressure-table-head"><span>Скважина №</span><span>Опрессовка</span></div><div id="pressureTestRows"></div><button type="button" class="pressure-test-add" id="addPressureTest">+ Жол қосу</button></div>`;
    pumps.after(section);
    const rows=section.querySelector('#pressureTestRows');
    const renumber=()=>rows.querySelectorAll('.pressure-test-row').forEach((row,index)=>row.querySelectorAll('input,select').forEach(control=>control.name=control.name.replace(/_\d+$/,'_'+index)));
    const addRow=()=>{
      const index=rows.children.length,row=document.createElement('div');row.className='pressure-test-row';
      row.innerHTML=`<input name="press_well_${index}" inputmode="numeric" placeholder="№ скв" aria-label="Скважина нөмірі"><select name="press_status_${index}" aria-label="Опрессовка"><option value="">+/−</option><option value="Бар (+)">+ Бар</option><option value="Жоқ (−)">− Жоқ</option></select><button type="button" aria-label="Жолды өшіру">×</button>`;
      row.querySelector('button').addEventListener('click',()=>{row.remove();renumber()});rows.append(row);
    };
    section.querySelector('#addPressureTest').addEventListener('click',addRow);
    addRow();addRow();addRow();
  }
  const journalFormWithPressureBlock=journalForm;
  journalForm=function(){journalFormWithPressureBlock();const form=document.querySelector('#journalForm');if(form)compactPressureTable(form);};
})();
