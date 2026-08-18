(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Opening transition
  const loader = document.querySelector(".loader");
  const finishLoading = () => window.setTimeout(() => loader?.classList.add("done"), reducedMotion ? 0 : 850);
  if (document.readyState === "complete") finishLoading();
  else window.addEventListener("load", finishLoading, { once: true });

  // Scroll reveal
  const revealItems = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Lightweight scroll-linked motion
  let scrollTicking = false;
  const updateScrollEffects = () => {
    const scrollMax = root.scrollHeight - window.innerHeight;
    root.style.setProperty("--scroll", String(scrollMax > 0 ? window.scrollY / scrollMax : 0));
    if (!reducedMotion) root.style.setProperty("--hero-y", `${Math.min(window.scrollY * 0.1, 90)}px`);
    scrollTicking = false;
  };
  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollEffects);
  };
  updateScrollEffects();
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });

  // Desktop project cursor
  const cursor = document.querySelector(".cursor");
  const cursorText = cursor?.querySelector("span");
  if (cursor && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      },
      { passive: true },
    );
    document.querySelectorAll(".cursor-view").forEach((element) => {
      element.addEventListener("pointerenter", () => {
        if (cursorText) cursorText.textContent = "VIEW";
        cursor.classList.add("active");
      });
      element.addEventListener("pointerleave", () => cursor.classList.remove("active"));
    });
  }

  // Mobile navigation
  const menu = document.querySelector(".mobile-menu");
  const menuButton = document.querySelector(".menu-button");
  const menuClose = document.querySelector(".menu-close");
  const setMenu = (open) => {
    menu?.classList.toggle("open", open);
    menu?.setAttribute("aria-hidden", String(!open));
    menuButton?.setAttribute("aria-expanded", String(open));
    body.classList.toggle("menu-active", open);
  };
  menuButton?.addEventListener("click", () => setMenu(true));
  menuClose?.addEventListener("click", () => setMenu(false));
  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

  // Subtle magnetic movement for round actions on precise pointers
  if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const bounds = button.getBoundingClientRect();
        const x = (event.clientX - bounds.left - bounds.width / 2) * 0.16;
        const y = (event.clientY - bounds.top - bounds.height / 2) * 0.16;
        button.style.translate = `${x}px ${y}px`;
      });
      button.addEventListener("pointerleave", () => { button.style.translate = "0 0"; });
    });
  }

  // Keep one capability expanded at a time
  const serviceDetails = document.querySelectorAll(".service-list details");
  serviceDetails.forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      serviceDetails.forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });

  // Mail-client contact handoff
  document.querySelector(".contact-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const project = String(form.get("project") || "");
    const message = String(form.get("message") || "");
    const subject = encodeURIComponent(`New project — ${project}`);
    const bodyCopy = encodeURIComponent(`Hello Ilyes,\n\nI’m ${name}.\n\n${message}`);
    window.location.href = `mailto:hello@ilyes.studio?subject=${subject}&body=${bodyCopy}`;
  });

  // Browser-only image compression tool
  const optimizer = document.querySelector(".optimizer");
  const optimizerOpen = document.querySelector(".optimizer-open");
  const optimizerClose = document.querySelector(".optimizer-close");
  const dropZone = document.querySelector(".drop-zone");
  const fileInput = dropZone?.querySelector("input[type='file']");
  const dropLabel = dropZone?.querySelector("span");
  const result = document.querySelector(".optimizer-result");
  const resultImage = result?.querySelector("img");
  const beforeSize = result?.querySelector(".before-size");
  const afterSize = result?.querySelector(".after-size");
  const download = result?.querySelector(".download-image");
  let outputUrl = "";

  const setOptimizer = (open) => {
    optimizer?.classList.toggle("open", open);
    optimizer?.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("modal-active", open);
    if (open) window.setTimeout(() => optimizerClose?.focus(), 100);
  };
  optimizerOpen?.addEventListener("click", () => setOptimizer(true));
  optimizerClose?.addEventListener("click", () => setOptimizer(false));
  optimizer?.addEventListener("click", (event) => {
    if (event.target === optimizer) setOptimizer(false);
  });

  const humanSize = (bytes) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
  const compressImage = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      if (dropLabel) dropLabel.textContent = "Please choose an image file";
      return;
    }
    if (dropLabel) dropLabel.textContent = "Compressing…";
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
      if (!blob) throw new Error("Compression unavailable");
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      outputUrl = URL.createObjectURL(blob);
      if (resultImage) resultImage.src = outputUrl;
      if (beforeSize) beforeSize.textContent = humanSize(file.size);
      if (afterSize) afterSize.textContent = humanSize(blob.size);
      if (download) {
        download.href = outputUrl;
        download.download = `${file.name.replace(/\.[^.]+$/, "")}-web.webp`;
      }
      if (result) result.hidden = false;
      if (dropLabel) dropLabel.textContent = "Drop another project image";
    } catch {
      if (dropLabel) dropLabel.textContent = "This format is not supported by your browser";
    }
  };

  dropZone?.addEventListener("click", () => fileInput?.click());
  dropZone?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput?.click();
    }
  });
  dropZone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
  dropZone?.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
  dropZone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
    compressImage(event.dataTransfer.files?.[0]);
  });
  fileInput?.addEventListener("change", () => compressImage(fileInput.files?.[0]));

  // Universal escape handling
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setMenu(false);
    setOptimizer(false);
  });
})();
