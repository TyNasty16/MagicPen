/** After a quick-add, drop `add=1`/`photo=1` from the address so a reload doesn't reopen the form. */
export function clearAddParam() {
  const h = window.location.hash.replace(/([?&])(add|photo)=1(?=&|$)/g, '$1').replace(/[?&]+$/, '').replace(/\?&+/, '?').replace(/&&+/g, '&');
  if (h !== window.location.hash) history.replaceState(null, '', h || '#/home');
}
