// Decode locally: customer data stays in the fragment, never in HTTP requests.
(async()=>{
 const status=document.querySelector('#orderStatus'),content=document.querySelector('#orderContent');
 const el=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 try{
  const token=location.hash.slice(1);if(!/^v1\.[A-Za-z0-9_-]+$/.test(token)||token.length>18000)throw Error('Linkul comenzii lipsește sau este incomplet. Cere clientului linkul complet din WhatsApp.');
  const bytes=Uint8Array.from(atob(token.slice(3).replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader(),chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>262144){await reader.cancel();throw Error('Comanda depășește dimensiunea permisă.');}chunks.push(value);}
  const data=JSON.parse(await new Blob(chunks).text()),str=(v,max)=>typeof v==='string'&&v.length<=max;
  if(data.v!==1||!str(data.id,50)||!str(data.name,100)||!data.name.trim()||!str(data.phone,25)||!str(data.date,40)||!Number.isFinite(Date.parse(data.date))||!Array.isArray(data.rows)||!data.rows.length||data.rows.length>1000)throw Error('Datele comenzii nu sunt valide.');
  let total=0;
  for(const r of data.rows){if(!Array.isArray(r)||r.length!==7||![0,1,2,3].every(i=>str(r[i],300))||!Number.isSafeInteger(r[4])||r[4]<1||!str(r[5],500)||!/^assets\/[A-Za-z0-9_./%() @+#-]+$/.test(r[5])||r[5].includes('..')||!['','left','right'].includes(r[6]))throw Error('Un produs din comandă nu este valid.');total+=r[4];}
  if(!Number.isSafeInteger(total))throw Error('Cantitățile nu sunt valide.');
  document.title=data.id+' · AJ Paris';
  const date=new Date(data.date).toLocaleString('ro-RO',{timeZone:'Europe/Bucharest'});
  document.querySelector('#orderReference').textContent=data.id+' · '+date;
  const details=document.querySelector('#customerDetails');details.append(el('strong',data.name),el('p','Telefon: '+(data.phone||'De confirmat')),el('p','Număr comandă: '+data.id),el('p','Data: '+date));
  const digits=data.phone.replace(/[^0-9]/g,'');
  if(digits.length>=7){const actions=el('div','','customer-actions'),tel=el('a','Sună clientul');tel.href='tel:'+data.phone.replace(/[^+0-9]/g,'');actions.append(tel);details.append(actions);}
  const groups=new Map();for(const r of data.rows){const key=JSON.stringify([r[0],r[1]]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
  const modal=document.querySelector('#orderPhotoDialog'),large=document.querySelector('#orderLargePhoto');let opener=null,largeFrame='';
  function fit(){if(!modal.open||!large.naturalWidth)return;const ratio=large.naturalWidth/(largeFrame?2:1)/large.naturalHeight,w=Math.min(760,innerWidth-56,(innerHeight-130)*ratio);large.style.width=Math.max(1,w)+'px';large.style.height=Math.max(1,w/ratio)+'px';}
  document.querySelector('#orderPhotoClose').onclick=()=>modal.close();
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
  modal.addEventListener('close',()=>{document.body.style.overflow='';large.removeAttribute('src');if(opener?.isConnected)opener.focus({preventScroll:true});});window.addEventListener('resize',fit);large.onload=fit;
  for(const rows of groups.values()){
   const r=rows[0],card=el('article','','order-product'),heading=el('div','','order-product-heading'),table=el('table',''),head=el('thead',''),tr=el('tr',''),body=el('tbody','');
   heading.append(el('h2',r[0]),el('strong',rows.reduce((n,row)=>n+row[4],0)+' buc.','product-pieces'));
   card.append(heading,el('p',r[1],'order-product-name'));
   for(const label of ['Poză','Culoare','Mărime','Cant.']){const th=el('th',label);th.scope='col';tr.append(th);}head.append(tr);table.append(head,body);
   rows.forEach((line,index)=>{
    const row=el('tr','');
    if(index===0){
     const cell=el('td','','order-image-cell'),button=el('button','','order-photo-button'),img=el('img',''),icon=el('span','⌕','photo-symbol');cell.rowSpan=rows.length;button.type='button';button.setAttribute('aria-label','Mărește fotografia: '+r[0]);button.setAttribute('aria-haspopup','dialog');icon.setAttribute('aria-hidden','true');
     img.src=r[5].split('#')[0];img.alt=r[1];img.loading='lazy';img.referrerPolicy='no-referrer';if(r[6]){img.className='framed';img.style.objectPosition=r[6]+' center';}
     button.append(img,icon);button.onclick=()=>{opener=button;largeFrame=r[6];large.className=largeFrame?'framed':'';large.style.objectPosition=largeFrame?largeFrame+' center':'center';large.style.width='';large.style.height='';large.alt=r[1];document.querySelector('#orderPhotoTitle').textContent=r[0];large.src=r[5].split('#')[0];modal.showModal();document.body.style.overflow='hidden';if(large.complete)fit();};cell.append(button);row.append(cell);
    }
    for(const value of [line[2],line[3],String(line[4])])row.append(el('td',value));body.append(row);
   });card.append(table);document.querySelector('#orderRows').append(card);
  }
  document.querySelector('#orderSummary').textContent=groups.size+' modele · '+total+' bucăți';
  document.querySelector('#orderTotal').textContent='Total: '+total+' bucăți · '+groups.size+' modele';
  const tabs=[document.querySelector('#productsTab'),document.querySelector('#customerTab')];
  function selectTab(index){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;});}
  tabs.forEach((tab,index)=>{tab.onclick=()=>selectTab(index);tab.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;selectTab(next);tabs[next].focus();};});
  content.hidden=false;status.hidden=true;const print=document.querySelector('#printOrder');print.hidden=false;print.onclick=()=>window.print();

 }catch(error){content.hidden=true;status.textContent=error instanceof SyntaxError?'Linkul comenzii este deteriorat. Cere linkul complet.':error.message||'Comanda nu poate fi deschisă.';}
})();
