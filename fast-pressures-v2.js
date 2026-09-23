const journalFormWithFastPressure=journalForm;
journalForm=function(){
  journalFormWithFastPressure();
  const form=document.querySelector('#journalForm');
  if(!form)return;
  // Only the ЗУ sections are expandable; wells themselves never open as separate cards.
  form.querySelectorAll(':scope > details.card').forEach(row=>row.hidden=true);
  const rows=window.SHIFT_JOURNAL_93||[];
  document.querySelectorAll('.pressure-group').forEach(group=>group.open=false);
  document.querySelectorAll('.pressure-row').forEach(row=>{
    const source=rows[Number(row.dataset.index)];
    if(!source)return;
    const label=row.querySelector('b');
    if(label)label.innerHTML=`<strong>№${esc(source.well)}</strong><small>Отвод ${esc(source.outlet)}</small>`;
  });
};
