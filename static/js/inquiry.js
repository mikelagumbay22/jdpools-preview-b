/* Project inquiry form: sends to the jdpools-inquiry Worker, which emails the business.
   Native browser validation runs first (required fields, email type). */
(function () {
  var form = document.querySelector("form[data-inquiry]");
  if (!form || !window.fetch || !window.FormData) return;
  var endpoint = form.getAttribute("action");
  var t = form.querySelector('input[name="t"]');
  if (t) t.value = String(Date.now());
  var btn = form.querySelector('button[type="submit"]');
  var label = btn ? btn.textContent : "";
  var status = document.createElement("p");
  status.setAttribute("role", "alert");
  status.className = "form__status";
  status.style.cssText = "margin-top:1rem;font-weight:600;";
  status.hidden = true;
  form.appendChild(status);

  function fail() {
    status.hidden = false;
    status.style.color = "#b42318";
    status.textContent = "Sorry, we couldn't send your inquiry just now. Please try again in a moment, or call or email us directly.";
    if (btn) { btn.disabled = false; btn.textContent = label; }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.checkValidity && !form.checkValidity()) { if (form.reportValidity) form.reportValidity(); return; }
    status.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;
    fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok && d.ok, d: d }; }); })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) return fail();
        var thanks = form.getAttribute("data-thanks");
        if (thanks) { window.location.href = thanks; return; }
        var box = document.createElement("div");
        box.setAttribute("role", "status");
        box.setAttribute("tabindex", "-1");
        box.className = "form__sent";
        box.style.cssText = "padding:1.5rem;border:1px solid currentColor;border-radius:8px;";
        box.innerHTML = "<h3 class=\"h3\" style=\"margin-top:0\">Thank you! Your inquiry has been sent.</h3><p>Our team will review your project details and follow up soon using your preferred contact method.</p>";
        form.replaceWith(box);
        box.focus();
      })
      .catch(function () { if (timer) clearTimeout(timer); fail(); });
  });
})();
