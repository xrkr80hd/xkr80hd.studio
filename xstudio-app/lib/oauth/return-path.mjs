// Shared with the login form. Never accept an external or arbitrary redirect.
export function safeReturn(value){return typeof value==='string'&&value.length<=12000&&value.startsWith('/oauth/authorize?')&&!/[\r\n]/.test(value)?value:'/';}
