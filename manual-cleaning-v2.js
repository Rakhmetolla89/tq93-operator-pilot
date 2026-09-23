/* Simplify manual-cleaning entry and separate the packing/belt well list. */
(function(){
  function simplifyCleaningBlock(form){
    const cleaning=[...form.querySelectorAll('section.card')].find(section=>section.querySelector('h3')?.textContent.trim()==='Қолмен тазаланған скважиналар');
    if(!cleaning)return;
    cleaning.innerHTML=`<h3>Тазаланған скважиналар</h3><label>1. Қолмен тазаланған скважиналар<input name="manualCleaning" inputmode="numeric" placeholder="Скважина №"></label><label>2. Бульдозермен тазаланған скважиналар<input name="bulldozerCleaning" inputmode="numeric" placeholder="Скважина №"></label><label>3. ППУ-мен жуылған скважина / ЗУ / басқа объект<input name="ppuWashedObjects" placeholder="Скважина №, ЗУ немесе объект"></label>`;
    form.querySelector('#packingBlock')?.remove();form.querySelector('#beltBlock')?.remove();
    const packing=document.createElement('section');packing.className='card';packing.id='packingBlock';
    packing.innerHTML=`<h3>Тығырық / сальник</h3><label>Скважина №<input name="packingWells" inputmode="numeric" placeholder="Мысалы: 4778, 9797"></label>`;
    const belt=document.createElement('section');belt.className='card';belt.id='beltBlock';
    belt.innerHTML=`<h3>Белдік / ремень</h3><label>Скважина №<input name="beltWells" inputmode="numeric" placeholder="Мысалы: 6604, 8235"></label>`;
    cleaning.after(packing);packing.after(belt);
  }
  const journalFormWithPressureTable=journalForm;
  journalForm=function(){journalFormWithPressureTable();const form=document.querySelector('#journalForm');if(form)simplifyCleaningBlock(form);};
})();
