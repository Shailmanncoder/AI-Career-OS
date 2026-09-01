const THEME_SCRIPT = `(function(){try{
var m=localStorage.getItem("theme")||"system";
var d=false;
if(m==="dark"){d=true}
else if(m==="light"){d=false}
else if(m==="daylight"){
  var c=null;try{c=JSON.parse(localStorage.getItem("theme:daylight")||"null")}catch(e){}
  if(c&&typeof c.isDay==="boolean"&&Date.now()-c.resolvedAt<1800000){d=!c.isDay}
  else{var h=new Date().getHours();d=!(h>=7&&h<19)}
}
else{d=window.matchMedia("(prefers-color-scheme: dark)").matches}
var r=document.documentElement;
r.classList.toggle("dark",d);
r.style.colorScheme=d?"dark":"light";
r.dataset.theme=d?"dark":"light";
}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
