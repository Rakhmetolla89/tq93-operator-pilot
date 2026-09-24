/* A ZIP-level export: values change, but every Excel border, merge and print setting remains. */
(function(){
  const hasValue=v=>String(v??'').trim()!=='';
  const text=v=>typeof v==='number'?v:String(v??'');
  const column=a=>(String(a).match(/[A-Z]+/)||[''])[0];
  const row=a=>Number((String(a).match(/\d+/)||[0])[0]);
  const colNumber=letters=>String(letters).split('').reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
  const ordered=(source,pattern)=>Object.keys(source).filter(key=>pattern.test(key)).sort((a,b)=>Number(a.match(/\d+/)?.[0]||0)-Number(b.match(/\d+/)?.[0]||0));

  async function downloadOriginalLayout(buffer,changes,fileName){
    if(!window.JSZip)throw new Error('Excel пішімін сақтау модулі жүктелмеді. Бетті қайта ашып көріңіз.');
    const zip=await JSZip.loadAsync(buffer),path='xl/worksheets/sheet1.xml';
    const documentXml=new DOMParser().parseFromString(await zip.file(path).async('string'),'application/xml');
    const ns=documentXml.documentElement.namespaceURI,table=documentXml.getElementsByTagNameNS(ns,'sheetData')[0];
    const all=(parent,name)=>Array.from(parent.getElementsByTagNameNS(ns,name));
    const make=name=>documentXml.createElementNS(ns,name);
    const parse=address=>({col:column(address),row:row(address)});
    const findRow=number=>all(table,'row').find(node=>Number(node.getAttribute('r'))===number);
    const findCell=address=>all(table,'c').find(node=>node.getAttribute('r')===address);
    const addRow=number=>{const node=make('row');node.setAttribute('r',String(number));const next=all(table,'row').find(item=>Number(item.getAttribute('r'))>number);table.insertBefore(node,next||null);return node;};
    const addCell=(address,targetRow)=>{
      const node=make('c');node.setAttribute('r',address);const cells=all(targetRow,'c'),target=colNumber(parse(address).col);
      const next=cells.find(cell=>colNumber(parse(cell.getAttribute('r')).col)>target);
      const neighbour=[...cells].sort((a,b)=>Math.abs(colNumber(parse(a.getAttribute('r')).col)-target)-Math.abs(colNumber(parse(b.getAttribute('r')).col)-target))[0];
      if(neighbour?.hasAttribute('s'))node.setAttribute('s',neighbour.getAttribute('s'));targetRow.insertBefore(node,next||null);return node;
    };
    changes.forEach((data,address)=>{
      const point=parse(address);let targetRow=findRow(point.row);if(!targetRow)targetRow=addRow(point.row);
      let cell=findCell(address);if(!cell)cell=addCell(address,targetRow);while(cell.firstChild)cell.removeChild(cell.firstChild);
      if(typeof data==='number'){cell.removeAttribute('t');const value=make('v');value.textContent=String(data);cell.appendChild(value);return;}
      cell.setAttribute('t','inlineStr');const inline=make('is'),value=make('t');value.textContent=String(data??'');
      if(/^\s|\s$/.test(value.textContent))value.setAttribute('xml:space','preserve');inline.appendChild(value);cell.appendChild(inline);
    });
    zip.file(path,new XMLSerializer().serializeToString(documentXml));
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}),link=document.createElement('a');
    link.href=URL.createObjectURL(blob);link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }

  window.exportShiftJournalToExcel=async function(){
    const item=journalRecords().find(record=>record.id===selectedJournalId);
    if(!item){alert('Экспортталатын журнал табылмады.');return;}
    if(!window.XLSX){alert('Excel модулі әлі жүктелмеді. Интернет байланысын тексеріп, бетті қайта ашыңыз.');return;}
    const button=document.querySelector('#exportJournalExcel');if(button){button.disabled=true;button.textContent='Excel дайындалуда…';}
    try{
      const response=await fetch('shift-journal-93-template.xlsx');if(!response.ok)throw new Error('Excel шаблоны жүктелмеді.');
      const buffer=await response.arrayBuffer(),book=XLSX.read(buffer,{type:'array',cellStyles:true,sheetStubs:true});
      const sheet=book.Sheets['93'],map=book.Sheets['Карта экспорт'];if(!sheet||!map)throw new Error('«93» немесе «Карта экспорт» парағы табылмады.');
      const sections=item.sections||{},changes=new Map();
      const pointer=index=>{const cell=map[`E${4+index}`]||{},raw=String(cell.f||cell.v||''),found=raw.match(/(?:'93'!)?(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?)/);return found?found[1].replace(/\$/g,''):'';};
      const set=(address,data)=>{if(address&&hasValue(data))changes.set(address,typeof data==='number'?data:text(data));};
      const setMap=(index,data)=>set(pointer(index),data);
      const list=(starts,items,limit=20)=>items.slice(0,limit).forEach((values,index)=>values.forEach((entry,cellIndex)=>{const start=starts[cellIndex];if(start)set(`${column(start)}${row(start)+index}`,entry);}));
      setMap(1,item.date);setMap(2,item.shift);setMap(3,item.master);setMap(4,sections.total);setMap(5,sections.working);setMap(6,sections.stopped);setMap(7,sections.mainPipeline);setMap(8,sections.boiler);setMap(9,sections.gez);
      const range=XLSX.utils.decode_range(sheet['!ref']),wellRows=new Map();for(let i=range.s.r;i<=range.e.r;i++){const well=sheet[XLSX.utils.encode_cell({r:i,c:4})]?.v;if(hasValue(well))wellRows.set(String(well),i+1);}
      const bufferColumn=column(pointer(10)),annulusColumn=column(pointer(11)),noteColumn=column(pointer(12));
      (item.entries||[]).forEach(entry=>{const wellRow=wellRows.get(String(entry.well));if(wellRow){set(`${bufferColumn}${wellRow}`,entry.buffer);set(`${annulusColumn}${wellRow}`,entry.annulus);set(`${noteColumn}${wellRow}`,entry.note||entry.info);}});
      const chemistry=ordered(sections,/^chemical_target_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [sections[key],sections[`chemical_level_${i}`]];}).filter(values=>values.some(hasValue));list([pointer(13),pointer(14)],chemistry,8);
      const furnaces=ordered(sections,/^furnace_name_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [sections[key],sections[`furnace_state_${i}`],sections[`furnace_water_${i}`]];}).filter(values=>values.some(hasValue));list([pointer(15),pointer(16),pointer(17)],furnaces,12);
      setMap(18,sections.workers_shift?`Вахта ${sections.workers_shift}`:'');const workers=ordered(sections,/^worker_name_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [sections[key],sections[`worker_status_${i}`]||'Жұмыста'];}).filter(values=>hasValue(values[0]));list([pointer(19),pointer(20)],workers,10);
      const pumpBase=pointer(21);if(pumpBase){const left=column(pumpBase),base=row(pumpBase),right=XLSX.utils.encode_col(XLSX.utils.decode_col(left)+3);[1,2,3,4,5,6].forEach((number,index)=>set(`${index<3?left:right}${base+(index%3)}`,sections[`pump_${number}`]));}
      const pressure=ordered(sections,/^press_well_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [sections[key],sections[`press_status_${i}`]];}).filter(values=>values.some(hasValue));list([pointer(22),pointer(23)],pressure,4);
      list([pointer(24),pointer(25)],[['Беларусь',sections.belarus],['ППУ',sections.ppu]].filter(values=>hasValue(values[1])),4);
      setMap(26,sections.manualCleaning);setMap(27,sections.bulldozerCleaning);setMap(28,sections.ppuWashedObjects);setMap(29,sections.tqValue);setMap(30,sections.measureValue);setMap(31,sections.planValue);
      setMap(32,sections.workInfo);
      const repairs=ordered(sections,/^repair_well_\d+$/).map(key=>{const i=key.match(/\d+/)[0];return [sections[`repair_type_${i}`],sections[key],sections[`repair_team_${i}`],sections[`repair_info_${i}`]];}).filter(values=>values.some(hasValue));list([pointer(34),pointer(33),pointer(35),pointer(36)],repairs,10);
      const hours={'02:00':'G','04:00':'H','06:00':'I','08:00':'K','10:00':'M','12:00':'N','14:00':'O','16:00':'P','18:00':'Q','20:00':'R','22:00':'S'};Object.entries(hours).forEach(([hour,col])=>set(`${col}77`,sections[`time_${hour.replace(':','')}`]));
      await downloadOriginalLayout(buffer,changes,`ТҚ-93_кезекшілік_журналы_${item.date||'күн'}.xlsx`);
    }catch(error){console.error(error);alert(error.message||'Excel экспортын жасау мүмкін болмады.');}
    finally{if(button){button.disabled=false;button.textContent='Excel-ге экспорттау';}}
  };
})();
