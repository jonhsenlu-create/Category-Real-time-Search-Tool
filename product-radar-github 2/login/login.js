document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const account = document.querySelector("#account").value.trim();
  if (!account) return;
  localStorage.setItem("radarUser", account);
  window.location.href = "/radar/";
});
