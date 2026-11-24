(function(){
var INT=[0,1,2,4,8,16,30],LIMIT=5,KEY="ielts-vocab-v2";
var W=[],S={c:{},st:0,last:"",n:{}},tab="study",topic="Semua",Q=[],rev=false,pi=0;
var $=function(i){return document.getElementById(i)};
function td(o){return new Date(Date.now()-new Date().getTimezoneOffset()*6e4+(o||0)*864e5).toISOString().slice(0,10)}
try{var r=localStorage.getItem(KEY);if(r)S=JSON.parse(r)}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function tick(){var t=td(0);if(S.last!==t){S.st=S.last===td(-1)?(S.st||0)+1:1;S.last=t}}
function pool(){return W.filter(function(w){return topic==="Semua"||w.topic===topic})}
function build(){var t=td(0),pl=pool(),used=S.n[t]||0;
var due=pl.filter(function(w){return S.c[w.w]&&S.c[w.w].due<=t}).map(function(w){return{w:w,nw:0}});
var nw=pl.filter(function(w){return!S.c[w.w]}).slice(0,Math.max(0,LIMIT-used)).map(function(w){return{w:w,nw:1}});
Q=due.concat(nw);rev=false}
function mask(s,w){return s.replace(new RegExp("\\b"+w+"\\w*","i"),"_____")}
function chips(a){return a.map(function(x){return'<span class="chip">'+x+"</span>"}).join("")}
function card(x){return'<div class="card"><span class="w">'+x.w+'</span><span class="pos">'+x.p+' · '+x.topic+'</span><div>'+x.id+'</div><div class="lbl">Contoh</div><div class="ex">'+x.ex+'</div><div class="lbl">Collocations</div>'+chips(x.col)+'<div class="lbl">Synonyms</div>'+chips(x.syn)+'<div class="lbl">Paraphrase</div><div class="mut">'+x.pa[0]+' → <b class="good">'+x.pa[1]+'</b></div></div>'}
function head(){var t=td(0),d=W.filter(function(w){return S.c[w.w]&&S.c[w.w].due<=t}).length;$("head").innerHTML="Streak "+(S.st||0)+" hari · "+Object.keys(S.c).length+"/"+W.length+" kata dipelajari · "+d+" jatuh tempo"}
function tabs(){var t=[["study","Belajar"],["prod","Latihan"],["stat","Statistik"]];
var o=["Semua"].concat(W.map(function(w){return w.topic}).filter(function(x,i,a){return a.indexOf(x)===i}));
$("tabs").innerHTML=t.map(function(x){return'<button class="'+(tab===x[0]?"on":"")+'" data-t="'+x[0]+'">'+x[1]+"</button>"}).join("")+'<select id="tp">'+o.map(function(x){return"<option"+(x===topic?" selected":"")+">"+x+"</option>"}).join("")+"</select>";
Array.prototype.forEach.call($("tabs").querySelectorAll("button"),function(b){b.onclick=function(){tab=b.getAttribute("data-t");if(tab==="study")build();draw()}});
$("tp").onchange=function(){topic=this.value;build();draw()}}
function grade(g){var x=Q[0],w=x.w.w,t=td(0);tick();
if(x.nw){S.c[w]={box:1,due:td(INT[1])};S.n[t]=(S.n[t]||0)+1}
else{var b=S.c[w].box;if(g===0)b=1;else if(g===2)b=Math.min(b+1,6);S.c[w]={box:b,due:td(INT[b])}}
Q.shift();rev=false;save();draw()}
window.G=grade;window.R=function(){rev=true;draw()};
function draw(){head();tabs();var v=$("v"),h="";
if(tab==="study"){if(!Q.length){h='<div class="card"><div class="w">Selesai hari ini 🎉</div><p class="mut">Tidak ada kartu jatuh tempo dan kuota kata baru ('+LIMIT+'/hari) sudah terpakai. Coba tab Latihan untuk Speaking dan Writing.</p></div>'}
else{var x=Q[0],n=Q.length;h='<p class="mut">Sisa '+n+' kartu · '+(x.nw?"kata baru":"review")+"</p>";
if(x.nw)h+=card(x.w)+'<button class="btn" onclick="G(2)">Mengerti, jadwalkan ulang</button>';
else if(!rev)h+='<div class="card"><div class="lbl">Kata apa yang cocok?</div><p class="q">'+mask(x.w.ex,x.w.w)+'</p><div class="mut">'+x.w.id+'</div></div><button class="btn" onclick="R()">Tampilkan jawaban</button>';
else h+=card(x.w)+'<div class="row"><button class="btn o" onclick="G(0)">Lupa</button><button class="btn o" onclick="G(1)">Susah</button><button class="btn" onclick="G(2)">Ingat</button></div>'}}
else if(tab==="prod"){var pl=pool(),lr=pl.filter(function(w){return S.c[w.w]}),L=lr.length?lr:pl;if(!L.length){v.innerHTML="";return}var x=L[pi%L.length];
h='<div class="card"><div class="w">'+x.w+'</div><div class="lbl">Speaking</div><div>'+x.sp+'</div><div class="lbl">Writing</div><div>'+x.wr+'</div><div class="lbl">Jawabanmu (pakai kata ini + 1 collocation, 20+ kata)</div><textarea id="ta"></textarea><div class="row" style="margin-top:8px"><button class="btn" id="ck">Cek</button><button class="btn o" id="nx">Kata lain</button></div><p id="res"></p><div class="lbl">Collocations untuk dicoba</div>'+chips(x.col)+"</div>";
v.innerHTML=h;$("nx").onclick=function(){pi++;draw()};$("ck").onclick=function(){var t=$("ta").value.toLowerCase(),n=t.split(/\s+/).filter(Boolean).length,st=x.w.slice(0,-1);
var hw=new RegExp("\\b"+st).test(t),hc=x.col.some(function(c){return new RegExp(c.toLowerCase().replace(x.w,st+"\\w*")).test(t)}),hs=x.syn.some(function(s){return t.indexOf(s)>-1});
$("res").innerHTML=(hw?'<span class="good">✓ Kata target dipakai.</span>':'<span class="bad">✗ Kata target belum dipakai.</span>')+"<br>"+(hc?'<span class="good">✓ Ada collocation.</span>':'<span class="bad">✗ Belum ada collocation utuh.</span>')+"<br>"+(n>=20?'<span class="good">✓ '+n+" kata.</span>":'<span class="bad">✗ Baru '+n+" kata, targetkan 20+.</span>")+(hs?'<br><span class="mut">Synonym juga terpakai, bagus untuk variasi.</span>':"")};return}
else{var t=td(0),bx=[0,0,0,0,0,0,0],due=0;W.forEach(function(w){var c=S.c[w.w];if(c){bx[c.box]++;if(c.due<=t)due++}});
h='<div class="card"><div class="lbl">Ringkasan</div>Total '+W.length+" kata · dipelajari "+Object.keys(S.c).length+" · jatuh tempo "+due+" · streak "+(S.st||0)+" hari</div>";
h+='<div class="card"><div class="lbl">Per level (1 baru, 6 dikuasai)</div>'+[1,2,3,4,5,6].map(function(i){return"Level "+i+": "+bx[i]}).join(" · ")+"</div>";
h+='<div class="card"><div class="lbl">Backup progress (salin untuk pindah perangkat)</div><textarea id="bk">'+JSON.stringify(S)+'</textarea><div class="row" style="margin-top:8px"><button class="btn o" id="rs">Pulihkan dari kotak</button><button class="btn o" id="rz">Reset</button></div></div>';
v.innerHTML=h;$("rs").onclick=function(){try{var o=JSON.parse($("bk").value);if(o&&o.c){S=o;save();build();draw()}}catch(e){alert("Format backup tidak valid")}};$("rz").onclick=function(){if(confirm("Hapus semua progress?")){S={c:{},st:0,last:"",n:{}};save();build();draw()}};return}
v.innerHTML=h}
fetch("data/words.json").then(function(r){return r.json()}).then(function(d){W=d;build();draw()}).catch(function(){$("v").innerHTML='<div class="card bad">Gagal memuat data/words.json. Buka lewat GitHub Pages atau server lokal (python -m http.server), bukan dengan klik dua kali file.</div>'});
})();
