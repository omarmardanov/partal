const GA_ID = "G-R71R9SCS82";

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", GA_ID, { page_title: "Partal", send_page_view: true });

const s = document.createElement("script");
s.async = true;
s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
document.head.appendChild(s);

export function gaEvent(name, params) { gtag("event", name, params || {}); }
