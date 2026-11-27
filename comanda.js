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
  const details=document.querySelector('#customerDetails');details.append(el('strong',data.name),el('p','Telefon: '+data.phone),el('p',data.id+' · '+new Date(data.date).toLocaleString('ro-RO',{timeZone:'Europe/Bucharest'})));
  const tel=el('a','Sună clientul');tel.href='tel:'+data.phone.replace(/[^+0-9]/g,'');details.append(tel);
  const groups=new Map();for(const r of data.rows){const key=JSON.stringify([r[0],r[1],r[5],r[6]]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
  for(const rows of groups.values()){
   const r=rows[0],card=el('article','','order-product'),img=el('img',''),info=el('div',''),table=el('table',''),head=el('thead',''),tr=el('tr',''),body=el('tbody','');
   img.src=r[5].split('#')[0];img.alt=r[1];img.loading='lazy';img.referrerPolicy='no-referrer';if(r[6]){img.className='framed';img.style.objectPosition=r[6]+' center';}
   info.append(el('h2',r[0]),el('p',r[1]));for(const label of ['Culoare','Mărime','Cant.'])tr.append(el('th',label));head.append(tr);table.append(head,body);
   for(const line of rows){const row=el('tr','');for(const value of [line[2],line[3],String(line[4])])row.append(el('td',value));body.append(row);}
   info.append(table);card.append(img,info);document.querySelector('#orderRows').append(card);
  }
  document.querySelector('#orderTotal').textContent='Total: '+total+' bucăți · '+groups.size+' modele';content.hidden=false;status.hidden=true;const print=document.querySelector('#printOrder');print.hidden=false;print.onclick=()=>window.print();
 }catch(error){content.hidden=true;status.textContent=error instanceof SyntaxError?'Linkul comenzii este deteriorat. Cere linkul complet.':error.message||'Comanda nu poate fi deschisă.';}
})();
