const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("current-year").textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll("[data-section]")];

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === link);
    });
  });
});

if ("IntersectionObserver" in window) {
  const navigationObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + visible.target.id);
      });
    },
    { rootMargin: "-34% 0px -56% 0px", threshold: [0.01, 0.2, 0.45] },
  );

  sections.forEach((section) => {
    if (section.id) navigationObserver.observe(section);
  });
}

function animateCount(element) {
  const target = Number(element.dataset.count);
  const duration = 1150;
  const start = performance.now();

  const draw = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = Math.round(target * eased);

    if (progress < 1) {
      window.requestAnimationFrame(draw);
    }
  };

  window.requestAnimationFrame(draw);
}

const countElements = document.querySelectorAll("[data-count]");

if (reducedMotion || !("IntersectionObserver" in window)) {
  countElements.forEach((element) => {
    element.textContent = element.dataset.count;
  });
} else {
  const countObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.7 },
  );

  countElements.forEach((element) => countObserver.observe(element));
}

document.querySelectorAll("[data-dialog]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const dialog = document.getElementById(trigger.dataset.dialog);
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  });
});

document.querySelectorAll(".case-dialog").forEach((dialog) => {
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
