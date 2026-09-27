/* Master-only local management of active wells, their passports and primary photos. */
(function(){
  const baseWells=[...WELLS];
  const baseJournalRows=[...(window.SHIFT_JOURNAL_93||[])];
  const customKey='tq93CustomWells', removedKey='tq93RemovedWells', photoKey='tq93CustomWellPhotos';
  const fields=['ЗУ/отвод','Горизонт','Режим','СК түрі','Планшайбы типі','Шахта','Кері клапан','гайка','Пеш','Затруб','Длинаход L','ЭКМ','ХТ','Шығыс құбыры L','Ремень'];
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
  const custom=()=>read(customKey,[]);
  const removed=()=>read(removedKey,[]);
  const photos=()=>read(photoKey,{});
  const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const escText=value=>esc(String(value??''));
  const fieldValue=(rows,label)=>rows.find(row=>row[0]===label)?.[1]||'';
  function refreshCollections(){
    const hidden=new Set(removed()), additions=custom().filter(item=>!hidden.has(item.id));
    const active=[...baseWells.filter(id=>!hidden.has(id)),...additions.map(item=>item.id)];
    WELLS.splice(0,WELLS.length,...active);
    additions.forEach(item=>passportRows[item.id]=item.passport);
    if(window.SHIFT_JOURNAL_93){
      const journal=baseJournalRows.filter(row=>!hidden.has(row.well));
      additions.forEach(item=>journal.push({well:item.id,group:'Қосылған скважина',outlet:fieldValue(item.passport,'ЗУ/отвод')||'—',horizon:fieldValue(item.passport,'Горизонт')||'—',qj:'',percent:'',qn:''}));
      window.SHIFT_JOURNAL_93.splice(0,window.SHIFT_JOURNAL_93.length,...journal);
    }
  }
  refreshCollections();

  const baseSettings=settings;
  settings=function(){
    baseSettings();
    if(user?.role!=='master')return;
    const card=document.querySelector('#app .card');
    if(card)card.insertAdjacentHTML('afterend','<section class="card"><h3>Скважиналарды басқару</h3><p class="muted">Скважинаны қосу, паспортын және негізгі фотосын енгізу немесе тізімнен уақытша алып тастау.</p><button class="wide" onclick="openWellManagement()">Скважиналарды басқару</button></section>');
  };

  window.openWellManagement=function(){
    if(user?.role!=='master')return;
    const deleted=removed();
    shell(`<button class="secondary" onclick="go('settings')">← Баптаулар</button><h1>Скважиналарды басқару</h1><div class="well-manager-actions"><button class="good" onclick="openNewWellForm()">＋ Скважина қосу</button><button class="secondary" onclick="openRemovedWells()">Қайтару (${deleted.length})</button></div><section class="card"><h3>Белсенді скважиналар · ${WELLS.length}</h3><p class="section-note">«Алып тастау» скважинаны тізімнен, обходтан және жаңа журналдан жасырады. Кейін осы беттен қайтара аласыз.</p><div class="well-manager-list">${WELLS.map(id=>`<div class="well-manager-row"><div><b>№${escText(id)}</b><br><small class="muted">${escText(passportSummary(id)[0])} · гор. ${escText(passportSummary(id)[1])}</small></div><button class="danger" onclick="removeWellFromList('${escText(id)}')">Алып тастау</button></div>`).join('')}</div></section>`);
  };
  window.openNewWellForm=function(){
    if(user?.role!=='master')return;
    shell(`<button class="secondary" onclick="openWellManagement()">← Тізімге</button><h1>Жаңа скважина</h1><p class="muted">Паспорттың барлық қолдағы мәліметін енгізіңіз. Бос жолдарды кейін паспорттан толықтыра аласыз.</p><form id="newWellForm"><section class="card"><label>Скважина № *<input name="well" maxlength="30" required placeholder="Мысалы: 6605" /></label>${fields.map(field=>`<label>${escText(field)}<input name="p_${fields.indexOf(field)}" placeholder="Мәлімет" /></label>`).join('')}</section><section class="card"><h3>Негізгі фото</h3><label>Станок-качалка фотосы<input id="newWellPhoto" type="file" accept="image/*" capture="environment" onchange="previewNewWellPhoto(event)" /></label><img id="newWellPhotoPreview" class="well-photo-preview hidden" alt="Фото алдын ала қарау" /></section><button class="good wide" type="button" onclick="saveNewWell()">Скважинаны сақтау</button></form>`);
  };
  let pendingPhoto='';
  window.previewNewWellPhoto=function(event){
    const file=event.target.files?.[0];if(!file)return;
    const reader=new FileReader();reader.onload=()=>{pendingPhoto=reader.result;const preview=document.querySelector('#newWellPhotoPreview');preview.src=pendingPhoto;preview.classList.remove('hidden')};reader.readAsDataURL(file);
  };
  window.saveNewWell=function(){
    const form=document.querySelector('#newWellForm');if(!form?.reportValidity())return;
    const data=new FormData(form),id=String(data.get('well')).trim();
    if(!id)return;
    if(!/^[0-9A-Za-zА-Яа-яЁё\- ]+$/.test(id)){alert('Скважина нөміріне тек әріп, сан, бос орын және «-» белгісін жазыңыз.');return}
    if(WELLS.includes(id)||custom().some(item=>item.id===id)){alert('Бұл нөмір тізімде бар. Егер ол бұрын өшірілген болса, «Қайтару» бөлімінен қалпына келтіріңіз.');return}
    const passport=fields.map((field,index)=>[field,String(data.get('p_'+index)||'').trim()||'—']);
    const additions=[...custom(),{id,passport,createdAt:new Date().toISOString(),createdBy:user.name}];save(customKey,additions);
    if(pendingPhoto)save(photoKey,{...photos(),[id]:pendingPhoto});
    pendingPhoto='';refreshCollections();selected=id;page='well';render();
  };
  window.removeWellFromList=function(id){
    if(user?.role!=='master'||!confirm(`№${id} скважинасын белсенді тізімнен алып тастау керек пе? Оны кейін қайтара аласыз.`))return;
    save(removedKey,[...new Set([...removed(),id])]);refreshCollections();openWellManagement();
  };
  window.openRemovedWells=function(){
    if(user?.role!=='master')return;
    const ids=removed();
    shell(`<button class="secondary" onclick="openWellManagement()">← Басқаруға</button><h1>Алып тасталғандар</h1><section class="card">${ids.length?`<div class="well-manager-list">${ids.map(id=>`<div class="well-manager-row"><b>№${escText(id)}</b><button class="good" onclick="restoreWell('${escText(id)}')">Қайтару</button></div>`).join('')}</div>`:'<div class="well-manager-empty">Алып тасталған скважина жоқ.</div>'}</section>`);
  };
  window.restoreWell=function(id){save(removedKey,removed().filter(item=>item!==id));refreshCollections();openRemovedWells()};

  const baseWell=well;
  well=function(){
    baseWell();
    const photo=photos()[selected];
    if(photo){const image=document.querySelector('.equipment-art');if(image)image.src=photo;}
  };
})();
