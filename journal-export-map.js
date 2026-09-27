/* Template-driven export. Every target comes from the «Карта экспорт» sheet. */
(function(){
  const filled=value=>String(value??'').trim()!=='';
  const col=address=>(String(address).match(/[A-Z]+/)||[''])[0];
  const row=address=>Number((String(address).match(/\d+/)||[0])[0]);
  const alpha=letters=>String(letters).split('').reduce((total,char)=>total*26+char.charCodeAt(0)-64,0);
  const key=text=>String(text??'').trim().toLocaleLowerCase('kk-KZ');
  const keys=(source,pattern)=>Object.keys(source).filter(name=>pattern.test(name)).sort((a,b)=>Number(a.match(/\d+/)?.[0]||0)-Number(b.match(/\d+/)?.[0]||0));
  const offset=(address,amount)=>`${col(address)}${row(address)+amount}`;

  const ensureZip=()=>window.JSZip?Promise.resolve():new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('Excel пішімін сақтау модулі жүктелмеді.'));document.head.appendChild(script);
  });

  async function saveUnchangedTemplate(buffer,changes,fileName){
    await ensureZip();const zip=await JSZip.loadAsync(buffer),path='xl/worksheets/sheet1.xml';
    const documentXml=new DOMParser().parseFromString(await zip.file(path).async('string'),'application/xml');
    const ns=documentXml.documentElement.namespaceURI,data=documentXml.getElementsByTagNameNS(ns,'sheetData')[0];
    const all=(parent,name)=>Array.from(parent.getElementsByTagNameNS(ns,name));const make=name=>documentXml.createElementNS(ns,name);
    const split=address=>({column:col(address),row:row(address)}),findRow=number=>all(data,'row').find(node=>Number(node.getAttribute('r'))===number),findCell=address=>all(data,'c').find(node=>node.getAttribute('r')===address);
    const addRow=number=>{const node=make('row');node.setAttribute('r',String(number));const next=all(data,'row').find(item=>Number(item.getAttribute('r'))>number);data.insertBefore(node,next||null);return node;};
    const addCell=(address,targetRow)=>{const node=make('c');node.setAttribute('r',address);const cells=all(targetRow,'c'),target=alpha(split(address).column),next=cells.find(cell=>alpha(split(cell.getAttribute('r')).column)>target),near=[...cells].sort((a,b)=>Math.abs(alpha(split(a.getAttribute('r')).column)-target)-Math.abs(alpha(split(b.getAttribute('r')).column)-target))[0];if(near?.hasAttribute('s'))node.setAttribute('s',near.getAttribute('s'));targetRow.insertBefore(node,next||null);return node;};
    changes.forEach((value,address)=>{const point=split(address);let targetRow=findRow(point.row);if(!targetRow)targetRow=addRow(point.row);let cell=findCell(address);if(!cell)cell=addCell(address,targetRow);while(cell.firstChild)cell.removeChild(cell.firstChild);if(typeof value==='number'){cell.removeAttribute('t');const node=make('v');node.textContent=String(value);cell.appendChild(node);}else{cell.setAttribute('t','inlineStr');const inline=make('is'),node=make('t');node.textContent=String(value??'');if(/^\s|\s$/.test(node.textContent))node.setAttribute('xml:space','preserve');inline.appendChild(node);cell.appendChild(inline);}});
    zip.file(path,new XMLSerializer().serializeToString(documentXml));const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }

  window.exportShiftJournalToExcel=async function(){
    const item=journalRecords().find(record=>record.id===selectedJournalId);if(!item){alert('Экспортталатын журнал табылмады.');return;}
    const button=document.querySelector('#exportJournalExcel');if(button){button.disabled=true;button.textContent='Excel дайындалуда…';}
    try{
      if(!window.XLSX)throw new Error('Excel модулі әлі жүктелмеді. Бетті қайта ашып көріңіз.');
      const response=await fetch('shift-journal-93-template.xlsx');if(!response.ok)throw new Error('Excel шаблоны жүктелмеді.');
      const buffer=await response.arrayBuffer(),book=XLSX.read(buffer,{type:'array',cellFormula:true,sheetStubs:true}),sheet=book.Sheets['93'],mapSheet=book.Sheets['Карта экспорт'];
      if(!sheet||!mapSheet)throw new Error('Шаблоннан «93» және «Карта экспорт» парақтары табылмады.');
      const maps=[];for(let number=5;number<=500;number++){const section=mapSheet[`B${number}`]?.v,field=mapSheet[`C${number}`]?.v,target=String(mapSheet[`E${number}`]?.f||mapSheet[`E${number}`]?.v||'');const match=target.match(/(?:'93'!)?(\$?[A-Z]{1,3}\$?\d+)/);if(section&&field&&match)maps.push({section:key(section),field:key(field),address:match[1].replace(/\$/g,'')});}
      const addresses=(section,field)=>maps.filter(item=>item.section===key(section)&&item.field.includes(key(field))).map(item=>item.address);
      const first=(section,field)=>addresses(section,field)[0]||'';
      const changes=new Map(),set=(address,value)=>{if(address&&filled(value))changes.set(address,typeof value==='number'?value:String(value));};
      const sections=item.sections||{};
      set(first('Журнал тақырыбы','Күні'),item.date);set(first('Журнал тақырыбы','Вахта'),item.shift);set(first('Журнал тақырыбы','Шебердің аты'),item.master);
      set(first('Жалпы мәлімет','Барлық скважина'),sections.total);set(first('Жалпы мәлімет','Жұмыстағы скважина'),sections.working);set(first('Жалпы мәлімет','Тоқтап тұрған'),sections.stopped);set(first('Жалпы мәлімет','Бас құбыр'),sections.mainPipeline);set(first('Жалпы мәлімет','Қазан'),sections.boiler);set(first('Жалпы мәлімет','ГӨЗ'),sections.gez);
      const range=XLSX.utils.decode_range(sheet['!ref']),wellRows=new Map();for(let r=range.s.r;r<=range.e.r;r++){const well=sheet[XLSX.utils.encode_cell({r,c:4})]?.v;if(filled(well))wellRows.set(String(well),r+1);}
      const bufferStart=first('Буфер / затруб','буфер'),annulusStart=first('Буфер / затруб','затруб'),noteStart=first('Буфер / затруб','ескерту');
      (item.entries||[]).forEach(entry=>{const targetRow=wellRows.get(String(entry.well));if(targetRow){set(`${col(bufferStart)}${targetRow}`,entry.buffer);set(`${col(annulusStart)}${targetRow}`,entry.annulus);set(`${col(noteStart)}${targetRow}`,entry.note||entry.info);}});
      const chemicalNames=addresses('Химреагент','Объект атауы'),chemicalLevels=addresses('Химреагент','Деңгейі');keys(sections,/^chemical_target_\d+$/).forEach((name,index)=>{const i=name.match(/\d+/)[0];set(chemicalNames[index],sections[name]);set(chemicalLevels[index],sections[`chemical_level_${i}`]);});
      const furnaceNames=addresses('Пештер','Пеш атауы'),furnaceStates=addresses('Пештер','Жағдайы'),furnaceWater=addresses('Пештер','Су деңгейі');keys(sections,/^furnace_name_\d+$/).forEach((name,index)=>{const i=name.match(/\d+/)[0];set(furnaceNames[index],sections[name]);set(furnaceStates[index],sections[`furnace_state_${i}`]);set(furnaceWater[index],sections[`furnace_water_${i}`]);});
      set(first('Мұнайшылар','Вахта'),sections.workers_shift);const workerNames=first('Мұнайшылар','Қызметкер аты'),workerStatuses=first('Мұнайшылар','Статусы');keys(sections,/^worker_name_\d+$/).forEach((name,index)=>{const i=name.match(/\d+/)[0];set(offset(workerNames,index),sections[name]);set(offset(workerStatuses,index),sections[`worker_status_${i}`]||'Жұмыста');});
      addresses('Сораптар','Сорап атауы').forEach((address,index)=>set(address,sections[`pump_${index+1}`]));
      const pressWells=addresses('Опрессовка','Скважина №'),pressStates=addresses('Опрессовка','Опрессовка:');keys(sections,/^press_well_\d+$/).forEach((name,index)=>{const i=name.match(/\d+/)[0];set(pressWells[index],sections[name]);set(pressStates[index],sections[`press_status_${i}`]);});
      set(first('Техника','Техника атауы'),sections.belarus);set(first('Техника','Саны / ақпараты'),sections.ppu);
      const splitList=value=>String(value||'').split(/[,;\n]+/).map(item=>item.trim()).filter(Boolean);
      set(first('Тазаланған скважиналар','Қолмен'),sections.manualCleaning);set(first('Тазаланған скважиналар','Бульдозермен'),sections.bulldozerCleaning);addresses('Тазаланған скважиналар','ППУ-мен').forEach((address,index)=>set(address,splitList(sections.ppuWashedObjects)[index]));
      addresses('Тығырық / сальник','Скважина №').forEach((address,index)=>set(address,splitList(sections.packingWells)[index]));
      addresses('Белдік / ремень','Скважина №').forEach((address,index)=>set(address,splitList(sections.beltWells)[index]));
      set(first('Сағаттық өлшем','TQ'),sections.tqValue);set(first('Сағаттық өлшем','Өлшем'),sections.measureValue);set(first('Сағаттық өлшем','Жоспар'),sections.planValue);const hourTargets=maps.filter(item=>item.section===key('Сағаттық өлшем')).slice(3).map(item=>item.address);['0200','0400','0600','0800','1000','1200','1400','1600','1800','2000','2200','2400'].forEach((hour,index)=>set(hourTargets[index],sections[`time_${hour}`]));
      set(first('Жасалған жұмыстар','Барлық орындалған'),sections.workInfo);
      const repairType=first('ЖАЖ / КЖАЖ','Жұмыс түрі'),repairWell=first('ЖАЖ / КЖАЖ','Скважина нөмірі'),repairTeam=first('ЖАЖ / КЖАЖ','Бригада нөмірі');keys(sections,/^repair_well_\d+$/).forEach((name,index)=>{const i=name.match(/\d+/)[0];set(offset(repairType,index),sections[`repair_type_${i}`]);set(offset(repairWell,index),sections[name]);set(offset(repairTeam,index),sections[`repair_team_${i}`]);set(`${XLSX.utils.encode_col(XLSX.utils.decode_col(col(repairTeam))+1)}${row(repairTeam)+index}`,sections[`repair_info_${i}`]);});
      const treatmentColumns=['Скв №','Өңдеу түрі','Көлемі','Р басы','Р соңы','Ескерту'].map(field=>first('Скважиналарды өңдеу-сауықтыру жұмыстары',field));[1,2,3,4].forEach((number,index)=>{const values=[sections[`twell_${number}`],sections[`ttype_${number}`],sections[`tvolume_${number}`],sections[`tstart_${number}`],sections[`tend_${number}`],sections[`tnote_${number}`]];values.forEach((value,columnIndex)=>set(offset(treatmentColumns[columnIndex],index),value));});
      await saveUnchangedTemplate(buffer,changes,`ТҚ-93_кезекшілік_журналы_${item.date||'күн'}.xlsx`);
    }catch(error){console.error(error);alert(error.message||'Excel экспортын жасау мүмкін болмады.');}
    finally{if(button){button.disabled=false;button.textContent='Excel-ге экспорттау';}}
  };
})();
