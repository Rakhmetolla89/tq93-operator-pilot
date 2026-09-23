/* Remove saved local journals from the master list after confirmation. */
(function(){
  window.deleteSavedJournal=function(id){
    const record=journalRecords().find(item=>item.id===id);
    if(!record)return;
    if(!confirm(`${record.date} · ${record.shift} журналын өшіру керек пе? Бұл әрекетті кері қайтару мүмкін емес.`))return;
    saveJournalRecords(journalRecords().filter(item=>item.id!==id));
    render();
  };
  shiftJournal=function(){
    if(user?.role!=='master'){page='home';return render();}
    const list=journalRecords();
    shell(`<button class="secondary" onclick="go('home')">← Басты бет</button><h1>Кезекшілік журналы</h1><p class="muted">${scope()} · «93» журналының мобильді нұсқасы</p><button class="wide" onclick="openJournalForm()">Жаңа тәуліктік журналды толтыру</button><section class="card"><h3>Журнал құрамы</h3><p class="muted">70 скважина, пештер, сораптар, мұнайшылар, опрессовка, техника, тазалау, ЫСЖ/ОПЗ, жасалған жұмыстар және сағаттық өлшемдер.</p></section><h2>Сақталған журналдар</h2>${list.slice().reverse().map(item=>`<div class="journal-item-row"><button class="card journal-item" onclick="openSavedJournal('${esc(item.id)}')"><b>${esc(item.date)} · ${esc(item.shift)}</b><br><span class="muted">${esc(item.master)} · ${item.entries.length} скважина</span><span class="journal-open">Ашу →</span></button><button class="journal-trash" type="button" onclick="deleteSavedJournal('${esc(item.id)}')" aria-label="Журналды өшіру" title="Журналды өшіру">🗑</button></div>`).join('')||'<div class="empty">Әзірге журнал толтырылмаған</div>'}`);
  };
})();
