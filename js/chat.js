// chat.js — Groups-only, working buttons, search, mic, export/delete, day dividers

let CURRENT_GROUP = null;
let voiceOn = true;

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  // Change this to your live backend URL
const API_BASE = "https://neetho.vercel.app";
  const chatListEl   = document.getElementById('chatList');
  const messagesEl   = document.getElementById('messages');
  const chatNameEl   = document.getElementById('chatName');
  const chatAvatarEl = document.getElementById('chatAvatar');
  const chatSubEl    = document.getElementById('chatSub');
  const inputText    = document.getElementById('inputText');
  const sendBtn      = document.getElementById('sendBtn');
  const micBtn       = document.getElementById('micBtn');
  const btnExport    = document.getElementById('btnExport');
  const btnDelete    = document.getElementById('btnDelete');
  const btnNew       = document.getElementById('btnNew');
  const btnSettings  = document.getElementById('btnSettings');

  // Modals & settings buttons
  const modalNew       = document.getElementById('modalNew');
  const modalSettings  = document.getElementById('modalSettings');
  const newNameEl      = document.getElementById('newName');
  const btnCancelNew   = document.getElementById('modalCancel');
  const btnCreateNew   = document.getElementById('modalCreate');
  const btnClearAll    = document.getElementById('btnClearAll');
  const btnClearChats  = document.getElementById('btnClearChats');
  const btnCloseSet    = document.getElementById('btnCloseSettings');

  // Utils
  const escapeHtml = (t="") => t.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const timeNow    = ts => new Date(ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const isSameDay  = (a,b)=> {
    const da=new Date(a), db=new Date(b);
    return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate();
  };
  const labelForDay = (ts)=>{
    const d = new Date(ts);
    const today = new Date(); today.setHours(0,0,0,0);
    const that  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (today - that) / (1000*60*60*24);
    if(diff===0) return 'Today';
    if(diff===1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
  };
  const scrollToBottom = () => requestAnimationFrame(()=> { messagesEl.scrollTop = messagesEl.scrollHeight; });

  // Sidebar render
  function renderGroupList(filter=''){
    const groups = loadGroups();
    chatListEl.innerHTML = '';
    if(!groups.length){
      chatListEl.innerHTML = "<div class='muted'>No groups. Click + New.</div>";
      return;
    }
    groups.forEach(g=>{
      if(filter && !g.name.toLowerCase().includes(filter.toLowerCase())) return;
      const card = document.createElement('div');
      card.className = 'chat-card';
      card.innerHTML = `
        <div class="chat-ava">${g.emoji || '👥'}</div>
        <div class="chat-meta">
          <div class="chat-name">${g.name}</div>
          <div class="chat-snippet">${g.preview || 'No messages yet'}</div>
        </div>
        <div class="chat-time">${g.last ? new Date(g.last).toLocaleDateString() : ''}</div>
      `;
      card.onclick = ()=> openGroup(g.name, g.emoji || '👥');
      chatListEl.appendChild(card);
    });
  }

  // Open group
  function openGroup(name, emoji='👥'){
    CURRENT_GROUP = name;
    chatNameEl.textContent = name;
    chatAvatarEl.textContent = emoji;
    chatSubEl.textContent = 'Group thread';
    renderMessages(name);
    // Header buttons
    btnExport.onclick = ()=> CURRENT_GROUP && exportJSON(CURRENT_GROUP);
    btnDelete.onclick = ()=> {
      if(!CURRENT_GROUP) return;
      if(confirm(`Delete group "${CURRENT_GROUP}" and all its messages?`)){
        deleteGroup(CURRENT_GROUP);
        CURRENT_GROUP = null;
        renderGroupList();
        messagesEl.innerHTML = `<div class="empty-state center"><div class="empty-title">Select a group</div></div>`;
        chatNameEl.textContent = 'Select a group';
        chatSubEl.textContent  = 'Open a group from the left';
        chatAvatarEl.textContent = '👥';
      }
    };
  }

  // Render messages with day dividers
  function renderMessages(groupName){
    messagesEl.innerHTML = '';
    const arr = loadGroupMessages(groupName);
    if(!arr.length){
      messagesEl.innerHTML = `<div class="empty-state center">
         <div class="empty-title">Say something to ${escapeHtml(groupName)}   </div>
         <div class="empty-sub muted">  NeeTho will reply softly.</div>
      </div>`;
      return;
    }
    let lastTs = null;
    arr.forEach(m=>{
      if(lastTs===null || !isSameDay(lastTs, m.t)){
        const div = document.createElement('div');
        div.className = 'day-divider';
        div.textContent = labelForDay(m.t);
        messagesEl.appendChild(div);
      }
      const row = document.createElement('div');
      row.className = 'msg-row';
      row.innerHTML = `
        <div class="msg ${m.from==='user' ? 'sent':'received'}">
          <div>${escapeHtml(m.text)}</div>
          <div class="ts">${timeNow(m.t)}</div>
        </div>`;
      messagesEl.appendChild(row);
      lastTs = m.t;
    });
    scrollToBottom();
  }

  // Export
  function exportJSON(groupName){
    const data = loadGroupMessages(groupName);
    const blob = new Blob([JSON.stringify(data,null,2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`neetho_${groupName}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  // Send
  // ✅ Send Message (Now with HuggingFace AI Reply)
async function sendMessage(){
  if(!CURRENT_GROUP) return alert('Open a group first');
  const txt = inputText.value.trim();
  if(!txt) return;

  // 1. Save and display user's message
  const arr = loadGroupMessages(CURRENT_GROUP);
  arr.push({ text: txt, from:'user', t: Date.now() });
  saveGroupMessages(CURRENT_GROUP, arr);
  renderMessages(CURRENT_GROUP);
  inputText.value = '';

  // 2. Show "typing..." indicator
  const typingRow = document.createElement('div');
  typingRow.className = 'msg-row';
  typingRow.innerHTML = `<div class="msg received"><div class="muted">typing...</div></div>`;
  messagesEl.appendChild(typingRow);
  scrollToBottom();

  // 3. Try HuggingFace API response through backend
  let reply = "";
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: txt }),
});
  // ✅ Send only user message

    const data = await res.json();
    reply = data.reply && data.reply !== "..." ? data.reply : null;
  } catch (err) {
    console.log("⚠️ HuggingFace API not reachable, using fallback.");
  }

  // 4. If no AI reply, use local fallback
  if (!reply) {
    reply = window.localFallbackReply ? window.localFallbackReply(txt, CURRENT_GROUP) : "I'm here. Tell me more…";
  }

  // 5. Remove typing indicator
  typingRow.remove();

  // 6. Save & display bot message
  const arr2 = loadGroupMessages(CURRENT_GROUP);
  arr2.push({ text: reply, from:'bot', t: Date.now() });
  saveGroupMessages(CURRENT_GROUP, arr2);
  renderMessages(CURRENT_GROUP);
  renderGroupList();

  // 7. Speak it (if voice is ON)
  speak(reply);
}


  // Voice
  function speak(text){
    if(!voiceOn || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.02;
    const vs = speechSynthesis.getVoices();
    if(vs?.length){
      u.voice = vs.find(v=> v.lang?.toLowerCase().includes('te')) || vs.find(v=>/female/i.test(v.name)) || vs[0];
    }
    speechSynthesis.speak(u);
  }
  function startRecognition(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return alert('Use Chrome for voice input.');
    const rec = new SR();
    rec.lang = 'te-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = e => { inputText.value = e.results[0][0].transcript; sendMessage(); };
    rec.start();
  }

  // Wire UI
  renderGroupList();
  document.getElementById('searchInput').addEventListener('input', e=> renderGroupList(e.target.value));
  sendBtn.onclick = sendMessage;
  inputText.addEventListener('keydown', e=>{
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });
  micBtn.onclick = startRecognition;

  // New group modal
  btnNew.onclick = ()=> modalNew.style.display='flex';
  btnCancelNew.onclick = ()=> modalNew.style.display='none';
  document.querySelectorAll('.ava-btn').forEach(b=>{
    b.onclick = ()=> {
      document.querySelectorAll('.ava-btn').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
    };
  });
  btnCreateNew.onclick = ()=>{
    const name = (newNameEl.value || '').trim();
    if(!name) return alert('Enter a group name');
    const emoji = document.querySelector('.ava-btn.selected')?.dataset.emoji || '👥';
    ensureGroup(name, emoji);
    modalNew.style.display='none';
    newNameEl.value = '';
    renderGroupList();
    openGroup(name, emoji);
  };

  // Settings modal
  btnSettings.onclick = ()=> modalSettings.style.display='flex';
  btnCloseSet.onclick = ()=> modalSettings.style.display='none';
  btnClearAll.onclick = ()=>{
    if(confirm('Clear ALL groups and messages?')){
      localStorage.clear();
      location.reload();
    }
  };
  btnClearChats.onclick = ()=>{
    if(confirm('Clear ONLY messages (keep groups)?')){
      clearOnlyMessages();
      renderGroupList();
      if(CURRENT_GROUP) renderMessages(CURRENT_GROUP);
    }
  };

  // Keep scroll pinned on resize
  window.addEventListener('resize', scrollToBottom);
});
