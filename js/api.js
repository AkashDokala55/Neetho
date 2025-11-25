// replies.js - small sentiment keywords + templates for emotional replies (Telugu+English)
const REPLIES = {
  sad: [
    "Nenu vinnanu... adi chala kastam. I am with you.",
    "Sometimes silence feels heavy. Take a breath — I am here.",
    "You didn't deserve this pain. You are brave for sharing."
  ],
  angry: [
    "I can feel your anger. Take a small pause, breathe slowly.",
    "It's okay to be angry. Let it out safely — I'm here."
  ],
  neutral: [
    "I am listening — say anything, take your time.",
    "You're not alone in this moment. I am here.",
    "Tell me more when you're ready."
  ]
};

function detectEmotion(text) {
  if (!text) return 'neutral';
  const s = text.toLowerCase();
  const sadK = ['badha','dukham','dhukham','sad','hurt','tension','kasta','lonely','alone','miss','miss you','depressed','sadness'];
  const angryK = ['angry','hate','kick','fight','annoy','irrit','rage','cheta'];
  for (const k of sadK) if (s.includes(k)) return 'sad';
  for (const k of angryK) if (s.includes(k)) return 'angry';
  return 'neutral';
}

function pickReply(text, friendName) {
  const emo = detectEmotion(text);
  const pool = REPLIES[emo] || REPLIES.neutral;
  let r = pool[Math.floor(Math.random()*pool.length)];
  // personalize using friendName occasionally
  if (friendName && Math.random() > 0.4) {
    r = r.replace(/(^| )/,'').trim();
    // add personalization
    r = (r + " — " + (friendName) ).replace(/\s+/g,' ');
  }
  return r;
}
