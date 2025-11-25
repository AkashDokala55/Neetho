// home.js — Floating boxes parallax + About scroll
document.addEventListener("mousemove", (e) => {
  document.querySelectorAll(".floating-box").forEach((box) => {
    const speed = 0.02;
    const x = (window.innerWidth - e.pageX * speed) / 50;
    const y = (window.innerHeight - e.pageY * speed) / 50;
    box.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// Smooth scroll to About section
document.getElementById("aboutBtn").addEventListener("click", () => {
  document.getElementById("about").scrollIntoView({ behavior: "smooth" });
});
