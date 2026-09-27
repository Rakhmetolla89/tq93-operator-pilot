/* Configurable safety briefing shown before an operator begins the обход. */
(function(){
  const storageKey='tq93SafetyBriefing';
  const defaults={
    title:'Техника қауіпсіздігі',
    intro:'Обходты бастамас бұрын жеке қорғану құралдары толық киілгенін және жұмыс аймағы қауіпсіз екенін тексеріңіз.',
    ppe:['Қорғаныш каскасы','Қорғаныш көзілдірігі','Отқа төзімді арнайы киім','Арнайы аяқ киім','Қорғаныш қолғаптары','Газталдағыш (қажет болған жағдайда)','Байланыс құралы немесе радиостанция','Алғашқы көмек қобдишасы қолжетімді болуы'],
    steps:['Станок-качалкаға тек қауіпсіз өту жолымен жақындаңыз; тайғақ, төгінді және бөгде заттар жоқ екеніне көз жеткізіңіз.','Қоршау, жерге қосу, кабельдер, алаңша және баспалдақтар бүтін екенін сырттай тексеріңіз.','Жұмыс істеп тұрған қондырғының айналмалы және тербелмелі бөлшектеріне, ременьге, кривошипке және балансирге жақындамаңыз.','Қоршаудан өтпеңіз және жабдық толық тоқтамайынша жөндеу, реттеу немесе тазалау жүргізбеңіз.','Мұнай/газ ағуы, газ иісі, түтін, бөгде дыбыс не қатты діріл байқалса, қондырғыға жақындамаңыз — шеберге дереу хабарлаңыз.','Ашық от жағуға және темекі шегуге болмайды.']
  };
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const read=()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');return saved&&saved.title?saved:defaults}catch{return defaults}};
  const lines=value=>String(value||'').split(/\r?\n/).map(item=>item.trim()).filter(Boolean);

  window.openSafetyBriefing=function(){
    const data=read();
    shell(`<button class="secondary" onclick="go('home')">← Басты бет</button><h1>${escape(data.title)}</h1><section class="card safety-hero"><b>Назар аударыңыз!</b><p>${escape(data.intro)}</p></section><section class="card"><h3>Жеке қорғану құралдары</h3>${data.ppe.map(item=>`<div class="safety-check"><span>✓</span><div>${escape(item)}</div></div>`).join('')}</section><section class="card"><h3>Станок-качалка маңындағы қауіпсіздік</h3><ol class="safety-list">${data.steps.map(item=>`<li>${escape(item)}</li>`).join('')}</ol></section><button class="good wide" onclick="continueToRounds()">Түсіндім, обходты бастау</button><p class="section-note">Талаптарды сақтаңыз. Қауіпті жағдай байқалса, жұмысты тоқтатып, шеберге хабарлаңыз.</p>`);
  };
  window.continueToRounds=function(){baseSafetyGo('wells')};

  const baseSafetyGo=go;
  go=function(nextPage){
    if(user?.role==='operator'&&page==='home'&&nextPage==='wells')return openSafetyBriefing();
    return baseSafetyGo(nextPage);
  };

  const priorAuthorPage=window.openAuthorSuggestions;
  window.openAuthorSuggestions=function(){
    priorAuthorPage?.apply(this,arguments);
    if(!user||user.role!=='author')return;
    const card=document.querySelector('.author-access');
    if(card&&!document.querySelector('.safety-admin-launch'))card.insertAdjacentHTML('afterend','<button class="secondary wide safety-admin-launch" onclick="openSafetyBriefingAdmin()">🦺 Қауіпсіздік ескертуін өзгерту</button>');
  };
  window.openSafetyBriefingAdmin=function(){
    if(user?.role!=='author')return;
    const data=read();
    shell(`<button class="secondary" onclick="openAuthorSuggestions()">← Автор беті</button><h1>Қауіпсіздік ескертуі</h1><p class="muted">Осы мәтін оператор обходты бастар алдында көреді. Әр тармақты жаңа жолдан жазыңыз.</p><form id="safetyBriefingForm" class="safety-form"><section class="card"><label>Тақырып<input name="title" maxlength="80" required value="${escape(data.title)}" /></label><label>Кіріспе мәтін<textarea name="intro" maxlength="500" required>${escape(data.intro)}</textarea></label></section><section class="card"><h3>Жеке қорғану құралдары</h3><label>Әр жол — бір құрал<textarea name="ppe" required>${escape(data.ppe.join('\n'))}</textarea></label></section><section class="card"><h3>Качалка маңындағы қауіпсіздік</h3><label>Әр жол — бір талап<textarea name="steps" required>${escape(data.steps.join('\n'))}</textarea></label></section><button class="good wide" type="button" onclick="saveSafetyBriefing()">Өзгерісті сақтау</button></form>`);
  };
  window.saveSafetyBriefing=function(){
    const form=document.querySelector('#safetyBriefingForm');
    if(!form?.reportValidity())return;
    const values=new FormData(form),next={title:String(values.get('title')).trim(),intro:String(values.get('intro')).trim(),ppe:lines(values.get('ppe')),steps:lines(values.get('steps'))};
    if(!next.ppe.length||!next.steps.length){alert('Қорғану құралдары мен қауіпсіздік талаптарына кемінде бір тармақ жазыңыз.');return}
    localStorage.setItem(storageKey,JSON.stringify(next));
    alert('Қауіпсіздік ескертуі сақталды.');
    openAuthorSuggestions();
  };
})();
