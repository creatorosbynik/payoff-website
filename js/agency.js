// Progressive enhancement only: navigation, content and native form POST work without JS.
document.querySelectorAll('.core-player').forEach(details => {
  details.addEventListener('toggle', () => {
    const video = details.querySelector('video');
    if(details.open && !video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    if(!details.open) video.pause();
  });
});
const briefForm = document.getElementById('brief-form');
if(briefForm) {
  const service = new URLSearchParams(location.search).get('service');
  const select = document.getElementById('brief-service');
  if([...select.options].some(option => option.value === service)) select.value = service;
  briefForm.addEventListener('submit', async event => {
    event.preventDefault();
    if(!briefForm.reportValidity() || briefForm.elements.company_website.value) return;
    const status = document.getElementById('brief-status');
    const button = briefForm.querySelector('button[type=submit]');
    // Local previews must never report that a brief was received.
    if(['localhost','127.0.0.1',''].includes(location.hostname)) {
      status.textContent = 'Preview only: nothing was sent. Submit on payoffcreative.com or email hello@payoffcreative.com.';
      status.focus(); return;
    }
    button.disabled = true; briefForm.setAttribute('aria-busy','true'); status.textContent = 'Sending your brief…';
    try {
      const response = await fetch('/', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(briefForm)).toString()});
      if(!response.ok) throw new Error('Submission failed');
      document.dispatchEvent(new CustomEvent('payoff:conversion',{detail:{type:'brief_submitted'}}));
      location.assign('/brief-received/');
    } catch {
      status.textContent = 'Your brief did not send. Your details are still here. Try again, or email hello@payoffcreative.com.';
      status.focus();
    } finally { button.disabled = false; briefForm.removeAttribute('aria-busy'); }
  });
}
