import{w as e,j as t,M as s,L as a,O as o,S as r,a as n}from"./chunk-OE4NN4TA-CKpSLUnh.js";const c=`
  try {
    const t = localStorage.getItem('beadee-theme') || 'dark'
    document.documentElement.dataset.theme =
      t === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t
  } catch(e) {}
`,l=e(function(){return t.jsxs("html",{lang:"en",children:[t.jsxs("head",{children:[t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),t.jsx("title",{children:"beadee"}),t.jsx(s,{}),t.jsx(a,{}),t.jsx("script",{dangerouslySetInnerHTML:{__html:c}})]}),t.jsxs("body",{children:[t.jsx(o,{}),t.jsx(r,{}),t.jsx(n,{})]})]})});export{l as default};
