// Progressive enhancement only: navigation, content and native form POST work without JS.
document.querySelectorAll('.core-player').forEach(details => {
  details.addEventListener('toggle', () => {
    const video = details.querySelector('video');
    if(details.open && !video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    if(!details.open) video.pause();
  });
});
// Netlify forms: post in place, then go to the confirmation page.
function wireForm(form, statusId, sending, failed, conversion) {
  if(!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if(!form.reportValidity() || form.elements.company_website.value) return;
    const status = document.getElementById(statusId);
    const button = form.querySelector('button[type=submit]');
    // Local previews must never report that anything was received.
    if(!['payoffcreative.com','www.payoffcreative.com'].includes(location.hostname)) {
      status.textContent = 'Preview only: nothing was sent. Submit on payoffcreative.com or email hello@payoffcreative.com.';
      status.focus(); return;
    }
    button.disabled = true; form.setAttribute('aria-busy','true'); status.textContent = sending;
    try {
      const response = await fetch('/', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()});
      if(!response.ok) throw new Error('Submission failed');
      document.dispatchEvent(new CustomEvent('payoff:conversion',{detail:{type:conversion}}));
      location.assign('/brief-received/');
    } catch {
      status.textContent = failed;
      status.focus();
    } finally { button.disabled = false; form.removeAttribute('aria-busy'); }
  });
}
const briefForm = document.getElementById('brief-form');
if(briefForm) {
  const service = new URLSearchParams(location.search).get('service');
  const select = document.getElementById('brief-service');
  if([...select.options].some(option => option.value === service)) select.value = service;
}
wireForm(briefForm, 'brief-status', 'Sending your brief…', 'Your brief did not send. Your details are still here. Try again, or email hello@payoffcreative.com.', 'brief_submitted');
wireForm(document.getElementById('treatment-form'), 'treatment-status', 'Sending your request…', 'Your request did not send. Your details are still here. Try again, or email hello@payoffcreative.com.', 'treatment_requested');
