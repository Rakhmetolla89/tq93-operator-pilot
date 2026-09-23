/* Download the saved journal in the user's supplied Excel template. */
(function(){
  const nonEmpty=value=>String(value??'').trim()!=='';
  const textKey=value=>String(value??'').toLowerCase().replace(/\s+/g,' ').trim();
  const asCellValue=value=>typeof value==='number'?value:String(value??'');
  window.exportShiftJournalToExcel=async function(){
    const item=journalRecords().find(record=>record.id===selectedJournalId);
    if(!item){alert('Экспортталатын журнал табылмады.');return;}
    if(!window.XLSX){alert('Excel модулі әлі жүктелмеді. Интернет байланысын тексеріп, бетті қайта ашыңыз.');return;}
    const button=document.querySelector('#exportJournalExcel');
    if(button){button.disabled=true;button.textContent='Excel дайындалуда…';}
    try{
      const response=await fetch('shift-journal-93-template.xls');
      if(!response.ok)throw new Error('Шаблон жүктелмеді');
      const book=XLSX.read(await response.arrayBuffer(),{type:'array',cellStyles:true,sheetStubs:true});
      const sheet=book.Sheets['93'];
      if(!sheet)throw new Error('«93» парағы табылмады');
      const s=item.sections||{};
      const set=(address,value)=>{
        if(!nonEmpty(value))return;
        const old=sheet[address]||{};
        sheet[address]={...old,t:typeof value==='number'?'n':'s',v:asCellValue(value)};
      };
      const cell=(col,row)=>`${col}${row}`;
      const normalized=value=>textKey(value).replace(/[«»"']/g,'');
      const range=XLSX.utils.decode_range(sheet['!ref']);
      const wells=new Map();
      for(let row=range.s.r;row<=range.e.r;row++){
        const ref=XLSX.utils.encode_cell({r:row,c:4}),value=sheet[ref]?.v;
        if(nonEmpty(value))wells.set(String(value),row+1);
      }
      (item.entries||[]).forEach(entry=>{
        const row=wells.get(String(entry.well));if(!row)return;
        set(cell('J',row),entry.buffer);set(cell('K',row),entry.annulus);set(cell('L',row),entry.note);
      });

      /* General information area */
      set('N6',s.total);set('N7',s.working);set('Q6',s.mainPipeline);

      /* Reagent levels: identifies existing Optimax / ZU labels in the template. */
      const chemicalKeys=Object.keys(s).filter(key=>/^chemical_target_\d+$/.test(key));
      chemicalKeys.forEach(key=>{
        const level=s['chemical_level_'+key.match(/\d+/)[0]];if(!nonEmpty(level))return;
        const target=normalized(s[key]);
        for(let row=5;row<=17;row++)for(const col of ['M','P']){
          const source=sheet[cell(col,row)]?.v;if(!nonEmpty(source))continue;
          const sourceKey=normalized(source);
          const digits=String(s[key]).match(/\d+/)?.[0];
          if(sourceKey===target||(digits&&String(source).includes(digits))){set(cell(col==='M'?'N':'Q',row),level);return;}
        }
      });

      /* Furnaces are written beside the matching furnace name, preserving its position. */
      Object.keys(s).filter(key=>/^furnace_name_\d+$/.test(key)).forEach(key=>{
        const index=key.match(/\d+/)[0],name=normalized(s[key]),state=s['furnace_state_'+index],water=s['furnace_water_'+index];
        if(!nonEmpty(state)&&!nonEmpty(water))return;
        for(let row=18;row<=30;row++)for(const col of ['M','P']){
          const source=sheet[cell(col,row)]?.v;if(!nonEmpty(source))continue;
          if(normalized(source)===name){set(cell(col==='M'?'N':'Q',row),state);set(cell(col==='M'?'O':'R',row),water);return;}
        }
      });

      /* Pumps and the current shift personnel list. */
      [1,2,3,4,5,6].forEach(number=>{
        const value=s['pump_'+number];if(!nonEmpty(value))return;
        for(let row=31;row<=33;row++)for(const col of ['M','P'])if(String(sheet[cell(col,row)]?.v)===String(number)){set(cell(col==='M'?'N':'Q',row),value);return;}
      });
      Object.keys(s).filter(key=>/^worker_name_\d+$/.test(key)).sort().forEach((key,index)=>{
        const row=36+index,name=s[key],status=s['worker_status_'+key.match(/\d+/)[0]]||'Жұмыста';
        if(row<=44)set(cell('N',row),`${name} — ${status}`);
      });

      /* Pressure tests, equipment and cleaned wells. */
      Object.keys(s).filter(key=>/^press_well_\d+$/.test(key)&&nonEmpty(s[key])).sort().forEach((key,index)=>{
        const row=48+index,i=key.match(/\d+/)[0];if(row<=51){set(cell('M',row),s[key]);set(cell('N',row),s['press_status_'+i]);}
      });
      set('N58',s.belarus);set('Q58',s.ppu);set('N62',s.bulldozerCleaning);set('N64',s.manualCleaning);set('N75',s.packingWells);set('Q75',s.beltWells);

      /* Hourly figures and the work sections at the bottom of the template. */
      const timeColumns={'02:00':'G','04:00':'H','06:00':'I','08:00':'K','10:00':'M','12:00':'N','14:00':'O','16:00':'P','18:00':'Q','20:00':'R','22:00':'S'};
      Object.entries(timeColumns).forEach(([time,col])=>set(cell(col,78),s['time_'+time.replace(':','')]));
      set('C79',s.tqValue);set('C80',s.measureValue);set('F80',s.planValue);set('A82',s.workInfo);
      Object.keys(s).filter(key=>/^repair_well_\d+$/.test(key)&&[s[key],s['repair_type_'+key.match(/\d+/)[0]],s['repair_team_'+key.match(/\d+/)[0]],s['repair_info_'+key.match(/\d+/)[0]]].some(nonEmpty)).sort().forEach((key,index)=>{
        const row=83+index,i=key.match(/\d+/)[0];if(row<=91){set(cell('N',row),s['repair_type_'+i]);set(cell('O',row),s[key]);set(cell('Q',row),s['repair_team_'+i]);set(cell('R',row),s['repair_info_'+i]);}
      });
      XLSX.writeFile(book,`ТҚ-93_кезекшілік_журналы_${item.date||'күн'}.xlsx`,{bookType:'xlsx',compression:true,cellStyles:true});
    }catch(error){console.error(error);alert('Excel экспортын жасау мүмкін болмады. Қайталап көріңіз.');}
    finally{if(button){button.disabled=false;button.textContent='Excel-ге экспорттау';}}
  };
})();
