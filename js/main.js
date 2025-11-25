// js/main.js
function startChat() {
  window.location.href = "chat.html";
}

function goToAdd() {
  window.location.href = "add.html";
}

// Play background music when page loads
window.onload = () => {
  const music = document.getElementById("bgMusic");
  music.volume = 0.2;
  music.play().catch(() => {
    console.log("Autoplay blocked. User interaction required.");
  });
};
