// A PDF is prepared locally. A separate tap shares the file on supported phones.
(()=>{
 const create=document.querySelector('#orderPdfCreate'),ready=document.querySelector('#orderPdfReady'),status=document.querySelector('#orderPdfStatus'),share=document.querySelector('#orderPdfShare'),download=document.querySelector('#orderPdfDownload');
 const fields=['Name','Phone','Address','Notes'];let prepared=null,objectUrl=null,job=0,orderId='',assetsPromise;
 const customer=()=>Object.fromEntries(fields.map(key=>[key.toLowerCase(),document.querySelector('#orderCustomer'+key).value.trim()]));
 const snapshot=()=>JSON.stringify({customer:customer(),products:selectedProducts().map(p=>({code:p.code,lines:requestLines(p)}))});
 function clearPrepared(){
  job++;prepared=null;ready.hidden=true;share.hidden=true;download.removeAttribute('href');
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
  create.disabled=false;create.textContent='Creează PDF-ul comenzii';status.textContent='';
 }
 window.invalidateOrderPdf=clearPrepared;
 for(const key of fields)document.querySelector('#orderCustomer'+key).addEventListener('input',clearPrepared);
 document.querySelector('#orderCustomerForm').addEventListener('submit',event=>event.preventDefault());
 function loadScript(){return new Promise((resolve,reject)=>{
  if(window.jspdf?.jsPDF){resolve();return;}
  const script=document.createElement('script');script.src='assets/vendor/jspdf-4.2.1.umd.min.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Biblioteca PDF nu s-a încărcat. Reîncearcă.'));};document.head.append(script);
 });}
 async function getBytes(path){const response=await fetch(path);if(!response.ok)throw Error('Fontul documentului nu s-a încărcat. Reîncearcă.');return new Uint8Array(await response.arrayBuffer());}
 function base64(bytes){let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(value);}
 function loadAssets(){
  if(!assetsPromise)assetsPromise=Promise.all([loadScript(),getBytes('assets/fonts/DejaVuSans.ttf'),getBytes('assets/fonts/DejaVuSans-Bold.ttf')]).then(([,regular,bold])=>({regular:base64(regular),bold:base64(bold)})).catch(error=>{assetsPromise=null;throw error;});
  return assetsPromise;
 }
 function readImage(source){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('O fotografie nu s-a încărcat. Reîncearcă înainte de a trimite comanda.'));img.src=source;});}
 async function thumbnail(product,source){
  const metadata=product.media?.[source],img=await readImage(metadata?.card||source.split('#')[0]);
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,192,256);
  const frame=metadata?.frame,width=img.naturalWidth/(frame?2:1),height=img.naturalHeight,x=frame==='right'?width:0,scale=Math.min(192/width,256/height),w=width*scale,h=height*scale;
  ctx.drawImage(img,x,0,width,height,(192-w)/2,(256-h)/2,w,h);
  return canvas.toDataURL('image/jpeg',0.88);
 }
 function dateParts(date){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
 function rowsForOrder(){
  const rows=[];for(const product of selectedProducts())for(const line of requestLines(product))rows.push({product,source:line.image||product.image,color:line.color||'De confirmat',size:line.size?(line.size==='TU'?'Talie universală (TU)':line.size):'De confirmat',quantity:Number(line.quantity)});return rows;
 }
 async function makePdf(rows,person,id,created){
  const fonts=await loadAssets(),images=new Map();
  // Limit simultaneous decoding to keep large mobile selections responsive.
  const unique=[...new Map(rows.map(row=>[row.source,row])).values()];let cursor=0;
  await Promise.all(Array.from({length:Math.min(3,unique.length)},async()=>{while(cursor<unique.length){const row=unique[cursor++];images.set(row.source,await thumbnail(row.product,row.source));}}));
  const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
  doc.addFileToVFS('AJ-Regular.ttf',fonts.regular);doc.addFont('AJ-Regular.ttf','AJ','normal');doc.addFileToVFS('AJ-Bold.ttf',fonts.bold);doc.addFont('AJ-Bold.ttf','AJ','bold');
  doc.setProperties({title:'Comandă '+id,subject:'Comandă client AJ Paris Fashion',author:'AJ Paris Fashion'});
  const date=dateParts(created),day=date.day+'.'+date.month+'.'+date.year,margin=14,right=196,width=182,bottom=276;
  const widths=[22,43,32,36,17,32],xs=[margin];widths.forEach(w=>xs.push(xs.at(-1)+w));
  const text=(value,x,y,size=9,bold=false)=>{doc.setFont('AJ',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(35,33,40);doc.text(Array.isArray(value)?value:String(value),x,y);};
  const lines=(value,w,size=9)=>{doc.setFont('AJ','normal');doc.setFontSize(size);return doc.splitTextToSize(String(value),w);};
  let y=0;
  function pageHeader(first){
   text('ajparis',margin,22,25,true);text('f a s h i o n',margin+2,29,8);doc.setDrawColor(115,87,190);doc.setLineWidth(0.55);doc.line(margin,34,right,34);
   text(first?'COMANDĂ CLIENT':'COMANDĂ CLIENT · continuare',margin,44,17,true);doc.setFont('AJ','normal');doc.setFontSize(8);text(id,right-doc.getTextWidth(id),52,8);text('Data: '+day,margin,52,8);
   if(first){
    let rowY=61;
    for(const [label,value] of [['Client',person.name],['Telefon',person.phone],['Livrare',person.address||'De confirmat']]){
     const content=lines(value,width-28);text(label+':',margin,rowY,9,true);text(content,margin+28,rowY);rowY+=Math.max(6,content.length*4.5+2);
    }y=rowY+3;
   }else y=60;
  }
  function tableHeader(){
   doc.setFillColor(242,239,249);doc.rect(margin,y,width,10,'F');doc.setDrawColor(215,211,222);doc.setLineWidth(0.2);doc.rect(margin,y,width,10);
   ['Poză','Cod produs','Culoare','Mărime','Cant.','Verificat'].forEach((label,i)=>text(label,xs[i]+2,y+6.5,8,true));y+=10;
  }
  function nextPage(withTable=true){doc.addPage();pageHeader(false);if(withTable)tableHeader();}
  pageHeader(true);tableHeader();
  for(const row of rows){
   const name=lines(row.product.name,widths[1]-4,7.5),color=lines(row.color,widths[2]-4,8),size=lines(row.size,widths[3]-4,8),qty=lines(row.quantity,widths[4]-4,8);
   const height=Math.max(29,10+name.length*3.5,8+Math.max(color.length,size.length,qty.length)*4);
   if(y+height>bottom)nextPage();
   doc.setDrawColor(220,217,226);doc.setLineWidth(0.2);doc.rect(margin,y,width,height);for(const x of xs.slice(1,-1))doc.line(x,y,x,y+height);
   doc.addImage(images.get(row.source),'JPEG',xs[0]+3,y+3,16,21.333);
   text(row.product.code,xs[1]+2,y+7,8.5,true);text(name,xs[1]+2,y+12,7.5);
   text(color,xs[2]+2,y+8,8);text(size,xs[3]+2,y+8,8);text(qty,xs[4]+2,y+8,8);
   doc.setDrawColor(100,95,110);doc.rect(xs[5]+12,y+height/2-2,4,4);y+=height;
  }
  const total=rows.reduce((sum,row)=>sum+row.quantity,0);
  if(y+15>bottom)nextPage(false);y+=9;text('TOTAL: '+total+' bucăți',right-65,y,12,true);y+=10;
  if(person.notes){
   if(y+13>bottom)nextPage(false);text('Observații',margin,y,10,true);y+=6;
   for(const line of lines(person.notes,width,9)){if(y+5>bottom)nextPage(false);text(line,margin,y);y+=4.5;}
   y+=4;
  }
  const note='Fotografiile identifică modelul. Culoarea și mărimea sunt cele solicitate în tabel. Disponibilitatea se confirmă separat.';
  for(const line of lines(note,width,7.5)){if(y+5>bottom)nextPage(false);text(line,margin,y,7.5);y+=4;}
  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(220,217,226);doc.line(margin,283,right,283);text('Document pentru verificarea comenzii · Nu este factură',margin,289,7);text(i+' / '+pages,186,289,7);}
  return doc.output('blob');
 }
 create.addEventListener('click',async()=>{
  if(!selectedProducts().length)return;
  if(!validateRequest())return;
  for(const input of document.querySelectorAll('#selectionList [data-request-field="quantity"]')){
   if(!input.value){input.setCustomValidity('Completează cantitatea pentru PDF.');input.reportValidity();input.focus();return;}
  }
  for(const key of ['Name','Phone']){const input=document.querySelector('#orderCustomer'+key);input.value=input.value.trim();}
  if(!document.querySelector('#orderCustomerForm').reportValidity())return;
  const rows=rowsForOrder();if(!Number.isSafeInteger(rows.reduce((sum,row)=>sum+row.quantity,0))){status.textContent='Cantitatea totală este prea mare. Verifică valorile introduse.';return;}
  clearPrepared();const currentJob=++job,signature=snapshot(),person=customer(),created=new Date(),date=dateParts(created);
  if(!orderId)orderId='AJ-'+date.year+date.month+date.day+'-'+crypto.randomUUID().slice(0,8).toUpperCase();
  create.disabled=true;create.textContent='Se pregătește PDF-ul…';status.textContent='Pregătesc documentul și fotografiile…';
  try{
   const blob=await makePdf(rows,person,orderId,created);
   if(job!==currentJob||snapshot()!==signature)return;
   const file=new File([blob],'Comanda-'+orderId+'.pdf',{type:'application/pdf'});
   prepared=file;objectUrl=URL.createObjectURL(file);download.href=objectUrl;download.download=file.name;
   let canShare=false;try{canShare=typeof navigator.share==='function'&&!!navigator.canShare?.({files:[file]});}catch{}
   share.hidden=!canShare;ready.hidden=false;
   document.querySelector('#orderPdfHelp').textContent=canShare?'Apasă „Trimite PDF” și alege WhatsApp din meniul telefonului.':'Descarcă PDF-ul, apoi atașează-l în conversația WhatsApp.';
   status.textContent='PDF pregătit: '+rows.length+' variante, '+rows.reduce((n,r)=>n+r.quantity,0)+' bucăți.';
   create.textContent='Refă PDF-ul';
  }catch(error){if(job===currentJob){status.textContent=error.message||'PDF-ul nu a putut fi creat. Reîncearcă.';create.textContent='Reîncearcă PDF-ul';}}
  finally{if(job===currentJob)create.disabled=false;}
 });
 share.addEventListener('click',async()=>{
  if(!prepared)return;share.disabled=true;
  try{await navigator.share({files:[prepared],title:'Comandă AJ Paris Fashion'});status.textContent='PDF-ul a fost predat aplicației alese. Confirmă trimiterea acolo.';}
  catch(error){status.textContent=error.name==='AbortError'?'Partajare anulată. PDF-ul rămâne disponibil.':'Poți descărca PDF-ul și îl poți atașa manual în WhatsApp.';}
  finally{share.disabled=false;}
 });
})();
