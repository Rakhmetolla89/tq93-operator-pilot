/* Full work note plus compact JAJ/KJAJ well table. */
(function(){
  function addWorkLog(form){
    const work=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.trim()==='Жасалған жұмыстар');
    if(!work)return;
    work.innerHTML=`<h3>Жасалған жұмыстар</h3><label>Атқарылған барлық жұмыс<textarea name="workInfo" placeholder="Күн ішінде жасалған жұмыстарды толық жазыңыз"></textarea></label>`;
    form.querySelector('#repairLogBlock')?.remove();
    const card=document.createElement('section');card.className='card repair-log-card';card.id='repairLogBlock';
    card.innerHTML=`<h3>ЖАЖ / КЖАЖ-да тұрған скважиналар туралы ақпарат</h3><div class="repair-scroll"><div class="repair-table"><div class="repair-head"><span>Скв №</span><span>Жұмыс түрі</span><span>Бригада №</span><span>Ақпарат</span></div><div id="repairRows"></div></div></div><button type="button" class="repair-add" id="addRepairRow">+ Жол қосу</button>`;
    work.after(card);
    const rows=card.querySelector('#repairRows');
    const renumber=()=>rows.querySelectorAll('.repair-row').forEach((row,index)=>row.querySelectorAll('input,select').forEach(control=>control.name=control.name.replace(/_\d+$/,'_'+index)));
    const addRow=()=>{
      const index=rows.children.length,row=document.createElement('div');row.className='repair-row';
      row.innerHTML=`<input name="repair_well_${index}" inputmode="numeric" placeholder="№"><select name="repair_type_${index}"><option value="">Таңдау</option><option>ЖАЖ</option><option>КЖАЖ</option></select><input name="repair_team_${index}" inputmode="numeric" placeholder="№"><input name="repair_info_${index}" placeholder="Ақпарат">`;
      rows.append(row);
    };
    card.querySelector('#addRepairRow').addEventListener('click',addRow);addRow();addRow();
  }
  const journalFormWithCleaning=journalForm;
  journalForm=function(){journalFormWithCleaning();const form=document.querySelector('#journalForm');if(form)addWorkLog(form);};
})();
