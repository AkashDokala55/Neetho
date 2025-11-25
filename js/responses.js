// responses.js — empathetic local fallback (stable, no backend needed)

const REPLIES = {
  sad: [
    "Nenu vinnanu… adhi chala kastam. Nenu unna.",
    "Sometimes silence is loud — I’m here with you.",
    "You didn’t deserve that pain. Cheppu…"
  ],
  angry: [
    "Koapam valid ra. Breathe… nenu vinnanu.",
    "Let it out safely. I’m still here."
  ],
  neutral: [
    "I’m listening… take your time.",
    "You’re not alone in this moment."
  ]
};
function detectEmotion(text=''){
  const t = text.toLowerCase();
  const sad = ['badha','sad','hurt','lonely','miss','pain','cry','dukham','depressed','emotional'];
  const angry = ['angry','hate','mad','irrit','fight','frustrated','cheta'];
  if(sad.some(w=>t.includes(w))) return 'sad';
  if(angry.some(w=>t.includes(w))) return 'angry';
  return 'neutral';
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
window.localFallbackReply = function(userText, groupName){
  const emo = detectEmotion(userText);
  let r = pick(REPLIES[emo]);
  if(groupName && Math.random()>0.4) r += ` — ${groupName}`;
  return r;
};
