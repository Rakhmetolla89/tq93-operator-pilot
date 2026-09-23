/* Add the three daily figures above the hourly readings grid. */
(function(){
  function addDailyFigures(form){
    const hourly=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.trim()==='Сағаттық өлшемдер');
    if(!hourly||hourly.querySelector('#dailyFigures'))return;
    const figures=document.createElement('div');figures.className='row';figures.id='dailyFigures';
    figures.innerHTML=`<label>TQ (ТурбоКвант)<input name="tqValue" inputmode="decimal" placeholder="Мәлімет"></label><label>Өлшем / Замер<input name="measureValue" inputmode="decimal" placeholder="Мәлімет"></label><label>Жоспар / план<input name="planValue" inputmode="decimal" placeholder="Мәлімет"></label>`;
    hourly.querySelector('h3').after(figures);
  }
  const journalFormWithWorkLog=journalForm;
  journalForm=function(){journalFormWithWorkLog();const form=document.querySelector('#journalForm');if(form)addDailyFigures(form);};
})();
