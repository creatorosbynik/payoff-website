window.addEventListener("load", function () {
  if (!window.netlifyIdentity) return;
  netlifyIdentity.on("init", function (user) {
    if (!user) {
      netlifyIdentity.on("login", function () { document.location.href = "/admin/"; });
    }
  });
  if (/invite_token=|recovery_token=|confirmation_token=/.test(document.location.hash)) {
    netlifyIdentity.open();
  }
});
