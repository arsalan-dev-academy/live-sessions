const requested = new URLSearchParams(location.search).get("next") || "";
const nextPage = /^[a-z]+\.html$/.test(requested) ? requested : null;

const signinForm = document.getElementById("signin-form");
const signupForm = document.getElementById("signup-form");
const title = document.getElementById("auth-title");

function showForm(which) {
  const signingUp = which === "signup";
  signinForm.hidden = signingUp;
  signupForm.hidden = !signingUp;
  title.textContent = signingUp ? "Create an account" : "Sign in";
  document.getElementById("flash").hidden = true;
}

document.getElementById("to-signup").addEventListener("click", () => showForm("signup"));
document.getElementById("to-signin").addEventListener("click", () => showForm("signin"));

async function finish() {
  const profile = await loadProfile();
  location.href = nextPage || homeFor(profile && profile.role);
}

signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = signinForm.querySelector("button[type=submit]");
  button.disabled = true;
  const form = new FormData(signinForm);
  try {
    await signIn(form.get("email").trim(), form.get("password"));
    await finish();
  } catch (error) {
    showFlash(error.message, "error");
    button.disabled = false;
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = signupForm.querySelector("button[type=submit]");
  button.disabled = true;
  const form = new FormData(signupForm);
  try {
    const data = await signUp(form.get("email").trim(), form.get("password"), form.get("full_name").trim());
    if (data.access_token) {
      await finish();
    } else {
      showFlash("Almost there. Check your inbox to confirm your email address.");
      button.disabled = false;
    }
  } catch (error) {
    showFlash(error.message, "error");
    button.disabled = false;
  }
});

initPage("public").then((ctx) => {
  if (ctx && ctx.profile) {
    document.getElementById("signed-in").hidden = false;
    document.getElementById("signed-in-name").textContent = ctx.profile.full_name || ctx.profile.email;
    document.getElementById("continue").href = nextPage || homeFor(ctx.profile.role);
    signinForm.hidden = true;
    title.hidden = true;
  }
});
