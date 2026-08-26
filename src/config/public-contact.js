export const PUBLIC_CONTACT = Object.freeze({
  email: "monosolot@gmail.com",
  phoneDisplay: "+507 6350-1228",
  whatsappNumber: "50763501228",
});

export function whatsappHref(message = "") {
  const base = `https://wa.me/${PUBLIC_CONTACT.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
