/* Author-managed diagram catalog. Changes stay on the author device until shared settings are added. */
(function(){
  const key='tq93DiagramCatalog';
  const defaults=[
    {id:'collectors',title:'Коллекторлар схемасы',caption:'Бас құбырлардың жалпы сызбасы · 2026',src:'assets/collectors-1.png',active:true},
    {id:'gas',title:'Газ құбырлары схемасы',caption:'Газ құбырлары мен пештерді айналу сызбасы',src:'assets/gas-pipelines-1.png',active:true},
    {id:'route-gu93',title:'Маршруттық карта — ГУ-93',caption:'Операторлардың скважиналарды айналу бағыты',src:'assets/route-map-gu93.png',active:true},
    {id:'pumpjack',title:'Станок-качалка бөлшектері',caption:'Обход кезіндегі жабдық атаулары мен тексеру нүктелері',src:'assets/stanok-kachalka-detali.png',active:true}
  ];
  const read=()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(saved)?saved:defaults}catch{return defaults}};
  const save=value=>localStorage.setItem(key,JSON.stringify(value));
  const html=value=>esc(String(value||''));
  const find=id=>read().find(item=>item.id===id);
  const parts=['1 — Балансир басы','2 — Канат','3 — Сальникті шток','4 — Сальникті шток','5 — СК корпусы','6 — Стойка','7 — Рама','8 — Фундамент','9 — Балансир денесі','10 — Траверса басы','11 — Траверса','12 — Шатун басы','13 — Балансир тірегі','14 — Шатун','15 — Басқару станциясы','16 — Редуктор','17 — Электрқозғалтқыш','18 — Редуктор шкиві','19 — Электрқозғалтқыш шкиві','20 — Кривошип','21 — Төменгі шатун басы','22 — Қарсы салмақ'];

  diagram=function(){
    const catalog=read().filter(item=>item.active!==false);
    shell(`<h1>ТҚ-93 сызбалары</h1><p class="muted">Қажетті сызбаны ашып, үлкейтіп қарауға болады.</p>${user?.role==='author'?'<button class="secondary wide" style="margin:4px 0 14px" onclick="openDiagramManager()">▧ Сызбаларды басқару</button>':''}${catalog.map(item=>`<article class="card well" onclick="openScheme('${html(item.id)}')"><div class="row"><div><div class="well-id">${html(item.title)}</div><div class="muted">${html(item.caption)}</div></div><span class="pill">Ашу</span></div></article>`).join('')||'<div class="empty">Қазір көрсетілетін сызба жоқ.</div>'}`);
  };
  openScheme=function(id){selectedScheme=id;schemeZoom=1;page='scheme';render()};
  scheme=function(){
    const config=find(selectedScheme)||read().find(item=>item.active!==false)||defaults[0];
    shell(`<button class="secondary" onclick="go('diagram')">← Сызбалар</button><h1>${html(config.title)}</h1><p class="muted">${html(config.caption)}</p><div class="row"><span class="section-note">Толық шолу үшін −, жақындату үшін + басыңыз</span><div class="zoom"><button class="secondary" onclick="schemeZoom=Math.max(.35,schemeZoom-.15);render()">−</button><button class="secondary" onclick="schemeZoom=Math.min(2.4,schemeZoom+.15);render()">+</button></div></div><div class="map-viewport"><div class="route-map-canvas" style="width:${Math.max(320,Math.round(920*schemeZoom))}px"><img src="${html(config.src)}" alt="${html(config.title)}"/></div></div>${config.id==='pumpjack'?`<details class="card diagram-reference"><summary>Нөмірленген бөлшектер тізімі</summary><div class="diagram-parts">${(config.parts||parts).map(part=>`<div class="diagram-part">${html(part)}</div>`).join('')}</div></details>`:''}<p class="section-note" style="margin:16px 4px 34px;line-height:1.5">Сызбаны саусақпен жылжытып толық қарап шығыңыз.</p>`);
  };

  window.openDiagramManager=function(){
    if(user?.role!=='author')return;
    const catalog=read();
    shell(`<button class="secondary" onclick="openAuthorSuggestions()">← Автор беті</button><h1>Сызбаларды басқару</h1><p class="muted">Сызбаны уақытша жасыруға, атауын өзгертуге, файлымен ауыстыруға немесе жаңасын қосуға болады.</p><button class="good wide" onclick="openDiagramEditor()">＋ Жаңа сызба қосу</button><section class="card">${catalog.map(item=>`<div class="diagram-manager-row"><div><b>${html(item.title)}</b><br><small class="muted">${item.active===false?'Жасырылған':'Көрсетіліп тұр'}</small></div><div class="row"><button class="secondary" onclick="openDiagramEditor('${html(item.id)}')">Өзгерту</button><button class="${item.active===false?'good':'danger'}" onclick="toggleDiagram('${html(item.id)}')">${item.active===false?'Қайтару':'Жасыру'}</button></div></div>`).join('')}</section>`);
  };
  let pendingImage='';
  window.openDiagramEditor=function(id){
    if(user?.role!=='author')return;
    const current=id?find(id):null;
    shell(`<button class="secondary" onclick="openDiagramManager()">← Тізімге</button><h1>${current?'Сызбаны өзгерту':'Жаңа сызба'}</h1><form id="diagramEditor"><section class="card"><label>Атауы *<input name="title" maxlength="100" required value="${html(current?.title||'')}" /></label><label>Қысқа сипаттама<input name="caption" maxlength="180" value="${html(current?.caption||'')}" /></label><label>Сызба файлы ${current?'(ауыстыру қажет болса ғана)':'*'}<input id="diagramFile" type="file" accept="image/png,image/jpeg,image/webp" ${current?'':'required'} onchange="previewDiagramFile(event)" /></label><p class="diagram-file-note">PNG, JPG немесе WebP. Файл 2 МБ-тан аспасын.</p><img id="diagramPreview" class="diagram-preview ${current?'':'hidden'}" ${current?`src="${html(current.src)}"`:''} alt="Сызба алдын ала қарау" /></section>${current?.id==='pumpjack'?`<section class="card"><h3>Нөмірленген бөлшектер тізімі</h3><p class="diagram-file-note">Әр жолға бір нөмір мен атауын жазыңыз.</p><textarea name="parts" style="min-height:280px">${html((current.parts||parts).join('\n'))}</textarea></section>`:''}<button class="good wide" type="button" onclick="saveDiagram('${html(id||'')}')">Сақтау</button></form>`);
  };
  window.previewDiagramFile=function(event){
    const file=event.target.files?.[0];if(!file)return;
    if(file.size>2*1024*1024){alert('Файл 2 МБ-тан аспауы керек.');event.target.value='';return}
    const reader=new FileReader();reader.onload=()=>{pendingImage=reader.result;const image=document.querySelector('#diagramPreview');image.src=pendingImage;image.classList.remove('hidden')};reader.readAsDataURL(file);
  };
  window.saveDiagram=function(id){
    const form=document.querySelector('#diagramEditor');if(!form?.reportValidity())return;
    const data=new FormData(form),title=String(data.get('title')).trim(),caption=String(data.get('caption')).trim(),catalog=read();
    const index=catalog.findIndex(item=>item.id===id);
    if(index<0&&!pendingImage){alert('Сызба файлын таңдаңыз.');return}
    const item=index>=0?catalog[index]:{id:crypto.randomUUID(),active:true,src:pendingImage};
    item.title=title;item.caption=caption;if(item.id==='pumpjack')item.parts=String(data.get('parts')||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);if(pendingImage)item.src=pendingImage;
    if(index>=0)catalog[index]=item;else catalog.push(item);
    pendingImage='';save(catalog);openDiagramManager();
  };
  window.toggleDiagram=function(id){const catalog=read(),item=catalog.find(row=>row.id===id);if(!item)return;item.active=item.active===false;save(catalog);openDiagramManager()};
})();
