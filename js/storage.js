// storage.js — groups meta + messages (localStorage)

const GROUPS_KEY = 'neetho_groups_v1'; // [{ name, emoji, preview, last }]
function loadGroups(){
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY)) || []; } catch(e){ return []; }
}
function saveGroups(arr){
  localStorage.setItem(GROUPS_KEY, JSON.stringify(arr));
}
function groupKey(name){ return `neetho_group_${name.replace(/\s+/g,'_')}`; }
function loadGroupMessages(name){
  try { return JSON.parse(localStorage.getItem(groupKey(name))) || []; } catch(e){ return []; }
}
function saveGroupMessages(name, arr){
  localStorage.setItem(groupKey(name), JSON.stringify(arr));
  // update list preview + order
  const meta = loadGroups();
  const idx = meta.findIndex(m=>m.name===name);
  const lastText = arr.length ? arr[arr.length-1].text : '';
  if(idx>=0){
    meta[idx].last = Date.now();
    meta[idx].preview = lastText;
    meta.unshift(meta.splice(idx,1)[0]); // move to top
  }else{
    meta.unshift({ name, emoji:'👥', preview:lastText, last:Date.now() });
  }
  saveGroups(meta);
}
function ensureGroup(name, emoji='👥'){
  const meta = loadGroups();
  if(!meta.some(m=>m.name===name)){
    meta.unshift({ name, emoji, preview:'', last:Date.now() });
    saveGroups(meta);
  }
}
function deleteGroup(name){
  const filtered = loadGroups().filter(m=>m.name!==name);
  saveGroups(filtered);
  localStorage.removeItem(groupKey(name));
}
function clearOnlyMessages(){
  // keep groups but clear message arrays
  const groups = loadGroups();
  groups.forEach(g => localStorage.removeItem(groupKey(g.name)));
  // also blank previews
  groups.forEach(g=>{ g.preview=''; g.last=Date.now(); });
  saveGroups(groups);
}
