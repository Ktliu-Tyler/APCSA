const filterButtons = document.querySelectorAll(".filter-button");
const resourceCards = document.querySelectorAll(".resource-card");

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightJavaCode(rawCode) {
  const placeholders = [];
  const stash = (className, text) => {
    const token = `\uE000${String.fromCharCode(0xE100 + placeholders.length)}\uE001`;
    placeholders.push(`<span class="code-${className}">${escapeHtml(text)}</span>`);
    return token;
  };

  let code = rawCode
    .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (match) => stash("comment", match))
    .replace(/"(?:\\.|[^"\\])*"/g, (match) => stash("string", match));

  code = escapeHtml(code)
    .replace(
      /\b(public|class|static|void|main|import|new|return|if|else|for|while|do|switch|case|break|continue|true|false|null)\b/g,
      '<span class="code-keyword">$1</span>'
    )
    .replace(/\b(int|double|boolean|char|String|Scanner|System|Integer|Math|Object|SomeClass|Car|Student|ArrayList|NullPointerException|StringIndexOutOfBoundsException)\b/g, '<span class="code-type">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="code-number">$1</span>');

  return code.replace(/\uE000([\uE100-\uF8FF])\uE001/g, (_, index) => {
    return placeholders[index.charCodeAt(0) - 0xE100];
  });
}

document.querySelectorAll("pre code").forEach((code) => {
  if (code.dataset.highlighted === "true") {
    return;
  }

  code.innerHTML = highlightJavaCode(code.textContent);
  code.dataset.highlighted = "true";
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    resourceCards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.kind === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

document.querySelectorAll("[data-progress]").forEach((checkbox) => {
  const key = `apcsa-${checkbox.dataset.progress}`;
  checkbox.checked = localStorage.getItem(key) === "true";

  checkbox.addEventListener("change", () => {
    localStorage.setItem(key, checkbox.checked ? "true" : "false");
  });
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const codeId = button.dataset.copy;
    const code = document.getElementById(codeId);

    if (!code) {
      return;
    }

    try {
      await copyText(code.innerText);
      const original = button.textContent;
      button.textContent = "Copied";
      button.classList.add("copied");
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("copied");
      }, 1400);
    } catch {
      button.textContent = "Select";
    }
  });
});

const revealButtons = document.querySelectorAll("[data-reveal]");

revealButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.reveal);

    if (!panel) {
      return;
    }

    const isVisible = panel.classList.toggle("visible");
    button.textContent = isVisible ? "收合內容" : button.dataset.originalLabel || button.textContent;
  });

  button.dataset.originalLabel = button.textContent;
});

const deck = document.querySelector("[data-deck]");

if (deck) {
  const slides = Array.from(deck.querySelectorAll("[data-slide]"));
  const currentEl = document.querySelector("[data-slide-current]");
  const totalEl = document.querySelector("[data-slide-total]");
  let currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));

  function updateDeck() {
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === currentIndex);
    });

    if (currentEl) {
      currentEl.textContent = String(currentIndex + 1);
    }

    if (totalEl) {
      totalEl.textContent = String(slides.length);
    }
  }

  function moveSlide(direction) {
    currentIndex = Math.min(slides.length - 1, Math.max(0, currentIndex + direction));
    updateDeck();
  }

  function resetCurrentRevealPanels() {
    const currentSlide = slides[currentIndex];
    currentSlide.querySelectorAll(".reveal-panel").forEach((panel) => {
      panel.classList.remove("visible");
    });
    currentSlide.querySelectorAll("[data-reveal]").forEach((button) => {
      button.textContent = button.dataset.originalLabel || button.textContent;
    });
  }

  document.querySelectorAll("[data-deck-action]").forEach((button) => {
    button.addEventListener("click", () => {
      moveSlide(button.dataset.deckAction === "next" ? 1 : -1);
    });
  });

  document.addEventListener("keydown", (event) => {
    const interactiveTag = event.target.tagName;
    const isTypingOrClicking =
      interactiveTag === "BUTTON" ||
      interactiveTag === "A" ||
      interactiveTag === "INPUT" ||
      interactiveTag === "TEXTAREA";

    if (isTypingOrClicking && event.key === " ") {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      moveSlide(1);
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      moveSlide(-1);
    }

    if (event.key.toLowerCase() === "r") {
      resetCurrentRevealPanels();
    }
  });

  updateDeck();
}
