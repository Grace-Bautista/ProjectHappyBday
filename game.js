(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('world');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = 480, H = 270, WORLD = 2950, WORLD_H = 620;
  const chapters = [
    {
      area: 'CLOUD MOUNTAIN', x: 690, y: 245, gate: 780,
      name: 'The Summit Keeper', title: 'The first light',
      story: 'Ron reaches the mountain summit. The first keeper guards a star above the clouds.',
      question: 'What has a face and two hands, but no arms or legs?',
      choices: ['A clock', 'A flower', 'A robot'], answer: 0,
      hint: 'It tells you when an adventure should begin.',
      after: 'The summit lights up. A playful memory flickers into view.',
      media: [
        {type: 'image', src: 'media/star-1-photo.jpg', caption: 'A moment worth keeping.'},
        {type: 'video', src: 'media/star-1-video.mp4', caption: 'A little scene from the journey.'}
      ]
    },
    {
      area: 'ECHO CAVE', x: 1300, y: 410, gate: 1400,
      name: 'The Cave Keeper', title: 'The second light',
      story: 'The trail descends into a glowing cave. Its keeper asks about the marks every traveler leaves behind.',
      question: 'The more you take, the more you leave behind. What are they?',
      choices: ['Stones', 'Footsteps', 'Clouds'], answer: 1,
      hint: 'They follow every walk you make.',
      after: 'The cave glows again. Another memory appears in the stone.',
      media: [
        {type: 'image', src: 'media/star-2-photo.jpg', caption: 'Some places feel like they belong in an adventure.'},
        {type: 'image', src: 'media/star-3-photo-b.jpg', caption: 'A moment from another journey.'}
      ]
    },
    {
      area: 'BLUE SEA', x: 2130, y: 430, gate: 2260,
      name: 'The Sea Keeper', title: 'The final light',
      story: 'Across the blue sea, the last star rests beneath the surface. Its keeper has one final question.',
      question: 'I can fill a room, but I take up no space. What am I?',
      choices: ['Water', 'Music', 'Light'], answer: 2,
      hint: 'The castle has been missing it all along.',
      after: 'The sea glitters with all three lights. The castle is finally in sight.',
      media: [
        {type: 'video', src: 'media/star-2-video.mp4', caption: 'A brave little moment by the water.'},
        {type: 'image', src: 'media/star-3-photo-a.jpg', caption: 'One more smile before the final door.'}
      ]
    }
  ];
  const terrain = [
    {from:0,to:180,y:420},{from:180,to:300,y:390},{from:365,to:420,y:355},
    {from:420,to:540,y:320},{from:540,to:790,y:285},{from:790,to:920,y:320},
    {from:920,to:1040,y:360},{from:1040,to:1080,y:405},{from:1080,to:1190,y:535},{from:1190,to:1400,y:450},
    {from:1400,to:1520,y:420},{from:1520,to:1640,y:385},
    {from:1640,to:2350,y:515},{from:2350,to:2460,y:410},
    {from:2460,to:2580,y:370},{from:2580,to:2950,y:340}
  ];
  const ledges = [
    {x:260,y:331,w:70},{x:325,y:330,w:55},{x:395,y:290,w:72},{x:550,y:248,w:74},
    {x:980,y:345,w:76},{x:1090,y:390,w:76},{x:1100,y:480,w:64},{x:1150,y:425,w:65},{x:1265,y:365,w:70},
    {x:1690,y:360,w:78},{x:1860,y:352,w:78},{x:2030,y:365,w:78},{x:2175,y:350,w:75},
    {x:2390,y:352,w:75}
  ];
  const movingPlatforms = [
    {x:453,y:258,w:58,axis:'x',range:27,speed:.025},
    {x:1950,y:402,w:64,axis:'y',range:26,speed:.03},
    {x:1090,y:450,w:52,axis:'y',range:28,speed:.023}
  ];
  const bonusBlocks = [{x:350,y:276,w:24,h:17},{x:1120,y:347,w:24,h:17}];
  const flags = [{x:240,y:390},{x:920,y:360},{x:1680,y:515}];
  const sparks = [
    {chapter:0,x:290,y:308},{chapter:0,x:575,y:224},
    {chapter:1,x:1050,y:322},{chapter:1,x:1235,y:427},
    {chapter:2,x:1830,y:461},{chapter:2,x:2055,y:365}
  ];
  const spikes = [{x:635,w:23},{x:1020,w:28},{x:1182,w:22},{x:1770,w:25},{x:1965,w:24}];
  const guardians = [{x:1330,range:24,speed:.04}];
  const caveCrystals = [{x:1135,y:511,w:18,h:24},{x:1285,y:434,w:15,h:16}];
  const geysers = [{x:1910,w:34,top:365},{x:2215,w:30,top:380}];
  const springs = [{x:1160,y:535,w:22}];
  const keys = {left:false,right:false,up:false};
  const p = {x:48,y:377,w:25,h:43,vx:0,vy:0,grounded:true};
  let mode='intro',camera=0,cameraY=0,frame=0,last=0,jumpQueued=false,hearts=3,shield=0,checkpoint=48,invulnerable=0,seaHintShown=false;
  let activeChapter=0,memoryIndex=0,hintUntil=0,wrongCount=0;
  let audioCtx=null,musicTimer=null,musicStep=0,audioOn=true,birthdayTimers=[],giftOpened=false;
  const photo=new Image();let faceReady=false;
  photo.onload=()=>{faceReady=true};
  photo.src='ron-face.jpg';

  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
  function label(s,x,y,size=12,color='#fff9df',align='left'){ctx.fillStyle=color;ctx.font=`bold ${size}px Consolas, monospace`;ctx.textAlign=align;ctx.fillText(s,Math.round(x),Math.round(y));ctx.textAlign='left'}
  function tone(freq,duration=.12,type='square',volume=.035,delay=0){
    if(!audioOn||!audioCtx)return;
    const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+duration+.01)
  }
  function sound(kind){if(kind==='jump')tone(330,.09,'square',.018);if(kind==='wrong')tone(160,.19,'sawtooth',.025);if(kind==='hurt')tone(110,.23,'sawtooth',.035);if(kind==='spark'){tone(660,.09,'triangle',.03);tone(880,.15,'triangle',.025,.08)}if(kind==='star'){tone(523,.12);tone(659,.12,'square',.035,.12);tone(784,.22,'square',.035,.24)}if(kind==='open'){tone(392,.1);tone(587,.12,'square',.03,.1)}}
  function beginAudio(){
    if(!audioOn)return;
    try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();if(musicTimer)return;
      const melody=[392,0,523,587,659,0,587,523,440,0,523,659,784,0,659,523];
      musicTimer=setInterval(()=>{if(mode!=='playing'||!audioOn)return;const n=melody[musicStep%melody.length];if(n)tone(n,.15,'triangle',.017);if(musicStep%4===0)tone([196,220,174,196][Math.floor(musicStep/4)%4],.31,'square',.012);musicStep++},190)
    }catch{audioOn=false;$('sound').textContent='♫ OFF'}
  }
  function stopBirthdaySong(){birthdayTimers.forEach(clearTimeout);birthdayTimers=[]}
  function playBirthdaySong(){
    stopBirthdaySong();if(!audioOn)return;beginAudio();
    const notes=[
      [392,.18],[392,.18],[440,.36],[392,.36],[523,.36],[494,.70],
      [392,.18],[392,.18],[440,.36],[392,.36],[587,.36],[523,.70],
      [392,.18],[392,.18],[784,.36],[659,.36],[523,.36],[494,.36],[440,.70],
      [698,.18],[698,.18],[659,.36],[523,.36],[587,.36],[523,.85]
    ];
    let at=.25;notes.forEach(([pitch,length],i)=>{birthdayTimers.push(setTimeout(()=>{tone(pitch,length*.83,'square',.026);tone(pitch/2,length*.83,'triangle',.014);if([0,6,12,19].includes(i))tone(pitch/4,.38,'triangle',.015)},at*1000));at+=length})
  }
  function hint(message,ms=2000){$('hint').textContent=message;$('hint').classList.add('show');hintUntil=performance.now()+ms}
  function currentSparks(i){return sparks.filter(s=>s.chapter===i&&s.got).length}
  function updateQuest(){const found=chapters.filter(c=>c.got).length;$('quest').textContent=found<3?currentSparks(found)<2?`CHAPTER ${found+1} · FIND SPARKS ${currentSparks(found)}/2`:`CHAPTER ${found+1} · FIND THE REVEALED STAR`:'FINAL CHAPTER · THE SECRET DOOR';$('hearts').textContent=Array(hearts).fill('♥').join(' ')+(shield?' ◈':'');chapters.forEach((c,i)=>$('star'+i).classList.toggle('got',!!c.got))}
  function reset(){
    stopBirthdaySong();giftOpened=false;$('giftStage').hidden=false;$('giftStage').classList.remove('opening');$('finalFrame').hidden=true;$('finalFrame').classList.remove('rising');
    p.x=48;p.y=377;p.vx=0;p.vy=0;p.grounded=true;p.support=null;camera=0;cameraY=265;frame=0;hearts=3;shield=0;checkpoint=48;invulnerable=0;activeChapter=0;wrongCount=0;jumpQueued=false;seaHintShown=false;
    chapters.forEach(c=>c.got=false);sparks.forEach(s=>s.got=false);bonusBlocks.forEach(b=>b.used=false);flags.forEach(f=>f.visited=false);['riddle','memory','ending'].forEach(id=>$(id).classList.add('hidden'));$('zone').textContent='CLOUD MOUNTAIN';$('finalVideo').pause();mode='playing';updateQuest();beginAudio();hint('Two little sparks wake each star. Search above and below the path.',3500)
  }
  function groundAt(x){return terrain.find(a=>x>=a.from&&x<a.to)?.y??Infinity}
  function hurt(force=false){if(invulnerable>0&&!force)return;if(shield&&!force){shield=0;invulnerable=75;sound('spark');hint('Your secret shield saved you!',1800);updateQuest();return}hearts--;sound('hurt');if(hearts===0){hearts=3;hint('A small setback. The stars you found are safe.',2300)}else hint('Ouch! Try timing your jump.',1700);const retreat=Math.max(checkpoint,p.x-42);p.x=Number.isFinite(groundAt(retreat+12))?retreat:checkpoint;p.y=groundAt(p.x+12)-p.h;p.vx=0;p.vy=0;p.grounded=true;p.support=null;invulnerable=90;updateQuest()}
  function openRiddle(i){
    const c=chapters[i];activeChapter=i;mode='riddle';keys.left=keys.right=false;wrongCount=0;
    $('riddleChapter').textContent=c.name.toUpperCase();$('riddleTitle').textContent=c.title;$('riddleStory').textContent=c.story;$('riddleQuestion').textContent=c.question;$('feedback').textContent='';$('answers').replaceChildren();
    c.choices.forEach((choice,index)=>{const b=document.createElement('button');b.className='answer';b.textContent=choice;b.addEventListener('click',()=>answerRiddle(index,b));$('answers').append(b)});
    $('riddle').classList.remove('hidden');$('answers').querySelector('button')?.focus()
  }
  function answerRiddle(index,button){
    const c=chapters[activeChapter];if(index!==c.answer){wrongCount++;button.classList.add('wrong');$('feedback').textContent=wrongCount>1?c.hint:'Not quite. Try another answer!';sound('wrong');return}
    c.got=true;checkpoint=c.x+50;hearts=Math.min(3,hearts+1);updateQuest();sound('star');$('riddle').classList.add('hidden');$('feedback').textContent='';memoryIndex=0;mode='memory';showMemory()
  }
  function showMemory(){
    const c=chapters[activeChapter],item=c.media[memoryIndex],frame=$('mediaFrame');frame.replaceChildren();$('memoryTitle').textContent=c.after;
    const node=document.createElement(item.type==='video'?'video':'img');node.src=item.src;node.alt=item.type==='image'?'A memory with Ron':'';
    if(item.type==='video'){node.controls=true;node.playsInline=true;node.preload='metadata';node.addEventListener('play',()=>{});}frame.append(node);
    $('mediaCaption').textContent=item.caption;$('nextMemory').textContent=memoryIndex<c.media.length-1?'NEXT MEMORY →':'CONTINUE QUEST →';$('memory').classList.remove('hidden');$('nextMemory').focus()
  }
  function nextMemory(){
    $('mediaFrame').querySelector('video')?.pause();const c=chapters[activeChapter];if(memoryIndex<c.media.length-1){memoryIndex++;showMemory();return}
    $('memory').classList.add('hidden');mode='playing';sound('open');hint(activeChapter===2?'All stars found. The secret door is ahead!':'The path ahead is open. Keep going!',2600)
  }
  function win(){
    mode='ending';keys.left=keys.right=false;const confetti=$('confetti');confetti.replaceChildren();for(let i=0;i<45;i++){const bit=document.createElement('i');bit.style.left=Math.random()*100+'%';bit.style.animationDelay=Math.random()*2+'s';bit.style.animationDuration=(2+Math.random()*2)+'s';confetti.append(bit)}
    const video=$('finalVideo');video.hidden=true;$('videoPending').hidden=false;video.onloadedmetadata=()=>{video.hidden=false;$('videoPending').hidden=true;if(giftOpened&&!$('finalFrame').hidden)video.play().catch(()=>{})};video.onerror=()=>{video.hidden=true;$('videoPending').hidden=false};video.src='media/final-greeting.mp4';video.load();
    $('ending').classList.remove('hidden');sound('star');playBirthdaySong();$('gift').focus()
  }
  function openGift(){
    if(mode!=='ending'||giftOpened)return;giftOpened=true;stopBirthdaySong();sound('open');$('giftStage').classList.add('opening');
    setTimeout(()=>{if(mode!=='ending')return;$('finalFrame').hidden=false;$('finalFrame').classList.add('rising');if(!$('finalVideo').hidden)$('finalVideo').play().catch(()=>{})},450);
    setTimeout(()=>{if(mode==='ending')$('giftStage').hidden=true},1050)
  }

  function zoneIndex(){return p.x<1000?0:p.x<1640?1:p.x<2350?2:3}
  function scenery(){
    const z=zoneIndex(),sky=[['#76b9e9','#c9edf0'],['#252744','#4f4969'],['#65c5dc','#b8eee4'],['#554486','#aa79a8']][z];
    rect(0,0,W,H,sky[1]);rect(0,0,W,175,sky[0]);
    if(z!==1){rect(358-camera*.08,26,32,32,z===3?'#f8e3c4':'#ffe29a');for(let i=0;i<9;i++){let x=(i*151-camera*.2)%720;if(x<-80)x+=720;let y=38+(i%3)*23-cameraY*.08;rect(x,y,48,9,'#fff5e5');rect(x+11,y-9,25,8,'#fff5e5')}}
    if(z===0){for(let i=0;i<8;i++){const x=i*152-camera*.45,y=260+(i%3)*31-cameraY*.3;rect(x,y,150,170,'#6d9cb0');rect(x+27,y-32,96,35,'#d1e8e8')}}
    if(z===1){for(let i=0;i<13;i++){let x=i*85-camera*.6;rect(x,-5,18,55+(i%3)*24,'#3b3b5b');rect(x+4,45+(i%3)*24,10,17,'#5e5472');rect(x+14,192+(i%4)*15,8,20,'#76d1d6')}}
    if(z===2){const wy=390-cameraY;rect(0,wy,W,H-wy,'#2b98b4');rect(0,wy,W,6,'#8de8e4');for(let i=0;i<20;i++){const x=i*73-camera*.75,y=410+(i%4)*31-cameraY;rect(x,y,8,3,'#a8efed');rect(x+21,y+15,4,4,'#a8efed')}for(let i=0;i<7;i++){const x=i*156-camera*.42;rect(x,348-cameraY*.3,100,20,'#7ac4be')}}
    for(const a of terrain){const x=a.from-camera,w=a.to-a.from,y=a.y-cameraY;if(x>W||x+w<0)continue;const sea=a.from>=1640&&a.from<2350;rect(x,y,w,WORLD_H-a.y,sea?'#326c80':z===1?'#443b59':'#70545b');rect(x,y,w,8,sea?'#61b7b8':z===1?'#7d6c9c':'#73c985');for(let d=0;d<w;d+=24){rect(x+d,y+24,12,3,sea?'#45889b':'#927276');rect(x+d+8,y+47,7,3,sea?'#45889b':'#927276')}}
  }
  function movingAt(a,t){return {...a,x:a.x+(a.axis==='x'?Math.sin(t*a.speed)*a.range:0),y:a.y+(a.axis==='y'?Math.sin(t*a.speed)*a.range:0),moving:a}}
  function drawPlatforms(){for(const a of [...ledges,...movingPlatforms.map(m=>movingAt(m,frame))]){const x=a.x-camera,y=a.y-cameraY;if(x+a.w<0||x>W||y<-30||y>H)continue;
    if(a.x<900){rect(x,y,a.w,7,'#78d988');rect(x+3,y+7,a.w-6,10,'#6a4a55');for(let i=4;i<a.w-4;i+=14){rect(x+i,y+17,9,5,'#6a4a55');rect(x+i+3,y+22,3,4,'#4b394e');rect(x+i,y+2,4,3,'#a8ed9b')}}
    else if(a.x<1640){rect(x,y,a.w,8,'#80d2d8');rect(x+2,y+8,a.w-4,11,'#3d4865');for(let i=5;i<a.w-5;i+=17){rect(x+i,y+11,10,3,'#607793');rect(x+i+2,y+19,4,5,'#3d4865')}}
    else{rect(x,y,a.w,9,'#e8bd81');rect(x,y+9,a.w,8,'#865f62');for(let i=0;i<a.w;i+=16)rect(x+i,y+2,2,6,'#fff0ad')}
    if(a.moving){rect(x+5,y-3,a.w-10,3,'#fff7cb');rect(x+a.w/2-3,y+11,6,3,'#fff7cb')}}}
  function drawBonusBlocks(){for(const b of bonusBlocks){const x=b.x-camera,y=b.y-cameraY;if(x+b.w<0||x>W||y<-20||y>H)continue;rect(x,y,b.w,b.h,b.used?'#7d7090':'#d5b96f');rect(x+3,y+3,b.w-6,b.h-6,b.used?'#5b526c':'#f7df91');label(b.used?'·':'?',x+b.w/2,y+13,13,b.used?'#bdb0cf':'#614a66','center')}}
  function drawFlags(){for(const f of flags){const x=f.x-camera,y=f.y-cameraY;if(x<-20||x>W+20)continue;rect(x,y-48,3,48,'#f7edc8');rect(x+3,y-46,23,16,f.visited?'#8be6d7':'#f5a978');rect(x+5,y-43,6,4,'#fff8d8');rect(x-4,y-3,11,4,'#6c5272')}}
  function drawSparks(){for(const s of sparks){if(s.got||chapters[s.chapter].got)continue;const x=Math.round(s.x-camera),y=Math.round(s.y-cameraY+Math.sin(frame*.08+s.x)*3);if(x<-15||x>W+15||y<-15||y>H+15)continue;rect(x-9,y-9,18,18,'#fff5ba66');rect(x-3,y-11,6,22,'#ffe98d');rect(x-10,y-3,20,6,'#ffe98d');rect(x-4,y-4,8,8,'#ffffff')}}
  function drawStars(){chapters.forEach((c,i)=>{if(c.got)return;const x=Math.round(c.x-camera),y=Math.round(c.y-cameraY+Math.sin(frame*.07+i)*3);if(x<-25||x>W+25)return;if(currentSparks(i)<2){rect(x-16,y-19,32,36,'#4d3c62');rect(x-13,y-16,26,30,'#a287a6');rect(x-8,y-11,16,20,'#5f4d72');label('?',x,y+5,18,'#f8dfa2','center');return}const color=['#ff7896','#76d8ec','#ffcf61'][i];rect(x-4,y-14,8,29,color);rect(x-14,y-4,29,8,color);rect(x-9,y-9,19,19,color);rect(x-4,y-4,8,8,'#fff9dc');rect(x-18,y-1,3,3,'#fff9dc');rect(x+16,y-1,3,3,'#fff9dc')})}
  function drawHazards(){for(const s of spikes){const x=s.x-camera,y=groundAt(s.x)-cameraY;if(x+s.w<0||x>W)continue;rect(x,y-4,s.w,4,'#443452');for(let i=0;i<s.w;i+=9){rect(x+i+3,y-13,3,9,'#dce0eb');rect(x+i+1,y-8,7,4,'#a8b8cf')}}for(const c of caveCrystals){const x=c.x-camera,y=c.y-cameraY;if(x+c.w<0||x>W)continue;rect(x+2,y+6,c.w-4,c.h-6,'#447b9a');rect(x+5,y,c.w-10,c.h-5,'#83dce0');rect(x+7,y+5,3,8,'#e1ffff')}for(const e of guardians){let x=e.x+Math.sin(frame*e.speed)*e.range-camera,y=groundAt(e.x)-cameraY;if(x<-30||x>W+30)continue;rect(x-11,y-18,22,18,'#583362');rect(x-8,y-23,16,10,'#9a55a0');rect(x-5,y-13,3,3,'#ffdf68');rect(x+3,y-13,3,3,'#ffdf68')}}
  function drawGeysers(){for(const g of geysers){const x=g.x-camera,top=g.top-cameraY,bottom=515-cameraY;if(x+g.w<0||x>W)continue;rect(x,top,g.w,bottom-top,'#83e8e426');for(let i=0;i<9;i++){const by=bottom-((frame*1.6+i*24)%(bottom-top));rect(x+5+(i*17)%Math.max(8,g.w-10),by,5,5,'#b8ffff')}rect(x-4,bottom-5,g.w+8,5,'#86dcd2')}}
  function drawSprings(){for(const s of springs){const x=s.x-camera,y=s.y-cameraY;if(x+s.w<0||x>W)continue;rect(x,y-13,s.w,5,'#f5afcf');rect(x+3,y-8,s.w-6,3,'#a861a8');rect(x+5,y-5,s.w-10,5,'#ee78b1');rect(x-2,y-1,s.w+4,3,'#59466f')}}
  function drawGates(){chapters.forEach(c=>{if(c.got)return;const x=c.gate-camera,g=groundAt(c.gate)-cameraY;if(x<-20||x>W+20)return;for(let y=g-125;y<g;y+=17)rect(x,y,7,11,'#d9a4ee');rect(x-7,g-9,21,9,'#563c70');label('?',x+3,g-137,21,'#fff6cf','center')})}
  function drawCastle(){let x=2735-camera,y=340-cameraY;if(x>W+90||x<-125)return;rect(x,y-105,98,105,'#665282');rect(x+8,y-124,19,33,'#665282');rect(x+70,y-124,19,33,'#665282');rect(x+7,y-129,21,7,'#c17e98');rect(x+69,y-129,21,7,'#c17e98');rect(x+33,y-62,34,62,'#33294e');rect(x+40,y-46,20,46,'#c684a0');rect(x+42,y-40,16,40,'#59406a');rect(x+27,y-88,44,8,'#f6d880');label('???',x+50,y-80,11,'#392344','center');rect(x+38,y-119,24,20,'#ffe07e');label('★',x+50,y-103,16,'#b54e77','center')}
  function drawRon(){if(invulnerable>0&&Math.floor(frame/5)%2===0)return;const x=Math.round(p.x-camera),y=Math.round(p.y-cameraY),leg=Math.abs(p.vx)>.2&&p.grounded?Math.sin(frame*.33)*4:0;
    if(shield){rect(x-4,y-7,34,3,'#91f2f0');rect(x-6,y+2,3,34,'#91f2f0');rect(x+29,y+2,3,34,'#91f2f0')}
    rect(x+3,y+36,8,7+leg,'#3c315d');rect(x+15,y+36,8,7-leg,'#3c315d');rect(x+3,y+25,20,15,'#5667ae');rect(x+6,y+23,14,17,'#e86b77');rect(x+8,y+29,3,3,'#ffe590');rect(x+17,y+29,3,3,'#ffe590');rect(x,y+27,5,11,'#e7ad84');rect(x+22,y+27,5,11,'#e7ad84');rect(x+2,y+5,22,22,'#463552');rect(x+4,y+7,18,19,'#e9b58d');
    if(faceReady){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(photo,100,300,600,650,x+2,y+5,22,23);ctx.imageSmoothingEnabled=false}else{rect(x+8,y+14,2,2,'#392744');rect(x+17,y+14,2,2,'#392744');rect(x+11,y+20,6,2,'#a65367')}
    rect(x+1,y+2,25,6,'#ed6572');rect(x+6,y-1,18,6,'#ed6572');rect(x-1,y+7,5,4,'#ed6572');rect(x+13,y+2,4,3,'#fff0c0')
  }
  function update(dt){
    if(mode!=='playing')return;
    const nextFrame=frame+dt;
    if(p.grounded&&p.support){const before=movingAt(p.support,frame),after=movingAt(p.support,nextFrame);p.x+=after.x-before.x;p.y+=after.y-before.y}
    if(keys.left&&!keys.right)p.vx=-3.1;else if(keys.right&&!keys.left)p.vx=3.1;else p.vx*=.73;
    const swimming=p.x>1640&&p.x<2350&&p.y+p.h>390;
    if(jumpQueued&&p.grounded){p.vy=-10.3;p.grounded=false;p.support=null;sound('jump')}
    if(swimming&&keys.up){p.vy=Math.max(-3.8,p.vy-.58*dt);p.grounded=false}
    if(swimming)for(const g of geysers){if(p.x+p.w>g.x&&p.x<g.x+g.w&&p.y+p.h>g.top)p.vy=Math.max(-4.4,p.vy-.47*dt)}
    jumpQueued=false;
    let nextX=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));
    if(p.vx>0){for(const a of terrain){if(p.x+p.w<=a.from&&nextX+p.w>a.from&&a.y<p.y+p.h-5){nextX=a.from-p.w;p.vx=0;break}}}
    if(p.vx<0){for(const a of terrain){if(p.x>=a.to&&nextX<a.to&&a.y<p.y+p.h-5){nextX=a.to;p.vx=0;break}}}
    p.x=nextX;const next=chapters.find(c=>!c.got);if(next&&p.x>next.gate){p.x=next.gate;p.vx=0;const i=chapters.indexOf(next);hint(currentSparks(i)<2?'Find both sparks to awaken the star!':next.area==='BLUE SEA'?'Look below the water for the star!':'The gate needs the nearby star!',1600)}
    const oldTop=p.y,oldBottom=p.y+p.h;p.vy=Math.min(swimming?2.4:12,p.vy+(swimming?.16:.53)*dt);p.y+=p.vy*dt;p.grounded=false;p.support=null;
    for(const b of bonusBlocks){if(!b.used&&p.vy<0&&oldTop>=b.y+b.h-2&&p.y<=b.y+b.h&&p.x+p.w>b.x+3&&p.x<b.x+b.w-3){p.y=b.y+b.h;p.vy=0;b.used=true;shield=1;sound('spark');hint('Secret bonus! A shield will block one hit.',2600);updateQuest()}}
    for(const a of [...ledges,...movingPlatforms.map(m=>movingAt(m,nextFrame))]){if(p.vy>=0&&oldBottom<=a.y+4&&p.y+p.h>=a.y&&p.x+p.w>a.x+3&&p.x<a.x+a.w-3){p.y=a.y-p.h;p.vy=0;p.grounded=true;p.support=a.moving||null}}
    const ground=groundAt(p.x+p.w/2);if(p.y+p.h>=ground){p.y=ground-p.h;p.vy=0;p.grounded=true;p.support=null}
    for(const s of springs){if(p.grounded&&p.x+p.w>s.x+3&&p.x<s.x+s.w-3&&Math.abs(p.y+p.h-s.y)<3){p.vy=-13.5;p.grounded=false;sound('jump');hint('Boing! The cave spring lifts you back up.',1700)}}
    if(p.y>575){hurt(true);return}
    camera=Math.max(0,Math.min(WORLD-W,p.x-175));cameraY=Math.max(0,Math.min(WORLD_H-H,p.y-113));frame=nextFrame;invulnerable=Math.max(0,invulnerable-dt);
    $('zone').textContent=['CLOUD MOUNTAIN','ECHO CAVE','BLUE SEA','CASTLE HEIGHTS'][zoneIndex()];
    for(const f of flags){if(!f.visited&&p.x>=f.x){f.visited=true;checkpoint=Math.max(checkpoint,f.x);sound('open');hint('Checkpoint lit! A safe return point.',2200)}}
    if(p.x>2380&&chapters[2].got)checkpoint=Math.max(checkpoint,2370);
    if(swimming&&!seaHintShown){hint('Hold JUMP or ↑ to swim upward. The last light is under the sea.',3500);seaHintShown=true}
    if(next){const i=chapters.indexOf(next);for(const s of sparks){if(s.chapter!==i||s.got)continue;if(Math.abs(p.x+p.w/2-s.x)<20&&Math.abs(p.y+p.h/2-s.y)<39){s.got=true;sound('spark');updateQuest();hint(currentSparks(i)===2?'Both sparks found! The stone star has awakened.':'A spark found! Search for one more.',2800)}}
      if(currentSparks(i)===2&&Math.abs(p.x+p.w/2-next.x)<25&&Math.abs(p.y+p.h/2-next.y)<57){openRiddle(i);return}}
    if(invulnerable===0){for(const s of spikes){const g=groundAt(s.x);if(p.x+p.w>s.x+2&&p.x<s.x+s.w-2&&p.y+p.h>g-12){hurt();break}}if(invulnerable===0)for(const c of caveCrystals){if(p.x+p.w>c.x+2&&p.x<c.x+c.w-2&&p.y+p.h>c.y+3&&p.y<c.y+c.h){hurt();break}}if(invulnerable===0)for(const e of guardians){const ex=e.x+Math.sin(frame*e.speed)*e.range,g=groundAt(e.x);if(p.x+p.w>ex-10&&p.x<ex+10&&p.y+p.h>g-20&&p.y<g){hurt();break}}}
    if(p.x>2760&&chapters.every(c=>c.got)){win();return}
    if(hintUntil&&performance.now()>hintUntil){$('hint').classList.remove('show');hintUntil=0}
  }
  function draw(){scenery();drawPlatforms();drawBonusBlocks();drawFlags();drawGeysers();drawSprings();drawCastle();drawGates();drawHazards();drawSparks();drawStars();drawRon();if(mode==='playing'&&p.x<150)label('↗',130-camera,350-cameraY,24,'#fff5cf');if(mode==='playing'&&p.x>2550)label('→ ???',2630-camera,230-cameraY,13,'#fff5cf')}
  function loop(t){const dt=Math.min(1.8,(t-last)/16.67||1);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

  $('start').addEventListener('click',()=>{$('intro').classList.add('hidden');reset()});$('again').addEventListener('click',reset);$('nextMemory').addEventListener('click',nextMemory);$('gift').addEventListener('click',openGift);
  $('sound').addEventListener('click',()=>{audioOn=!audioOn;$('sound').textContent=audioOn?'♫ ON':'♫ OFF';$('sound').setAttribute('aria-pressed',String(audioOn));$('sound').setAttribute('aria-label',audioOn?'Mute game audio':'Turn on game audio');if(audioOn)beginAudio()});
  window.addEventListener('keydown',e=>{if(mode==='playing'&&['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW'].includes(e.code))e.preventDefault();if(mode==='playing'){if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=true;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=true;if(['ArrowUp','Space','KeyW'].includes(e.code)){keys.up=true;if(!e.repeat)jumpQueued=true}}if(e.code==='Enter'&&mode==='intro')$('start').click()});
  window.addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=false;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=false;if(['ArrowUp','Space','KeyW'].includes(e.code))keys.up=false});window.addEventListener('blur',()=>{keys.left=keys.right=keys.up=false});
  for(const [id,key] of [['left','left'],['right','right'],['jump','jump']]){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('pressed');if(mode!=='playing')return;if(key==='jump'){jumpQueued=true;keys.up=true}else keys[key]=true});const up=()=>{b.classList.remove('pressed');if(key==='jump')keys.up=false;else keys[key]=false};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up)}
})();
