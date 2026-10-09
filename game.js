const $=s=>document.querySelector(s);
const screens=[...document.querySelectorAll(".screen")];
function show(id){screens.forEach(s=>s.classList.remove("active"));$("#"+id).classList.add("active")}

const nameAudio=new Audio("assets/audio/nihen-name.mp3");
const songAudio=new Audio("assets/audio/forbidden-song.mp3");

$("#enterBtn").onclick=()=>{show("creditsScreen");runCredits()};
$("#nihenBtn").onclick=()=>playName();
$("#nihenBtn").onmouseenter=()=>playName();
function playName(){nameAudio.currentTime=0;nameAudio.play().catch(()=>{})}

const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function runCredits(){
 await wait(450);
 $("#creditLine").classList.add("show");
 await wait(4400);
 $("#creditLine").classList.remove("show");

 $("#dateLine").classList.add("show");
 await wait(4400);
 $("#dateLine").classList.remove("show");

 $("#placeLine").classList.add("show");
 await wait(4400);
 $("#placeLine").classList.remove("show");

 await wait(250);
 show("gameScreen");
 startGame();
}

const canvas=$("#game");
const ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;

const W=canvas.width;
const H=canvas.height;
const GROUND=300;
const WORLD=8500;

let running=false;
let cam=0;
let tick=0;
let stage=1;
let gemCount=0;
let cheese=0;
let kills=0;
let attackLatch=false;
let introLanded=false;
let swordCollected=false;
let gateWarned=false;
let bossSequenceStarted=false;
let bossCleared=false;
let portalTriggered=false;

const input={l:false,r:false,j:false,a:false};

const p={
 x:110,
 y:-170,
 w:38,
 h:68,
 vx:0,
 vy:0,
 on:false,
 face:1,
 sword:false,
 attack:0,
 inv:0
};

function img(src){const i=new Image();i.src=src;return i}

const art={
 fahad:img("assets/art/fahad-stable.png"),
 sword:img("assets/art/ornate-sword.png"),
 statue:img("assets/art/rat-scholar-statue.png"),
 ratPortrait:img("assets/art/rat-scholar-portrait.png"),
 portrait:img("assets/art/fahad-household-portrait.png"),
 boss:img("assets/art/sir-reginald-stable.png")
};

const solids=[
 {x:0,y:GROUND,w:680,h:60},
 {x:735,y:278,w:230,h:82},
 {x:1015,y:300,w:600,h:60},
 {x:1680,y:276,w:300,h:84},
 {x:2040,y:300,w:620,h:60},
 {x:2720,y:280,w:260,h:80},
 {x:3040,y:300,w:740,h:60},
 {x:3840,y:275,w:520,h:85},

 {x:4470,y:300,w:620,h:60},
 {x:5150,y:276,w:300,h:84},
 {x:5510,y:300,w:630,h:60},
 {x:6200,y:280,w:330,h:80},
 {x:6600,y:300,w:690,h:60},
 {x:7350,y:278,w:1150,h:82}
];

const gems=[
 {x:575,y:GROUND-42,id:1,taken:false},
 {x:1460,y:GROUND-42,id:2,taken:false},
 {x:2365,y:GROUND-42,id:3,taken:false},
 {x:3220,y:GROUND-42,id:4,taken:false},
 {x:3990,y:GROUND-42,id:5,taken:false}
];

const objects=[
 {x:880,type:"ratpainting",title:"LORD CHEESEWORTH THE LESSER",text:"Scholar. Statesman. Rodent.\n\nAccomplishments unknown.",done:false},
 {x:1910,type:"statue",title:"DR. HAMMINGTON",text:"Historian. Astronomer.\n\nLooked upward frequently.",done:false},
 {x:3500,type:"ratpainting",title:"BARON CHUHA II",text:"Remembered primarily for standing very still long enough to have this painted.",done:false},
 {x:4170,type:"ratpainting",title:"PROFESSOR RATWORTH",text:"Contribution to history:\n\nHad excellent posture.",done:false},
 {x:4520,type:"sword",title:"THE SWORD OF UNNECESSARY ESCALATION",text:"Forged sometime between the invention of metal and this morning.",done:false}
];

const enemies=[
 {x:4920,y:GROUND-50,w:36,h:50,hp:2,max:2,type:"zombie",dead:false,dir:-1},
 {x:5350,y:GROUND-50,w:36,h:50,hp:2,max:2,type:"zombie",dead:false,dir:-1},
 {x:5840,y:GROUND-48,w:36,h:48,hp:2,max:2,type:"alien",dead:false,dir:-1},
 {x:6070,y:GROUND-48,w:36,h:48,hp:2,max:2,type:"alien",dead:false,dir:-1},
 {x:6780,y:GROUND-52,w:40,h:52,hp:3,max:3,type:"zombie",dead:false,dir:-1},
 {x:7060,y:GROUND-48,w:36,h:48,hp:3,max:3,type:"alien",dead:false,dir:-1}
];

const cheeses=[630,1240,2150,2910,3730,4780,5630,6490,7210].map(x=>({x,y:GROUND-24,taken:false}));

const boss={x:7740,y:GROUND-100,w:72,h:100,dir:-1};

function bindHold(id,key){
 const el=$(id);
 el.onpointerdown=e=>{e.preventDefault();input[key]=true};
 ["pointerup","pointercancel","pointerleave"].forEach(t=>el.addEventListener(t,e=>{e.preventDefault();input[key]=false}));
}
bindHold("#leftBtn","l");
bindHold("#rightBtn","r");
bindHold("#jumpBtn","j");
bindHold("#attackBtn","a");

addEventListener("keydown",e=>{
 const k=e.key.toLowerCase();
 if(k==="a"||k==="arrowleft")input.l=true;
 if(k==="d"||k==="arrowright")input.r=true;
 if(k==="w"||k==="arrowup"||k===" ")input.j=true;
 if(k==="x"||k==="k")input.a=true;
});
addEventListener("keyup",e=>{
 const k=e.key.toLowerCase();
 if(k==="a"||k==="arrowleft")input.l=false;
 if(k==="d"||k==="arrowright")input.r=false;
 if(k==="w"||k==="arrowup"||k===" ")input.j=false;
 if(k==="x"||k==="k")input.a=false;
});

function dialogue(speaker,text,cb){
 running=false;
 $("#speaker").textContent=speaker;
 $("#dialogueText").textContent=text;
 $("#dialogue").classList.remove("hidden");
 $("#dialogueNext").onclick=()=>{
  $("#dialogue").classList.add("hidden");
  if(cb)cb();
  running=true;
  requestAnimationFrame(loop);
 };
}

function toast(html,ms=2500){
 $("#toast").innerHTML=html;
 $("#toast").classList.remove("hidden");
 clearTimeout(toast.t);
 toast.t=setTimeout(()=>$("#toast").classList.add("hidden"),ms);
}

let modalAfterClose=null;
function modal(kicker,title,text,opt={}){
 running=false;
 modalAfterClose=opt.afterClose||null;
 $("#modalKicker").textContent=kicker;
 $("#modalTitle").textContent=title;
 $("#modalText").innerText=text;
 $("#modalImage").classList.toggle("hidden",!opt.image);
 $("#modalAudio").classList.toggle("hidden",!opt.audio);
 $("#answerButtons").classList.add("hidden");
 $("#answerButtons").innerHTML="";
 $("#modalClose").classList.toggle("hidden",!!opt.hideClose);

 if(opt.image){
  $("#modalImage").src="assets/art/fahad-household-portrait.png";
  $("#modalImage").alt="Portrait of Fahad and his two dogs";
 }

 $("#modal").classList.remove("hidden");
}

function closeModal(){
 $("#modal").classList.add("hidden");
 const cb=modalAfterClose;
 modalAfterClose=null;
 if(cb){cb();return;}
 running=true;
 requestAnimationFrame(loop);
}
$("#modalClose").onclick=closeModal;

$("#modalAudio").onclick=()=>{
 songAudio.currentTime=0;
 songAudio.play().catch(()=>{});
 songAudio.onended=()=>{
  dialogue("ARCHIVIST","...\n\nWe will never speak of this again.");
 };
};

function question(kicker,title,text,choices,correctIndex,onCorrect){
 modal(kicker,title,text,{hideClose:true});
 const wrap=$("#answerButtons");
 wrap.classList.remove("hidden");

 choices.forEach((choice,index)=>{
  const b=document.createElement("button");
  b.textContent=choice;
  b.onclick=()=>{
   if(index===correctIndex){
    wrap.innerHTML="";
    const msg=document.createElement("p");
    msg.textContent=onCorrect;
    wrap.appendChild(msg);
    const c=document.createElement("button");
    c.textContent="CONTINUE";
    c.onclick=closeModal;
    wrap.appendChild(c);
   }else{
    const old=[...wrap.querySelectorAll("button")];
    old.forEach(x=>x.disabled=true);
    const msg=document.createElement("p");
    msg.textContent=title.includes("II")
      ?"ARCHIVIST: No. I expected more from the alleged historian."
      :"ARCHIVIST: Fascinating. Try that again.";
    wrap.appendChild(msg);
    setTimeout(()=>{
      wrap.innerHTML="";
      choices.forEach((choice2,index2)=>{
       const b2=document.createElement("button");
       b2.textContent=choice2;
       b2.onclick=()=>{
        if(index2===correctIndex){
         wrap.innerHTML="";
         const good=document.createElement("p");
         good.textContent=onCorrect;
         wrap.appendChild(good);
         const c=document.createElement("button");
         c.textContent="CONTINUE";
         c.onclick=closeModal;
         wrap.appendChild(c);
        }else{
         toast("TRY AGAIN");
        }
       };
       wrap.appendChild(b2);
      });
    },850);
   }
  };
  wrap.appendChild(b);
 });
}

function startGame(){
 running=true;
 requestAnimationFrame(loop);
}

function landingIntro(){
 if(introLanded)return;
 introLanded=true;
 setTimeout(()=>{
  dialogue("ARCHIVIST","Ah.\n\nFahad Cheema.\n\nHistorian. Astronomer. Alleged rodent.\n\nWe have been expecting you.",()=>{
   setTimeout(()=>dialogue("ARCHIVIST","The ears are necessary.",()=>{
    toast("<b>OBJECTIVE UPDATED</b><br>Collect five archive gems and reach the end of the kingdom.<br><br>Their purpose will become apparent eventually.<br>Probably.",4200);
   }),180);
  });
 },250);
}

function collectGem(g){
 if(g.taken)return;
 g.taken=true;
 gemCount++;
 $("#gemHud").textContent=gemCount;

 if(g.id===1){
  question(
   "ARCHIVE GEM RECOVERED   1 OF 5",
   "ARCHIVE CHECK I",
   "Which subject is most likely to make Fahad begin speaking at unreasonable length?",
   ["THE OTTOMANS","THE TUDORS","ANCIENT EGYPT"],
   0,
   "ARCHIVIST: Correct.\n\nI suspect you knew that before I finished asking."
  );
 }

 if(g.id===2){
  modal(
   "ARCHIVE GEM RECOVERED   2 OF 5",
   "THE STEPPE CHRONICLE",
   "A suspiciously detailed record concerning Mongols, horses and an unreasonable amount of territory.\n\nARCHIVIST: You look interested.\n\nOf course you do."
  );
 }

 if(g.id===3){
  question(
   "ARCHIVE GEM RECOVERED   3 OF 5",
   "ARCHIVE CHECK II",
   "Which empire built one of history's largest contiguous land empires?",
   ["THE MONGOL EMPIRE","THE OTTOMAN EMPIRE","THE BYZANTINE EMPIRE"],
   0,
   "ARCHIVIST: Correct.\n\nThat one was embarrassingly easy for you."
  );
 }

 if(g.id===4){
  modal(
   "ARCHIVE GEM RECOVERED   4 OF 5",
   "THE BARD'S CRYSTAL",
   "Date: uncertain\nOrigin: regrettably Fahad\nHistorical significance: unfortunately substantial",
   {audio:true}
  );
 }

 if(g.id===5){
  modal(
   "ARCHIVE GEM RECOVERED   5 OF 5\n\nA DISCOVERY OF QUESTIONABLE IMPORTANCE HAS BEEN MADE",
   "PORTRAIT OF SIR GOL CHUHA FAHAD CHEEMA AND HOUSEHOLD",
   "Artist unknown.\n\nDate unknown.\n\nEgo required to commission this: immeasurable.\n\nAccompanied by two beasts of considerably greater nobility.",
   {image:true}
  );
  setTimeout(()=>toast("<b>ARCHIVE CLEARANCE GRANTED</b>",2500),350);
 }
}

function nearObject(){
 return objects.find(o=>!o.done&&Math.abs((p.x+p.w/2)-o.x)<65);
}

$("#inspectBtn").onclick=()=>{
 const o=nearObject();
 if(o)inspect(o);
};

function inspect(o){
 if(o.type==="sword"&&gemCount<5){
  toast("<b>ACCESS DENIED</b><br>Five archive gems required.");
  return;
 }

 o.done=true;

 if(o.type==="ratpainting"){
  modal("GALLERY RECORD",o.title,o.text);
  if(o.title.includes("CHEESEWORTH")){
   setTimeout(()=>toast("<b>ACHIEVEMENT UNLOCKED</b><br>CULTURED<br><br>You looked at a painting."),300);
  }else{
   setTimeout(()=>toast("<b>ACHIEVEMENT UNLOCKED</b><br>ACADEMIC RODENT<br><br>You inspected another rat.<br>Progress remains unclear."),300);
  }
 }

 if(o.type==="statue"){
  modal("HISTORICAL PLAQUE",o.title,o.text);
 }

 if(o.type==="sword"){
  swordCollected=true;
  p.sword=true;
  $("#attackBtn").classList.remove("locked");
  modal(
   "RELIC DISCOVERED",
   "THE SWORD OF UNNECESSARY ESCALATION",
   "Forged sometime between the invention of metal and this morning.\n\nNEW ABILITY UNLOCKED\nATTACK",
   {afterClose:()=>{
    dialogue("ARCHIVIST","Please use it responsibly.\n\nI already regret saying that.",()=>{
     stage=2;
     $("#chapter").textContent="LEVEL TWO  THE PORTAL ROAD";
     toast("<b>LEVEL TWO</b><br>THE PORTAL ROAD",3000);
    });
   }}
  );
 }
}

function attack(){
 if(!p.sword||p.attack>0)return;
 p.attack=18;

 if(Math.abs((p.x+p.w/2)-(boss.x+boss.w/2))<120 && !bossCleared){
  if(!bossSequenceStarted){
   bossSequenceStarted=true;
   setTimeout(()=>startBossSequence(true),180);
  }else{
   toast("THE SWORD HAS ACHIEVED NOTHING");
  }
  return;
 }

 const reach={x:p.face>0?p.x+p.w-3:p.x-68,y:p.y+8,w:70,h:54};

 enemies.forEach(e=>{
  if(e.dead)return;
  if(reach.x<e.x+e.w&&reach.x+reach.w>e.x&&reach.y<e.y+e.h&&reach.y+reach.h>e.y){
   e.hp--;
   e.x+=p.face*22;

   if(e.hp<=0){
    e.dead=true;
    kills++;
    $("#enemyHud").textContent=kills;

    if(e.type==="zombie"){
     toast(kills===1?"HISTORICAL RELEVANCE REDUCED":"THE SITUATION HAS NOT IMPROVED");
    }else{
     toast(kills===3?"<b>ACHIEVEMENT UNLOCKED</b><br>FIRST CONTACT<br><br>It went poorly.":"ASTRONOMICAL DIPLOMACY FAILED");
    }
   }
  }
 });
}

function startBossSequence(attacked=false){
 running=false;
 $("#bossCard").classList.remove("hidden");
 setTimeout(()=>{
  $("#bossCard").classList.add("hidden");
  dialogue("SIR REGINALD",attacked?"Are you finished?":"You may not pass by force.",()=>{
   dialogue("SIR REGINALD","You may not pass by force.\n\nYou may, however, pass by knowing something useful.",()=>{
    bossRiddle();
   });
  });
 },1800);
}

function bossRiddle(){
 question(
  "THE RIDDLE OF THE GATE",
  "SIR REGINALD'S QUESTION",
  "I am known first for what surrounds me,\nyet that is not why you chose me.\n\nI am vast, violent and strangely protective.\n\nTitan belongs to me.\n\nWhich world am I?",
  ["SATURN","JUPITER","NEPTUNE"],
  0,
  "SIR REGINALD: ...\n\nAnnoyingly correct."
 );

 const observer=setInterval(()=>{
  if($("#modal").classList.contains("hidden")){
   clearInterval(observer);
   bossCleared=true;
   toast("<b>PASSAGE GRANTED</b>",2200);
  }
 },100);
}

function update(){
 tick++;

 if(input.a&&!attackLatch){attack();attackLatch=true}
 if(!input.a)attackLatch=false;

 p.vx=(input.r-input.l)*3.15;
 if(p.vx)p.face=Math.sign(p.vx);

 if(input.j&&p.on){
  p.vy=-8.7;
  p.on=false;
  input.j=false;
 }

 p.vy+=.43;
 p.x+=p.vx;
 p.y+=p.vy;
 p.on=false;

 solids.forEach(s=>{
  if(p.x+p.w>s.x&&p.x<s.x+s.w&&p.y+p.h>=s.y&&p.y+p.h<=s.y+14&&p.vy>=0){
   p.y=s.y-p.h;
   p.vy=0;
   p.on=true;
  }
 });

 if(!introLanded&&p.on)landingIntro();

 if(p.y>440){
  p.x=Math.max(50,p.x-160);
  p.y=150;
  p.vy=0;
 }

 if(stage===1 && p.x>4380 && gemCount<5){
  p.x=4375;
  if(!gateWarned){
   gateWarned=true;
   toast("<b>ARCHIVE GATE SEALED</b><br>Five archive gems required.",2600);
   setTimeout(()=>gateWarned=false,2800);
  }
 }

 if(stage===1 && p.x>4660 && !swordCollected){
  p.x=4655;
 }

 if(stage===2 && p.x>7640 && !bossCleared){
  p.x=7635;
  if(!bossSequenceStarted){
   bossSequenceStarted=true;
   startBossSequence(false);
  }
 }

 p.x=Math.max(0,Math.min(WORLD-p.w,p.x));

 if(p.attack>0)p.attack--;
 if(p.inv>0)p.inv--;

 gems.forEach(g=>{
  if(!g.taken&&Math.abs(p.x-g.x)<30&&Math.abs(p.y-g.y)<70){
   collectGem(g);
  }
 });

 enemies.forEach(e=>{
  if(e.dead||stage!==2)return;
  const dx=p.x-e.x;
  if(Math.abs(dx)<210)e.dir=Math.sign(dx)||e.dir;
  if(Math.abs(dx)<185)e.x+=e.dir*(e.type==="alien"?.58:.44);

  if(Math.abs(dx)<28&&Math.abs(p.y-e.y)<60&&p.inv===0){
   p.inv=65;
   p.vy=-5;
   p.x-=e.dir*18;
  }
 });

 cheeses.forEach(ch=>{
  if(!ch.taken&&Math.abs(p.x-ch.x)<28){
   ch.taken=true;
   cheese++;
   $("#cheeseHud").textContent=cheese;
   toast("CHEESE ACQUIRED<br>Purpose: unknown.");

   if(cheese===3){
    setTimeout(()=>toast("<b>ACHIEVEMENT UNLOCKED</b><br>SUSPICIOUS AMOUNT OF CHEESE"),700);
   }
   if(cheese===cheeses.length){
    setTimeout(()=>toast("<b>ACHIEVEMENT UNLOCKED</b><br>THE CHEESE QUESTION<br><br>No answers have been provided."),700);
   }
  }
 });

 $("#inspect").classList.toggle("hidden",!nearObject());

 if(bossCleared && p.x>8080 && !portalTriggered){
  portalTriggered=true;
  portalSequence();
 }

 cam=Math.max(0,Math.min(WORLD-W,p.x-W*.35));
}

async function portalSequence(){
 running=false;
 dialogue("ARCHIVIST","I should mention that we do not know where this goes.",()=>{
  dialogue("ARCHIVIST","Good luck.",async()=>{
   running=false;
   $("#gameScreen").classList.add("portalFlash");
   await wait(650);
   show("observatoryArrival");
   $("#gameScreen").classList.remove("portalFlash");
   arrivalSequence();
  });
 });
}

async function arrivalSequence(){
 await wait(900);
 $("#unknownLocation").classList.add("hidden");
 $("#knownLocation").classList.remove("hidden");

 await wait(1200);
 $("#observatoryTitle").classList.remove("hidden");

 await wait(1300);
 $("#arrivalArchivist").classList.remove("hidden");

 await wait(1100);
 $("#arrivalContinue").classList.remove("hidden");
}

$("#arrivalContinue").onclick=()=>enterObservatoryExperience();

function showEnd(){
 show("birthdayScreen");
 $("#finalStats").innerHTML=
  `<p>ARCHIVE GEMS <b>${gemCount}/5</b></p>
   <p>ENEMIES DEFEATED <b>${kills}</b></p>
   <p>CHEESE ACQUIRED <b>${cheese}</b></p>
   <p>HISTORICAL KNOWLEDGE <b>DISTURBING</b></p>
   <p>RAT STATUS <b>ALLEGATIONS PENDING</b></p>`;
}

$("#restartBtn").onclick=()=>location.reload();

function R(x,y,w,h,col){
 ctx.fillStyle=col;
 ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
function T(t,x,y,size=9,col="#eadfca",align="left"){
 ctx.fillStyle=col;
 ctx.font=`${size}px Georgia`;
 ctx.textAlign=align;
 ctx.fillText(t,x,y);
 ctx.textAlign="left";
}

function drawSky(){
 const g=ctx.createLinearGradient(0,0,0,H);

 if(stage===1){
  g.addColorStop(0,"#10142b");
  g.addColorStop(.55,"#24223b");
  g.addColorStop(1,"#463044");
 }else{
  g.addColorStop(0,"#0b0b1a");
  g.addColorStop(.5,"#1f1730");
  g.addColorStop(1,"#3b1f3c");
 }

 ctx.fillStyle=g;
 ctx.fillRect(0,0,W,H);

 for(let i=0;i<95;i++){
  let sx=(i*113-cam*.06)%W;
  if(sx<0)sx+=W;
  let sy=18+(i*47)%185;
  R(sx,sy,i%9===0?2:1,i%9===0?2:1,i%7===0?"#e9d690":"#a7a8c8");
 }

 ctx.fillStyle="#dfd4ad";
 ctx.beginPath();
 ctx.arc(525,58,31,0,Math.PI*2);
 ctx.fill();

 ctx.fillStyle="#a7a184";
 ctx.beginPath();
 ctx.arc(514,51,6,0,Math.PI*2);
 ctx.fill();

 if(stage===2){
  ctx.fillStyle="#6d3c87";
  ctx.globalAlpha=.17;
  ctx.beginPath();
  ctx.arc(565,120,85,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha=1;
 }
}

function drawArchitecture(){
 ctx.save();
 ctx.translate(-cam,0);

 for(let xx=20;xx<WORLD;xx+=240){
  const level2=xx>4500;
  R(xx,115,210,185,level2?"#1b1724":"#211926");

  for(let by=130;by<292;by+=18){
   for(let bx=xx+8;bx<xx+205;bx+=28){
    R(bx,by,22,10,level2?"#2b2234":"#302330");
   }
  }

  R(xx+78,150,54,112,"#0d0c15");
  ctx.fillStyle=level2?"#44304d":"#433448";
  ctx.beginPath();
  ctx.arc(xx+105,150,27,Math.PI,0);
  ctx.fill();
  R(xx+84,170,42,92,"#0d0c15");

  for(let w=0;w<3;w++){
   R(xx+91+w*12,181,5,34,level2?"#7d4a96":"#b77f3f");
  }

  R(xx+24,182,3,30,"#7e5a34");
  R(xx+18,180,15,4,"#b99553");
  R(xx+21,172,9,9,level2?"#a566c0":"#e4a34d");
 }

 for(let xx=360;xx<4300;xx+=620){
  R(xx,146,30,70,"#5c2535");
  R(xx+4,154,22,54,"#7c3147");
  R(xx+12,165,6,28,"#c19a58");
 }

 ctx.restore();
}

function drawPlatforms(){
 ctx.save();
 ctx.translate(-cam,0);

 solids.forEach(s=>{
  const level2=s.x>4400;
  R(s.x,s.y,s.w,s.h,level2?"#30263a":"#3b2b35");
  R(s.x,s.y,s.w,6,level2?"#8d668f":"#a08458");

  for(let by=s.y+12;by<s.y+s.h;by+=13){
   for(let bx=s.x+(by%26?7:0);bx<s.x+s.w;bx+=28){
    R(bx,by,24,9,level2?"#3b2d48":"#4a3540");
   }
  }

  for(let bx=s.x+8;bx<s.x+s.w;bx+=31){
   if((bx/31)%3<1){
    R(bx,s.y-3,14,3,level2?"#55456d":"#596044");
   }
  }
 });

 ctx.restore();
}

function drawPropImage(im,px,py,w,h,flip=false){
 if(!im.complete||!im.naturalWidth)return;
 ctx.save();
 ctx.translate(px+(flip?w:0),py);
 if(flip)ctx.scale(-1,1);
 ctx.drawImage(im,0,0,w,h);
 ctx.restore();
}

function drawGem(g){
 if(g.taken)return;
 const pulse=1+Math.sin(tick*.12+g.id)*.12;
 ctx.save();
 ctx.translate(g.x,g.y);
 ctx.scale(pulse,pulse);
 ctx.rotate(tick*.015);
 ctx.fillStyle="#9d67c5";
 ctx.beginPath();
 ctx.moveTo(0,-15);
 ctx.lineTo(11,-4);
 ctx.lineTo(8,11);
 ctx.lineTo(0,17);
 ctx.lineTo(-8,11);
 ctx.lineTo(-11,-4);
 ctx.closePath();
 ctx.fill();
 ctx.fillStyle="#e5c6ff";
 ctx.fillRect(-2,-9,4,9);
 ctx.restore();
}

function drawObjects(){
 ctx.save();
 ctx.translate(-cam,0);

 gems.forEach(drawGem);

 objects.forEach(o=>{
  if(o.type==="statue"){
   drawPropImage(art.statue,o.x-37,GROUND-112,74,112);
   if(!o.done)T("!",o.x,GROUND-122,14,"#f0cf76","center");
  }

  if(o.type==="sword"){
   if(!o.done){
    drawPropImage(art.sword,o.x-30,GROUND-112,60,112);
    T("!",o.x,GROUND-120,14,"#f0cf76","center");
   }
  }

  if(o.type==="ratpainting"){
   drawPropImage(art.ratPortrait,o.x-50,GROUND-145,100,130);
   if(!o.done)T("!",o.x,GROUND-155,14,"#f0cf76","center");
  }
 });

 cheeses.forEach(ch=>{
  if(!ch.taken){
   R(ch.x-9,ch.y,18,11,"#deb84e");
   R(ch.x+4,ch.y-5,5,5,"#deb84e");
   R(ch.x-2,ch.y+3,3,3,"#8b7032");
  }
 });

 ctx.restore();
}

function drawZombie(e){
 R(e.x+5,e.y+10,e.w-10,e.h-10,"#596858");
 R(e.x+7,e.y,e.w-14,22,"#778273");
 R(e.x+10,e.y+7,4,4,"#1f191d");
 R(e.x+e.w-14,e.y+7,4,4,"#1f191d");
 R(e.x+8,e.y+31,8,18,"#4b3940");
 R(e.x+e.w-16,e.y+31,8,18,"#4b3940");
 R(e.x+2,e.y+22,7,26,"#7d716e");
}

function drawAlien(e){
 R(e.x+7,e.y+10,e.w-14,e.h-10,"#342c54");
 R(e.x+4,e.y,e.w-8,24,"#7564a2");
 R(e.x+9,e.y+7,6,6,"#c7ffef");
 R(e.x+e.w-15,e.y+7,6,6,"#c7ffef");
 R(e.x+12,e.y+29,12,5,"#9d79d0");
 R(e.x-4,e.y+16,8,20,"#5a4978");
 R(e.x+e.w-4,e.y+16,8,20,"#5a4978");
}

function drawEnemies(){
 ctx.save();
 ctx.translate(-cam,0);

 enemies.forEach(e=>{
  if(e.dead)return;

  if(e.type==="zombie")drawZombie(e);
  else drawAlien(e);

  R(e.x-3,e.y-9,e.w+6,4,"#17121a");
  R(e.x-3,e.y-9,(e.w+6)*(e.hp/e.max),4,e.type==="alien"?"#8e67ce":"#a3535a");
 });

 if(!bossCleared){
  if(art.boss.complete&&art.boss.naturalWidth){
   drawPropImage(art.boss,boss.x-50,boss.y-68,154,184,boss.dir>0);
  }
  T("SIR REGINALD THE INCONVENIENT",boss.x+boss.w/2,boss.y-19,7,"#ead7b0","center");
 }

 ctx.restore();
}

function drawPortal(){
 ctx.save();
 ctx.translate(-cam,0);

 const x=8195;
 const y=GROUND-112;

 for(let i=0;i<5;i++){
  ctx.strokeStyle=`rgba(177,90,220,${.16+i*.12})`;
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.ellipse(x,y+55,36+i*5,54+i*5,0,0,Math.PI*2);
  ctx.stroke();
 }

 ctx.fillStyle="#24112f";
 ctx.beginPath();
 ctx.ellipse(x,y+55,31,50,0,0,Math.PI*2);
 ctx.fill();

 for(let i=0;i<18;i++){
  const a=tick*.03+i*.35;
  const r=22+(i%4)*4;
  R(x+Math.cos(a)*r,y+55+Math.sin(a)*r,2,2,"#d99bf2");
 }

 ctx.restore();
}

function drawPlayer(){
 const im=art.fahad;
 const moving=Math.abs(p.vx)>.1;
 const phase=Math.sin(tick*.42);
 const bob=p.on&&moving?Math.round(Math.abs(phase)*2):0;
 const jumpTilt=!p.on?(p.vy<0?-0.08:0.06):0;
 const attackTilt=p.attack>0?(p.attack>9?-0.12:0.16):0;
 const rot=jumpTilt+attackTilt;
 const dw=78;
 const dh=102;
 const dx=p.x-cam-20;
 const dy=p.y-34+bob;

 if(im.complete&&im.naturalWidth){
  ctx.save();
  ctx.translate(dx+dw/2,dy+dh/2);
  if(p.face<0)ctx.scale(-1,1);
  ctx.rotate(rot);
  ctx.drawImage(im,-dw/2,-dh/2,dw,dh);
  ctx.restore();
 }

 if(p.sword&&p.attack>0){
  ctx.save();
  const cx=p.x-cam+(p.face>0?50:-12);
  const cy=p.y+18;
  ctx.translate(cx,cy);
  ctx.scale(p.face,1);
  ctx.rotate(p.attack>9?-0.9:-0.18);
  if(art.sword.complete&&art.sword.naturalWidth){
   ctx.drawImage(art.sword,-9,-52,18,72);
  }
  ctx.restore();
 }
}

function draw(){
 drawSky();
 drawArchitecture();
 drawPlatforms();
 drawObjects();
 if(stage===2)drawEnemies();
 drawPortal();
 drawPlayer();
}

function loop(){
 if(!running)return;
 update();
 draw();
 requestAnimationFrame(loop);
}


/* Observatory chapter and birthday ending */
let obsStarted=false;
let obsSaturnSeen=false;
let obsFirstSkySeen=false;
let obsDoggyFound=false;
let obsGravity=0;
let obsRoutes={IO:false,GANYMEDE:false,TITAN:false};
let obsScopeIndex=0;
let obsScopeRAF=null;
let obsTouchX=null;

function enterObservatoryExperience(){
 obsStarted=true;
 show("observatoryScreen");
 $("#obsObjective").textContent="Explore the hall and find the telescope.";
 setTimeout(()=>obsSay("ARCHIVIST","Oh.\n\nThis is new.\n\n...\n\nI appear to have lost the map."),250);
}

function obsSay(speaker,text,after){
 show("gameScreen");
 dialogue(speaker,text,()=>{
  show("observatoryScreen");
  if(after)after();
 });
}

$("#inspectChart").onclick=()=>obsPopup("ARCHIVE OBJECT","STAR CHART","A star chart of suspicious complexity.\n\nIt appears to assume the viewer already knows what they are doing.");
$("#inspectInstrument").onclick=()=>obsPopup("ARCHIVE OBJECT","BRASS DEVICE","A measuring instrument of some kind.\n\nIt looks expensive and judgmental.");
$("#useTelescope").onclick=()=>openScope();
$("#firstSkyBtn").onclick=()=>{obsFirstSkySeen=true;obsGravity=Math.max(obsGravity,2);show("firstSkyScreen");updateObsUnlocks()};
$("#firstSkyBack").onclick=()=>{show("observatoryScreen");maybeGravityComment()};
$("#finalChamberBtn").onclick=()=>startFinale();

function obsPopup(kicker,title,text){
 show("gameScreen");
 modal(kicker,title,text);
 const t=setInterval(()=>{
  if($("#modal").classList.contains("hidden")){
   clearInterval(t);
   show("observatoryScreen");
  }
 },80);
}

const obsBodies=[
 {name:"JUPITER",travel:false,desc:"Large.\nViolent.\nImpressive.\n\nAn obvious place to begin.",arch:"Jupiter.\n\nLargest planet in the system.\n\nPresumably the obvious choice."},
 {name:"SATURN",travel:false,desc:"Vast.\nSevere.\nSurrounded by order, but not defined by it.",arch:"Most people notice the rings first.\n\nYou did not.\n\nYou noticed its nature.\nThe weight of it.\nThe way something immense can alter what moves around it."},
 {name:"IO",travel:true,desc:"A moon of Jupiter.\n\nVolcanic.\nUnstable.\nSlightly alarming.",arch:"It appears to be on fire.\n\nRepeatedly."},
 {name:"GANYMEDE",travel:true,desc:"A moon of Jupiter.\n\nVast.\nCold.\nQuiet.",arch:"It has a stillness to it.\n\nI do not trust it."},
 {name:"TITAN",travel:true,desc:"A moon of Saturn.\n\nDistant.\nHazy.\nDifficult to read.",arch:"Titan belongs to Saturn.\n\nYou knew that already, of course."}
];

const scopeCanvas=$("#scopeCanvas"),scopeCtx=scopeCanvas.getContext("2d");
function openScope(){show("telescopeScreen");drawScopeLoop()}
function closeScope(){if(obsScopeRAF)cancelAnimationFrame(obsScopeRAF);show("observatoryScreen");updateObsUnlocks()}
$("#scopeBack").onclick=closeScope;
$("#scopePrev").onclick=()=>{obsScopeIndex=(obsScopeIndex-1+obsBodies.length)%obsBodies.length};
$("#scopeNext").onclick=()=>{obsScopeIndex=(obsScopeIndex+1)%obsBodies.length};
$("#scopeInspect").onclick=()=>inspectScopeBody();
$("#scopeTravel").onclick=()=>travelScopeBody();
scopeCanvas.addEventListener("pointerdown",e=>{obsTouchX=e.clientX});
scopeCanvas.addEventListener("pointerup",e=>{if(obsTouchX===null)return;const dx=e.clientX-obsTouchX;if(Math.abs(dx)>35)obsScopeIndex=(obsScopeIndex+(dx<0?1:-1)+obsBodies.length)%obsBodies.length;obsTouchX=null});

function drawScopeLoop(){drawScope();obsScopeRAF=requestAnimationFrame(drawScopeLoop)}
function drawScope(){
 const c=scopeCtx;c.clearRect(0,0,640,360);
 const g=c.createRadialGradient(320,180,15,320,180,360);g.addColorStop(0,"#16203a");g.addColorStop(1,"#03040a");c.fillStyle=g;c.fillRect(0,0,640,360);
 for(let i=0;i<130;i++){const x=(i*151+Date.now()*.0008*(i%4+1))%640,y=(i*71)%360;c.fillStyle=i%7?"#9da4b8":"#e0cf8d";c.fillRect(x,y,i%13===0?2:1,i%13===0?2:1)}
 c.strokeStyle="#997744";c.lineWidth=2;c.beginPath();c.arc(320,180,120,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(320,43);c.lineTo(320,317);c.moveTo(183,180);c.lineTo(457,180);c.stroke();
 const b=obsBodies[obsScopeIndex];
 if(b.name==="JUPITER")drawScopeJupiter(c,320,180,66);
 if(b.name==="SATURN")drawScopeSaturn(c,320,180,58);
 if(b.name==="IO")drawScopeMoon(c,320,180,43,"#d5a14d","#8d4029");
 if(b.name==="GANYMEDE")drawScopeMoon(c,320,180,47,"#9da7a8","#535e66");
 if(b.name==="TITAN")drawScopeMoon(c,320,180,45,"#c88c4a","#755532");
 $("#scopeName").textContent=b.name;$("#scopeStatus").textContent=(obsScopeIndex+1)+" OF "+obsBodies.length;
 $("#scopeTravel").disabled=!b.travel;$("#scopeTravel").style.opacity=b.travel?"1":".35";
}
function drawScopeJupiter(c,x,y,r){c.fillStyle="#c7a174";c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();for(let i=-3;i<=3;i++){c.fillStyle=i%2?"#8b624e":"#e1c399";c.fillRect(x-r+5,y+i*14,r*2-10,7)}c.fillStyle="#954c3e";c.beginPath();c.ellipse(x+27,y+19,18,8,0,0,Math.PI*2);c.fill()}
function drawScopeSaturn(c,x,y,r){c.strokeStyle="#b89f70";c.lineWidth=12;c.beginPath();c.ellipse(x,y,r*1.82,r*.42,-.17,0,Math.PI*2);c.stroke();c.fillStyle="#bca175";c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.fillStyle="#89745a";for(let i=-2;i<=2;i++)c.fillRect(x-r+8,y+i*11,r*2-16,4)}
function drawScopeMoon(c,x,y,r,col,crater){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.fillStyle=crater;for(let i=0;i<9;i++){const a=i*2.4,rr=r*.55*((i%4+1)/4),cx=x+Math.cos(a)*rr,cy=y+Math.sin(a)*rr,cr=3+(i%3)*2;c.beginPath();c.arc(cx,cy,cr,0,Math.PI*2);c.fill()}}

function inspectScopeBody(){
 const b=obsBodies[obsScopeIndex];
 if(b.name==="SATURN"){obsSaturnSeen=true;obsGravity=Math.max(obsGravity,1)}
 if(obsScopeRAF)cancelAnimationFrame(obsScopeRAF);
 show("gameScreen");
 modal("CELESTIAL RECORD",b.name,b.desc+"\n\nARCHIVIST: "+b.arch);
 const t=setInterval(()=>{if($("#modal").classList.contains("hidden")){clearInterval(t);show("telescopeScreen");drawScopeLoop();updateObsUnlocks()}},80);
}
function travelScopeBody(){const b=obsBodies[obsScopeIndex];if(!b.travel)return;if(obsScopeRAF)cancelAnimationFrame(obsScopeRAF);startMoonRoute(b.name)}

const moonCanvas=$("#moonCanvas"),moonCtx=moonCanvas.getContext("2d");
let route="",moonRun=false,moonTick=0,moonCam=0;
let moonPlayer={x:70,y:235,w:35,h:60,vx:0,vy:0,on:false,face:1};
const moonInput={l:false,r:false,j:false};
let moonDogX=1110,moonBeacon=1680;
function moonHold(id,key){const el=$(id);el.onpointerdown=e=>{e.preventDefault();moonInput[key]=true};["pointerup","pointercancel","pointerleave"].forEach(t=>el.addEventListener(t,e=>{e.preventDefault();moonInput[key]=false}))}
moonHold("#moonLeft","l");moonHold("#moonRight","r");moonHold("#moonJump","j");

function startMoonRoute(name){
 route=name;show("moonRouteScreen");$("#moonRouteName").textContent=name;moonPlayer={x:70,y:235,w:35,h:60,vx:0,vy:0,on:false,face:1};moonCam=0;moonRun=true;
 moonMessage("<b>LOCATION IDENTIFIED</b><br>"+name,1700);
 setTimeout(()=>{const a={IO:"ARCHIVIST: The floor appears deeply uncommitted to remaining still.",GANYMEDE:"ARCHIVIST: I dislike how calm this is.",TITAN:"ARCHIVIST: Visibility appears optional here."};moonMessage(a[name],2500)},1800);
 requestAnimationFrame(moonLoop);
}
function moonMessage(html,ms){$("#moonMessage").innerHTML=html;$("#moonMessage").classList.remove("hidden");setTimeout(()=>$("#moonMessage").classList.add("hidden"),ms)}
function moonLoop(){if(!moonRun)return;moonUpdate();moonDraw();requestAnimationFrame(moonLoop)}
function moonUpdate(){
 moonTick++;moonPlayer.vx=(moonInput.r-moonInput.l)*2.9;if(moonPlayer.vx)moonPlayer.face=Math.sign(moonPlayer.vx);if(moonInput.j&&moonPlayer.on){moonPlayer.vy=-7.5;moonPlayer.on=false;moonInput.j=false}
 moonPlayer.vy+=(route==="TITAN"?.28:.35);moonPlayer.x+=moonPlayer.vx;moonPlayer.y+=moonPlayer.vy;moonPlayer.on=false;
 moonPlatforms().forEach(s=>{if(moonPlayer.x+moonPlayer.w>s.x&&moonPlayer.x<s.x+s.w&&moonPlayer.y+moonPlayer.h>=s.y&&moonPlayer.y+moonPlayer.h<=s.y+14&&moonPlayer.vy>=0){moonPlayer.y=s.y-moonPlayer.h;moonPlayer.vy=0;moonPlayer.on=true}});
 if(moonPlayer.y>430){moonPlayer.x=Math.max(30,moonPlayer.x-150);moonPlayer.y=170;moonPlayer.vy=0}
 moonPlayer.x=Math.max(0,Math.min(1870,moonPlayer.x));moonCam=Math.max(0,Math.min(1260,moonPlayer.x-230));
 if(route==="TITAN"&&!obsDoggyFound&&Math.abs(moonPlayer.x-moonDogX)<42){obsDoggyFound=true;obsGravity=Math.max(obsGravity,2);moonMessage("<b>DISCOVERY RECORDED</b><br>DOGGY BACHA<br><br>Current location: Titan<br>Explanation: unavailable.",3000);setTimeout(()=>moonMessage("ARCHIVIST: I have elected not to question this.",1900),3100)}
 if(moonPlayer.x>moonBeacon)completeMoonRoute();
}
function moonPlatforms(){return[{x:0,y:300,w:520,h:60},{x:570,y:275,w:210,h:85},{x:830,y:300,w:360,h:60},{x:1250,y:270,w:260,h:90},{x:1570,y:300,w:330,h:60}]}
function completeMoonRoute(){if(!moonRun)return;moonRun=false;obsRoutes[route]=true;obsGravity=Math.max(obsGravity,Object.values(obsRoutes).filter(Boolean).length>=2?2:1);moonMessage("<b>"+route+" SURVEY COMPLETE</b>",1400);setTimeout(()=>{show("telescopeScreen");drawScopeLoop();updateObsUnlocks()},1500)}
function moonDraw(){
 let top,bottom,ground,accent;if(route==="IO"){top="#30120e";bottom="#8e3c20";ground="#2d1918";accent="#ff8c32"}else if(route==="GANYMEDE"){top="#0b1320";bottom="#3e5363";ground="#39434b";accent="#a9c8d5"}else{top="#3c210f";bottom="#a76028";ground="#58412f";accent="#d5a058"}
 const g=moonCtx.createLinearGradient(0,0,0,360);g.addColorStop(0,top);g.addColorStop(1,bottom);moonCtx.fillStyle=g;moonCtx.fillRect(0,0,640,360);
 for(let i=0;i<55;i++){const x=(i*119-moonCam*.06)%640,y=20+(i*53)%180;moonCtx.fillStyle=route==="TITAN"?"rgba(230,184,115,.26)":"rgba(255,255,255,.35)";moonCtx.fillRect(x,y,1,1)}
 if(route==="TITAN")drawScopeSaturn(moonCtx,520,72,36);
 if(route==="IO"){for(let i=0;i<5;i++){moonCtx.fillStyle="#f06b29";moonCtx.beginPath();moonCtx.moveTo((i*170-moonCam*.15)%800,265);moonCtx.lineTo((i*170+20-moonCam*.15)%800,205-(i%2)*35);moonCtx.lineTo((i*170+40-moonCam*.15)%800,265);moonCtx.fill()}}
 moonCtx.save();moonCtx.translate(-moonCam,0);moonPlatforms().forEach(s=>{moonCtx.fillStyle=ground;moonCtx.fillRect(s.x,s.y,s.w,s.h);moonCtx.fillStyle=accent;moonCtx.fillRect(s.x,s.y,s.w,4);for(let x=s.x+10;x<s.x+s.w;x+=38){moonCtx.fillStyle="rgba(0,0,0,.18)";moonCtx.fillRect(x,s.y+15+(x%30),22,7)}});
 moonCtx.fillStyle="#c6ae72";moonCtx.fillRect(moonBeacon,218,7,82);moonCtx.fillStyle="#ecdc99";moonCtx.beginPath();moonCtx.arc(moonBeacon+3,214,12,0,Math.PI*2);moonCtx.fill();
 if(route==="TITAN"&&!obsDoggyFound)drawDoggy(moonCtx,moonDogX,247);if(route==="TITAN"&&obsDoggyFound)drawDoggy(moonCtx,Math.max(moonPlayer.x-52,30),moonPlayer.y+14);
 const f=art.fahad;if(f&&f.complete){moonCtx.save();moonCtx.translate(moonPlayer.x+(moonPlayer.face<0?72:0),moonPlayer.y-30);if(moonPlayer.face<0)moonCtx.scale(-1,1);moonCtx.drawImage(f,0,0,72,96);moonCtx.restore()}
 moonCtx.restore();
}
function drawDoggy(c,x,y){c.fillStyle="#e5e1da";c.fillRect(x,y+13,35,22);c.fillStyle="#817972";c.fillRect(x+2,y+6,27,18);c.fillStyle="#eee";c.fillRect(x+6,y+9,17,13);c.fillStyle="#2f3138";c.fillRect(x+8,y+12,4,4);c.fillRect(x+20,y+12,4,4);c.fillRect(x+14,y+18,4,3);c.strokeStyle="#a8d9ef";c.lineWidth=2;c.beginPath();c.arc(x+16,y+16,22,0,Math.PI*2);c.stroke()}

function allObsRoutesDone(){return obsRoutes.IO&&obsRoutes.GANYMEDE&&obsRoutes.TITAN}
function updateObsUnlocks(){
 if(obsSaturnSeen||Object.values(obsRoutes).some(Boolean))$("#firstSkyBtn").classList.remove("hidden");
 if(obsDoggyFound)$("#obsDog").classList.remove("hidden");
 if(allObsRoutesDone()&&obsFirstSkySeen){$("#finalChamberBtn").classList.remove("hidden");$("#obsObjective").textContent="Something in the final chamber is waiting."}
}
let gravityCommented=false;
function maybeGravityComment(){if(obsGravity>=2&&!gravityCommented){gravityCommented=true;setTimeout(()=>obsSay("ARCHIVIST","Have you noticed that?\n\nThings appear to move around you."),350)}}

const poemPages=[
"I used to think a moon simply circled its planet,\nheld there by the gravity of something greater.\n\nBut apparently that is not quite true.",
"Two bodies never leave each other untouched.\n\nA planet pulls its moon,\nand the moon pulls back.",
"Both surrender some small measure of motion\nto an invisible centre they form together.",
"I find that fascinating.\n\nThat something can be immense\nwithout making everything beside it small.",
"That gravity can be a measure of presence,\nand not possession.",
"That a world can hold its own storms and seasons\nand its own impossible geography,\n\nand still make the space around it move differently\nsimply because it exists.",
"Look what moved because you were here.",
"You remind me of that.",
"You have a strange sort of gravity,\nnot the kind that demands to be orbited,\n\nbut the kind you only notice\nwhen you look back\nand realise your trajectory has changed.",
"You make falling feel less like failure.\n\nYou make distance feel navigable.",
"And I think perhaps the strangest thing about gravity\nis that the thing exerting it\ndoes not have to know what it has moved.",
"A planet does not stop to measure\nevery tide it has pulled,\nevery path it has bent,\nevery small thing that carries some evidence\nthat it was once nearby.",
"It simply exists,\nwith its own storms and seasons\nand its own impossible geography,\n\nand space remembers the weight of it.",
"I think people can be like that too.",
"They can move through the world\noccupied with surviving their own weather,\n\nnever quite seeing all the places\nwhere their presence has altered the map.",
"So perhaps that is all I mean\nwhen I say you remind me of gravity:",
"that you have been here,\nand because you have been here,\nsome things are different.",
"And for one improbable stretch\nof all these dimensions,\n\nI was lucky enough to witness it."
];
let poemIndex=0;
function startFinale(){obsSay("ARCHIVIST","I believe this place has been trying to tell us something.",()=>obsSay("ARCHIVIST","Or rather, tell you something.",()=>{show("poemScreen");poemIndex=0;$("#poemText").textContent=poemPages[0]}))}
$("#poemNext").onclick=()=>{poemIndex++;if(poemIndex<poemPages.length){$("#poemText").style.opacity="0";setTimeout(()=>{$("#poemText").textContent=poemPages[poemIndex];$("#poemText").style.opacity="1"},180)}else showBirthday()};
function showBirthday(){show("birthdayScreen");$("#finalStats").innerHTML=`<p>AGE <b>+1</b></p><p>LORE <b>+100</b></p><p>GEMS RECOVERED <b>${gemCount}/5</b></p><p>ENEMIES DEFEATED <b>${kills}</b></p><p>CHEESE ACQUIRED <b>${cheese}</b></p><p>DOGGY BACHA LOCATED <b>${obsDoggyFound?1:0}</b></p><p>HISTORICAL KNOWLEDGE <b>DISTURBING</b></p><p>SINGING CAREER <b>UNDER INVESTIGATION</b></p><p>GRAVITATIONAL INFLUENCE <b>CONFIRMED</b></p><p>RAT STATUS <b>ALLEGATIONS PENDING</b></p>`}
