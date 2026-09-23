/* Exact-template Excel export. The template's «Карта экспорт» sheet is the source of cell positions. */
(function(){
  const hasValue=value=>String(value??'').trim()!=='';
  const value=value=>typeof value==='number'?value:String(value??'');
  const sortKeys=(source,pattern)=>Object.keys(source).filter(key=>pattern.test(key)).sort((a,b)=>Number(a.match(/\d+/)?.[0]||0)-Number(b.match(/\d+/)?.[0]||0));
  const column=address=>(String(address).match(/[A-Z]+/)||[''])[0];
  const row=address=>Number((String(address).match(/\d+/)||[0])[0]);

  window.exportShiftJournalToExcel=async function(){
    const item=journalRecords().find(record=>record.id===selectedJournalId);
    if(!item){alert('Экспортталатын журнал табылмады.');return;}
    if(!window.XLSX){alert('Excel модулі әлі жүктелмеді. Интернет байланысын тексеріп, бетті қайта ашыңыз.');return;}
    const button=document.querySelector('#exportJournalExcel');
    if(button){button.disabled=true;button.textContent='Excel дайындалуда…';}
    try{
      const response=await fetch('shift-journal-93-template.xlsx');
      if(!response.ok)throw new Error('Excel шаблоны жүктелмеді.');
      const book=XLSX.read(await response.arrayBuffer(),{type:'array',cellStyles:true,sheetStubs:true});
      const sheet=book.Sheets['93'],map=book.Sheets['Карта экспорт'];
      if(!sheet||!map)throw new Error('«93» немесе «Карта экспорт» парағы табылмады.');
      const s=item.sections||{};
      const pointer=index=>{
        const source=map[`E${4+index}`]||{};
        const raw=String(source.f||source.v||'');
        const found=raw.match(/(?:'93'!)?(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?)/);
        return found?found[1].replace(/\$/g,''):'';
      };
      const set=(address,data)=>{
        if(!address||!hasValue(data))return;
        const old=sheet[address]||{};
        sheet[address]={...old,t:typeof data==='number'?'n':'s',v:value(data)};
      };
      const setMap=(index,data)=>set(pointer(index),data);
      const writeList=(starts,rows,max=20)=>rows.slice(0,max).forEach((items,index)=>items.forEach((item,cellIndex)=>{
        const start=starts[cellIndex]; if(!start)return;
        set(`${column(start)}${row(start)+index}`,item);
      }));

      /* Header and common figures: all target coordinates come from the map sheet. */
      setMap(1,item.date);setMap(2,item.shift);setMap(3,item.master);
      setMap(4,s.total);setMap(5,s.working);setMap(6,s.stopped);
      setMap(7,s.mainPipeline);setMap(8,s.boiler);setMap(9,s.gez);

      /* Every well keeps its original row in the template; only operator data is changed. */
      const range=XLSX.utils.decode_range(sheet['!ref']),wellRows=new Map();
      for(let i=range.s.r;i<=range.e.r;i++){
        const well=sheet[XLSX.utils.encode_cell({r:i,c:4})]?.v;
        if(hasValue(well))wellRows.set(String(well),i+1);
      }
      const bufferCol=column(pointer(10)),annulusCol=column(pointer(11)),noteCol=column(pointer(12));
      (item.entries||[]).forEach(entry=>{
        const targetRow=wellRows.get(String(entry.well));if(!targetRow)return;
        set(`${bufferCol}${targetRow}`,entry.buffer);set(`${annulusCol}${targetRow}`,entry.annulus);set(`${noteCol}${targetRow}`,entry.note||entry.info);
      });

      /* Lists use the first coloured row supplied in the map. */
      const chemicals=sortKeys(s,/^chemical_target_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [s[key],s[`chemical_level_${i}`]];}).filter(items=>items.some(hasValue));
      writeList([pointer(13),pointer(14)],chemicals,8);
      const furnaces=sortKeys(s,/^furnace_name_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [s[key],s[`furnace_state_${i}`],s[`furnace_water_${i}`]];}).filter(items=>items.some(hasValue));
      writeList([pointer(15),pointer(16),pointer(17)],furnaces,12);

      setMap(18,s.workers_shift?`Вахта ${s.workers_shift}`:'');
      const workers=sortKeys(s,/^worker_name_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [s[key],s[`worker_status_${i}`]||'Жұмыста'];}).filter(items=>hasValue(items[0]));
      writeList([pointer(19),pointer(20)],workers,10);

      const pumps=[1,2,3,4,5,6].map(number=>s[`pump_${number}`]);
      const pumpBase=pointer(21);if(pumpBase){
        const leftCol=column(pumpBase),baseRow=row(pumpBase),rightCol=XLSX.utils.encode_col(XLSX.utils.decode_col(leftCol)+3);
        pumps.forEach((pump,index)=>set(`${index<3?leftCol:rightCol}${baseRow+(index%3)}`,pump));
      }

      const pressure=sortKeys(s,/^press_well_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [s[key],s[`press_status_${i}`]];}).filter(items=>items.some(hasValue));
      writeList([pointer(22),pointer(23)],pressure,4);
      const tech=[['Беларусь',s.belarus],['ППУ',s.ppu]].filter(items=>hasValue(items[1]));
      writeList([pointer(24),pointer(25)],tech,4);

      setMap(26,s.manualCleaning);setMap(27,s.bulldozerCleaning);setMap(28,s.ppuWashedObjects);
      setMap(29,s.tqValue);setMap(30,s.measureValue);setMap(31,s.planValue);

      /* The user marked this yellow area A82:L91. New lines remain readable within its merged area. */
      const workCell=pointer(32);if(workCell&&hasValue(s.workInfo))set(workCell,s.workInfo);

      /* Green rows M82:S91: work type, well number, crew and free-text information. */
      const repairs=sortKeys(s,/^repair_well_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [s[`repair_type_${i}`],s[key],s[`repair_team_${i}`],s[`repair_info_${i}`]];}).filter(items=>items.some(hasValue));
      writeList([pointer(34),pointer(33),pointer(35),pointer(36)],repairs,10);

      const timeMap={'02:00':'G','04:00':'H','06:00':'I','08:00':'K','10:00':'M','12:00':'N','14:00':'O','16:00':'P','18:00':'Q','20:00':'R','22:00':'S'};
      Object.entries(timeMap).forEach(([time,col])=>set(`${col}77`,s[`time_${time.replace(':','')}`]));
      XLSX.writeFile(book,`ТҚ-93_кезекшілік_журналы_${item.date||'күн'}.xlsx`,{bookType:'xlsx',compression:true,cellStyles:true});
    }catch(error){console.error(error);alert(error.message||'Excel экспортын жасау мүмкін болмады.');}
    finally{if(button){button.disabled=false;button.textContent='Excel-ге экспорттау';}}
  };
})();
