const journalFormWithZuGroups=journalForm;
journalForm=function(){
  journalFormWithZuGroups();
  const form=document.querySelector('#journalForm');
  if(!form)return;
  form.querySelector('#pressureState')?.remove();
  [...form.querySelectorAll('h2')].find(node=>node.textContent.startsWith('Скважиналар'))?.remove();
};
