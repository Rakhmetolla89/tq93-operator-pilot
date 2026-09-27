/* Red notification dots for replies, new обход records and map releases. */
(function(){
  const API='https://tq93-suggestions-service.akmoldaev-akhat.chatgpt.site';
  const MAP_VERSION='2026-09-27c';
  const key=name=>`tq93Notification:${name}:${user?.tabNo||'guest'}`;
  const get=name=>localStorage.getItem(key(name))||'';
  const set=(name,value)=>localStorage.setItem(key(name),value);
  const dot=(element,label)=>{
    if(!element)return;
    element.classList.add('notification-target');
    if(!element.querySelector('.notification-dot'))element.insertAdjacentHTML('beforeend',`<i class="notification-dot" aria-hidden="true"></i><span class="notification-dot-label">${label}</span>`);
  };
  const clear=(element)=>element?.querySelectorAll('.notification-dot,.notification-dot-label').forEach(node=>node.remove());
  const suggestionButton=()=>document.querySelector('.suggestion-button');
  const mapButton=()=>document.querySelector('.nav button[onclick="go(\'map\')"]');
  const roundsButton=()=>[...document.querySelectorAll('button')].find(button=>button.textContent.replace(/\s+/g,' ').includes('Обход туралы'));
  const roundSignature=()=>records().filter(row=>row.tabNo&&row.tabNo!==user?.tabNo).map(row=>row.id).sort().join('|');

  function refreshLocalBadges(){
    if(!user||user.role==='author')return;
    if(get('map')!==MAP_VERSION)dot(mapButton(),'Жаңа карта бар');else clear(mapButton());
    if(user.role==='master'){
      const signature=roundSignature();
      if(signature&&get('rounds')!==signature)dot(roundsButton(),'Оператор обход толтырды');else clear(roundsButton());
    }
  }

  async function refreshSuggestionBadge(){
    if(!user||user.role==='author')return;
    try{
      const response=await fetch(`${API}/api/suggestions?tabNo=${encodeURIComponent(user.tabNo)}`,{cache:'no-store'});
      const data=await response.json();
      if(!response.ok)throw new Error('load failed');
      const answered=(data.items||[]).filter(item=>item.author_response&&item.responded_at);
      const latest=answered.map(item=>`${item.id}:${item.responded_at}`).sort().join('|');
      if(latest&&get('suggestions')!==latest)dot(suggestionButton(),'Автордан жауап бар');else clear(suggestionButton());
    }catch{/* Connection errors should not interrupt normal work. */}
  }

  async function markSuggestionRepliesRead(){
    if(!user||user.role==='author')return;
    try{
      const response=await fetch(`${API}/api/suggestions?tabNo=${encodeURIComponent(user.tabNo)}`,{cache:'no-store'});
      const data=await response.json();
      if(!response.ok)return;
      const latest=(data.items||[]).filter(item=>item.author_response&&item.responded_at).map(item=>`${item.id}:${item.responded_at}`).sort().join('|');
      set('suggestions',latest);
    }catch{/* The badge can be checked again when the connection returns. */}
  }

  const previousShell=shell;
  shell=function(content){previousShell(content);setTimeout(()=>{refreshLocalBadges();refreshSuggestionBadge()},0)};
  const previousGo=go;
  go=function(nextPage){
    if(nextPage==='map')set('map',MAP_VERSION);
    if(nextPage==='rounds'&&user?.role==='master')set('rounds',roundSignature());
    previousGo(nextPage);
  };
  const previousOpenSuggestionForm=window.openSuggestionForm;
  window.openSuggestionForm=function(){
    clear(suggestionButton());
    markSuggestionRepliesRead();
    return previousOpenSuggestionForm?.apply(this,arguments);
  };
  const previousSaveInspection=saveInspection;
  saveInspection=function(){
    previousSaveInspection();
    /* The master sees this marker on the same shared device immediately. */
  };
  window.addEventListener('storage',event=>{
    if(event.key==='tq93Records')refreshLocalBadges();
  });
  setTimeout(()=>{refreshLocalBadges();refreshSuggestionBadge()},0);
})();
