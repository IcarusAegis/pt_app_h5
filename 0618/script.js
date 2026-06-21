const refreshButton = document.querySelector(".refresh");

refreshButton?.addEventListener("click", () => {
  refreshButton.classList.remove("is-spinning");
  window.requestAnimationFrame(() => {
    refreshButton.classList.add("is-spinning");
  });
});

refreshButton?.addEventListener("animationend", () => {
  refreshButton.classList.remove("is-spinning");
});
