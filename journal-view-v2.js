/* Saved journal view mirrors the filled form and suppresses empty/legacy blocks. */
(function(){
  const viewEsc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const filled=value=>String(value??'').trim()!=='';
  const statusClass=value=>{const text=String(value||'').toLowerCase();return text.includes('ақау')||text.includes('жоқ')||text==='аз'?'status-red':text.includes('орташа')?'status-yellow':'';};
  journalView=function(){
    if(user?.role!=='master'){page='home';return render();}
    const item=journalRecords().find(record=>record.id===selectedJournalId);
    if(!item){page='shiftJournal';return render();}
    const s=item.sections||{};
    const field=(label,value)=>filled(value)?`<div class="journal-field"><span>${viewEsc(label)}</span><b>${viewEsc(value)}</b></div>`:'';
    const simpleRows=rows=>rows.filter(([,value])=>filled(value)).map(([label,value])=>`<div class="journal-view-row"><span>${viewEsc(label)}</span><span>${viewEsc(value)}</span></div>`).join('');
    const card=(title,body,className='')=>body&&body.replace(/<[^>]*>/g,'').trim()?`<section class="card ${className}"><h3>${viewEsc(title)}</h3>${body}</section>`:'';
    const general=card('Жалпы мәлімет',`<div class="journal-grid">${field('Барлығы',s.total)}${field('Жұмыста',s.working)}${field('Бас құбыр / ЗУ',s.mainPipeline)}</div>`);

    const chemicalKeys=Object.keys(s).filter(key=>/^chemical_target_\d+$/.test(key)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
    const chemical=card('Химреагент',`<div class="journal-view-list">${chemicalKeys.map(key=>{const i=key.match(/\d+/)[0],level=s['chemical_level_'+i];return filled(level)?`<div class="journal-view-row"><span>${viewEsc(s[key])}</span><span>${viewEsc(level)}</span></div>`:''}).join('')}</div>`);

    const furnaceKeys=Object.keys(s).filter(key=>/^furnace_name_\d+$/.test(key)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
    const furnaces=card('Пештер',`<div class="furnace-view-list">${furnaceKeys.map(key=>{const i=key.match(/\d+/)[0],state=s['furnace_state_'+i],water=s['furnace_water_'+i];return filled(state)||filled(water)?`<div class="furnace-view-card"><div><small>Пеш</small><b>${viewEsc(s[key])}</b></div><div><small>Жағдайы</small><b class="${statusClass(state)}">${viewEsc(state||'—')}</b></div><div><small>Су деңгейі</small><b class="${statusClass(water)}">${viewEsc(water||'—')}</b></div></div>`:''}).join('')}</div>`);

    const pumps=card('Сораптар',`<div class="journal-view-list">${simpleRows([1,2,3,4,5,6].map(i=>['Сорап '+i,s['pump_'+i]]))}</div>`);

    const workerKeys=Object.keys(s).filter(key=>/^worker_name_\d+$/.test(key)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
    const workers=card(`Мұнайшылар · ${s.workers_shift||'Вахта'}`,`<div class="journal-view-list">${workerKeys.map(key=>{const i=key.match(/\d+/)[0];return `<div class="journal-view-row"><span>${viewEsc(s[key])}</span><span>${viewEsc(s['worker_status_'+i]||'Жұмыста')}</span></div>`}).join('')}</div>`);

    const grouped=new Map();
    (item.entries||[]).filter(entry=>filled(entry.buffer)||filled(entry.annulus)||filled(entry.note)).forEach(entry=>{const group=entry.group||'ТҚ-93';if(!grouped.has(group))grouped.set(group,[]);grouped.get(group).push(entry);});
    const pressure=[...grouped.entries()].map(([group,entries])=>`<details class="card"><summary><b>${viewEsc(group)}</b> <span class="muted">${entries.length} скв</span></summary><div class="view-pressure-body"><div class="view-pressure-head"><span>Скв №</span><span>Буфер</span><span>Затруб</span><span>Ескерту</span></div>${entries.map(entry=>`<div class="view-pressure-row"><b>№${viewEsc(entry.well)}<small class="muted">Отвод ${viewEsc(entry.outlet)}</small></b><span>${viewEsc(entry.buffer||'—')}</span><span>${viewEsc(entry.annulus||'—')}</span><span>${viewEsc(entry.note||'—')}</span></div>`).join('')}</div></details>`).join('');
    const pressureBlock=pressure?`<h2>Буфер және Затруб</h2>${pressure}`:'';

    const pressKeys=Object.keys(s).filter(key=>/^press_well_\d+$/.test(key)&&filled(s[key])).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
    const pressureTest=card('Сығымдау (опрессовка)',`<div class="journal-view-list">${pressKeys.map(key=>{const i=key.match(/\d+/)[0],status=s['press_status_'+i]||'—';return `<div class="journal-view-row"><span>№${viewEsc(s[key])}</span><span class="${statusClass(status)}">${viewEsc(status)}</span></div>`}).join('')}</div>`);
    const tech=card('Техника',`<div class="journal-view-list">${simpleRows([['Беларусь',s.belarus],['ППУ',s.ppu]])}</div>`);

    const cleaning=card('Тазаланған скважиналар',`<div class="journal-view-list">${simpleRows([['Қолмен тазаланған скважиналар',s.manualCleaning],['Бульдозермен тазаланған скважиналар',s.bulldozerCleaning],['ППУ-мен жуылған скважина / ЗУ / басқа объект',s.ppuWashedObjects]])}</div>`);
    const packing=card('Тығырық / сальник',simpleRows([['Скважина №',s.packingWells]]));
    const belt=card('Белдік / ремень',simpleRows([['Скважина №',s.beltWells]]));
    const work=card('Жасалған жұмыстар',filled(s.workInfo)?`<p style="white-space:pre-wrap;margin-bottom:0">${viewEsc(s.workInfo)}</p>`:'');

    const repairKeys=Object.keys(s).filter(key=>/^repair_well_\d+$/.test(key)&&[s[key],s['repair_type_'+key.match(/\d+/)[0]],s['repair_team_'+key.match(/\d+/)[0]],s['repair_info_'+key.match(/\d+/)[0]]].some(filled)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
    const repairs=repairKeys.length?card('ЖАЖ / КЖАЖ-да тұрған скважиналар туралы ақпарат',`<div class="view-repair-scroll"><div class="view-repair-table"><div class="view-repair-head"><span>Скв №</span><span>Жұмыс түрі</span><span>Бригада №</span><span>Ақпарат</span></div>${repairKeys.map(key=>{const i=key.match(/\d+/)[0];return `<div class="view-repair-row"><span>${viewEsc(s[key]||'—')}</span><span>${viewEsc(s['repair_type_'+i]||'—')}</span><span>${viewEsc(s['repair_team_'+i]||'—')}</span><span>${viewEsc(s['repair_info_'+i]||'—')}</span></div>`}).join('')}</div></div>`):'';

    const times=['02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00','24:00'];
    const hourlyRows=[['TQ (ТурбоКвант)',s.tqValue],['Өлшем / Замер',s.measureValue],['Жоспар / план',s.planValue],...times.map(time=>[time,s['time_'+time.replace(':','')]])];
    const hourly=card('Сағаттық өлшемдер',`<div class="journal-view-list">${simpleRows(hourlyRows)}</div>`);
    shell(`<div class="journal-view-v2"><button class="secondary" onclick="go('shiftJournal')">← Журналдар</button><h1>${viewEsc(item.date)} · ${viewEsc(item.shift)}</h1><p class="muted">${viewEsc(item.master)} · сақталды: ${new Date(item.createdAt).toLocaleString('kk-KZ')}</p>${general}${chemical}${furnaces}${pumps}${workers}${pressureBlock}${pressureTest}${tech}${cleaning}${packing}${belt}${work}${repairs}${hourly}<button class="good wide" id="exportJournalExcel" onclick="exportShiftJournalToExcel()">Excel-ге экспорттау</button></div>`);
  };
})();
