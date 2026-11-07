const $=s=>document.querySelector(s);let catalog;let selectedCategory="";const PAGE_SIZE=12;const PREVIEW_SIZE=6;const NEW_CATEGORY='__new';const CATEGORIES=['Compleuri','Bluze și tricouri','Pulovere și cardigane','Pantaloni și jeans','Rochii','Fuste','Veste și jachete'];let visibleCount=PAGE_SIZE;
// Shuffle once per visit, then put NEW items first; navigation reuses this order.
function discoveryOrder(products){
 const shuffled=[...products];
 for(let i=shuffled.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
 }
 return [...shuffled.filter(product=>product.isNew),...shuffled.filter(product=>!product.isNew)];
}
function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
function photo(p,src=p.image,mode='detail'){
 const img=el('img',null,'photo'),media=p.media?.[src];
 img.alt=p.name+' · '+p.code+((p.aiImages||[]).includes(src)?' · Vizualizare AI':'');img.decoding='async';img.loading=mode==='detail'?'eager':'lazy';
 if(media){
  img.width=media.width;img.height=media.height;
  if(media.frame){img.classList.add('studio-frame');img.style.objectFit='cover';img.style.objectPosition=media.frame==='right'?'right center':'left center';img.style.aspectRatio=media.width+' / '+media.height;img.alt+=' · '+(media.frameLabel||(media.frame==='right'?'Cadru suplimentar':'Vedere generală'));}
  if(mode==='thumb'){img.src=media.small;}
  else if(mode==='card'){img.src=media.card;img.srcset=media.small+' 360w, '+media.card+' 640w';img.sizes='(max-width:700px) calc((100vw - 34px)/2), (max-width:1240px) calc((100vw - 96px)/3), 380px';}
  else{img.src=media.detail;img.srcset=media.card+' 640w, '+media.detail+' 1200w';img.sizes='(max-width:700px) 90vw, 540px';}
 }else{img.src=src;}
 img.onerror=()=>{img.onerror=null;if(media&&img.getAttribute('src')!==src){img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=src;return;}const box=el('div',null,'photo missing');box.append(el('strong',p.code),el('small','Fotografie indisponibilă'));img.replaceWith(box);};return img;
}
function sizeText(p){return (p.sizes||[]).map(size=>size==='TU'?'Talie universală (TU)':size).join(' · ');}
function info(p,parent){
 parent.append(el('p',(p.internalCode?'Cod intern: ':'Cod produs: ')+p.code,'code'),el('h2',p.name));
 const facts=el('dl',null,'product-facts'),colors=el('div'),colorValues=el('dd',null,'colors');
 colorValues.append(...p.colors.map(color=>el('span',color,'fact-chip')));colors.append(el('dt','Culori'),colorValues);facts.append(colors);
 const sizes=el('div'),sizeValues=el('dd',null,p.sizes?.length?'sizes':'size-inquiry');sizes.append(el('dt','Mărimi'));
 if(p.sizes?.length)sizeValues.append(...p.sizes.map(size=>el('span',size==='TU'?'Talie universală (TU)':size,'fact-chip size-chip')));
 else{const ask=el('button','Întreabă pe WhatsApp');ask.type='button';ask.onclick=()=>openWhatsApp(p,'Bună! Ce mărimi sunt disponibile pentru modelul '+p.code+'?');sizeValues.append(ask);}
 sizes.append(sizeValues);facts.append(sizes);parent.append(facts);
 if(p.description)parent.append(el('p',p.description,'product-description'));
 const price=el('div',null,'price-panel');price.append(el('span','Preț','price-label'),el('p',p.price===null?'Cere preț':p.price+' lei + TVA','price'));parent.append(price);
}
function detail(p){
 const c=$('#detailContent'),description=el('div',null,'detail-info'),gallery=el('div',null,'gallery'),mainPhoto=galleryPhoto(p,p.image);let activeSrc=p.image;gallery.append(mainPhoto);const enlarge=el('button','Mărește fotografia','photo-enlarge');enlarge.type='button';enlarge.setAttribute('aria-haspopup','dialog');enlarge.setAttribute('aria-controls','photoViewer');enlarge.onclick=()=>openPhotoViewer(p,activeSrc);gallery.append(enlarge);const caption=el('p',null,'image-caption');function updateCaption(src){caption.textContent=(p.aiImages||[]).includes(src)?'Imagine de studio creată cu AI':'Fotografie originală';}const images=p.images||[p.image];if(images.length>1){const thumbs=el('div',null,'thumbnails');images.forEach((src,i)=>{const thumb=el('button');thumb.type='button';thumb.setAttribute('aria-label','Fotografia '+(i+1)+' pentru '+p.code);thumb.setAttribute('aria-pressed',String(i===0));thumb.append(photo(p,src,'thumb'));thumb.onclick=()=>{activeSrc=src;const next=galleryPhoto(p,src);gallery.firstElementChild.replaceWith(next);updateCaption(src);thumbs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===thumb)));};thumbs.append(thumb);});gallery.append(thumbs);}if(p.colorVariantsImage){const variants=galleryPhoto(p,p.colorVariantsImage);variants.classList.add('color-variants');variants.alt='Variante de culoare pentru '+p.name+' · '+p.code;gallery.append(variants);}c.replaceChildren(gallery,description);if(p.isNew)description.append(el('span','NEW','new-badge'));info(p,description);description.append(selectionControl(p),el('p','Vânzare exclusiv angro.','wholesale'));
 if(catalog.whatsapp){const link=el('a','Întreabă pe WhatsApp','contact');link.href='https://wa.me/'+catalog.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Bună! Mă interesează modelul '+p.code+'. Îmi confirmați disponibilitatea și condițiile pentru angro?');link.target='_blank';link.rel='noopener';link.setAttribute('aria-haspopup','dialog');link.onclick=event=>{event.preventDefault();openWhatsApp(p);};description.append(link)}
 description.querySelector('h2').id='productTitle';$('#detail').showModal();$('#detail').scrollTop=0;document.body.style.overflow='hidden';
}
function renderCategories(){
 const categories=['',...CATEGORIES];
 const shortNames={'Bluze și tricouri':'Bluze și tricouri','Pulovere și cardigane':'Pulovere','Pantaloni și jeans':'Pantaloni','Veste și jachete':'Veste și jachete'};
 for(const target of ['#categories','#desktopCategories','#mobileCategories']){
  $(target).replaceChildren(...(target==='#mobileCategories'?['',NEW_CATEGORY,...CATEGORIES]:categories).map(category=>{
   const button=el('button',category===NEW_CATEGORY?'Noutăți':target==='#desktopCategories'?(shortNames[category]||category||'Toate'):(category||'Toate'),'category-button');button.type='button';button.dataset.category=category;button.setAttribute('aria-label',category===NEW_CATEGORY?'Noutăți':category||'Toate');button.setAttribute('aria-pressed',String(category===selectedCategory));
   button.onclick=()=>openCollection(category);return button;
  }));
 }
}
function openCollection(category){
 selectedCategory=category;
 $('#search').value='';
 if($('#menuDialog').open)$('#menuDialog').close();
 document.querySelectorAll('#categories button,#desktopCategories button,#mobileCategories button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
 render();
 window.scrollTo({top:0,behavior:'instant'});
 const heading=category?$('#collectionTitle'):$('#products h2');
 heading?.focus({preventScroll:true});
 const active=$('#mobileCategories button[aria-pressed="true"]');if(active&&$('#mobileCategories').getClientRects().length)$('#mobileCategories').scrollLeft=active.offsetLeft-$('#mobileCategories').offsetLeft-12;
}
function productCard(p,priority=false){
 const card=el('button',null,'product');card.type='button';card.dataset.code=p.code;card.setAttribute('aria-label','Deschide '+p.name+' '+p.code);
 const body=el('span',null,'card-info'),bottom=el('span',null,'card-bottom'),arrow=el('span',null,'arrow');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
 bottom.append(el('span',p.price===null?'Cere preț':p.price+' lei + TVA','price'),arrow);
 body.append(el('span',(p.internalCode?'Cod intern: ':'')+p.code,'code'),el('span',p.name,'name'),el('span',p.colors.length+' culori','color-count'));if(p.sizes?.length)body.append(el('span',(p.sizes.includes('TU')?'':'Mărimi: ')+sizeText(p),'card-sizes'));body.append(bottom);
 if(p.isNew)card.append(el('span','NEW','new-badge'));
 const image=photo(p,p.image,'card');if(priority){image.loading='eager';image.fetchPriority='high';}
 card.append(image,body);card.onclick=()=>detail(p);const tile=el('div',null,'product-tile');tile.append(card,selectionControl(p));return tile;
}
function renderOverview(products){
 let cardIndex=0;
 function section(title,category,items,total){
  const block=el('section',null,'collection-section'),heading=el('h2',title),header=el('div',null,'collection-section-header'),grid=el('div',null,'grid category-preview');
  heading.id='collection-'+(category===NEW_CATEGORY?'new':CATEGORIES.indexOf(category));heading.tabIndex=-1;block.setAttribute('aria-labelledby',heading.id);block.dataset.category=category;
  header.append(heading,el('span',total+' '+(total===1?'model':'modele'),'collection-total'));
  grid.append(...items.slice(0,PREVIEW_SIZE).map(product=>productCard(product,cardIndex++<2)));
  const more=el('button','Vezi toate ('+total+') →','view-collection');more.type='button';more.setAttribute('aria-label',category===NEW_CATEGORY?'Vezi toate noutățile':'Vezi toate: '+title);more.onclick=()=>openCollection(category);
  block.append(header,grid,more);$('#products').append(block);
 }
 const newProducts=products.filter(product=>product.isNew);
 if(newProducts.length)section('Noutăți',NEW_CATEGORY,newProducts,newProducts.length);
 for(const category of CATEGORIES){
  const members=products.filter(product=>product.category===category);
  if(members.length)section(category,category,members.filter(product=>!product.isNew),members.length);
 }
}
function render(append=false){
 if(!catalog)return;
 const query=$('#search').value.trim().toLocaleLowerCase('ro');
 const products=catalog.products.filter(p=>(!selectedCategory||(selectedCategory===NEW_CATEGORY?p.isNew:p.category===selectedCategory))&&(p.code+' '+p.name+' '+p.colors.join(' ')).toLocaleLowerCase('ro').includes(query));
 if($('#sort').value==='code')products.sort((a,b)=>a.code.localeCompare(b.code,'ro',{numeric:true}));
 const overview=!selectedCategory&&!query;
 $('#products').classList.toggle('grid',!overview);
 $('#products').classList.toggle('collections-overview',overview);
 $('#collectionNavigation').hidden=overview;
 $('#collectionTitle').textContent=selectedCategory===NEW_CATEGORY?'Noutăți':selectedCategory||'Rezultatele căutării';
 $('#pagination').hidden=overview;
 $('#count').replaceChildren(el('strong',String(products.length)),document.createTextNode(products.length===1?' model':' modele'));
 $('#empty').hidden=products.length!==0;
 if(!append){visibleCount=PAGE_SIZE;$('#products').replaceChildren();}
 if(overview){renderOverview(products);$('#loadMore').hidden=true;$('#pageStatus').textContent='';return;}
 const start=append?$('#products').children.length:0,batch=products.slice(start,visibleCount);
 $('#products').append(...batch.map((p,index)=>productCard(p,start===0&&index<2)));
 const shown=Math.min(visibleCount,products.length),remaining=products.length-shown;
 $('#loadMore').hidden=remaining===0;$('#loadMore').textContent='Vezi încă '+Math.min(PAGE_SIZE,remaining)+' produse →';$('#pageStatus').textContent=products.length?'Afișate '+shown+' din '+products.length+' produse':'';
 if(append&&remaining===0&&batch.length)$('#products').children[start].querySelector('.product')?.focus({preventScroll:true});
}
fetch('catalog.json?v=44').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{catalog={...data,products:discoveryOrder(data.products)};document.title=data.name+' · Catalog';restoreSelection();renderCategories();render();updateSelection()}).catch(()=>{$('#products').textContent='Catalogul nu s-a putut încărca. Reîncarcă pagina.'});
$('#backToCollections').onclick=()=>openCollection('');
$('#search').addEventListener('input',()=>render());$('#sort').addEventListener('change',()=>render());
$('#loadMore').addEventListener('click',()=>{visibleCount+=PAGE_SIZE;render(true);});
const dialog=$('#detail');
$('#close').onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';});

const whatsappDialog=$('#whatsappDialog');
function openWhatsApp(product,customMessage){
 const message=customMessage||(Array.isArray(product)?'Bună! Mă interesează următoarele modele pentru angro:\n'+product.map(p=>'- '+p.code).join('\n')+'\nÎmi confirmați disponibilitatea, prețurile și condițiile pentru angro?':product?'Bună! Mă interesează modelul '+product.code+'. Îmi confirmați disponibilitatea și condițiile pentru angro?':'Bună! Mă interesează produsele din catalogul AJ Paris Fashion.');
 whatsappDialog.querySelectorAll('.contact-list a').forEach(link=>{link.href='https://wa.me/'+link.dataset.phone+'?text='+encodeURIComponent(message);});
 whatsappDialog.querySelector('.contact-intro').textContent=Array.isArray(product)?'Trimite selecția de '+product.length+' '+(product.length===1?'model':'modele')+' persoanei cu care vrei să vorbești.':'Alege persoana cu care vrei să vorbești.';
 whatsappDialog.showModal();document.body.style.overflow='hidden';
}
$('.header-contact').onclick=event=>{event.preventDefault();openWhatsApp();};
$('#whatsappClose').onclick=()=>whatsappDialog.close();
whatsappDialog.addEventListener('close',()=>{document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';});
whatsappDialog.addEventListener('click',event=>{if(event.target===whatsappDialog){const r=whatsappDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)whatsappDialog.close();}});

const backToTop=$('#backToTop');
function updateBackToTop(){backToTop.hidden=window.scrollY<400;}
window.addEventListener('scroll',updateBackToTop,{passive:true});updateBackToTop();
backToTop.onclick=()=>{window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};

const menuDialog=$('#menuDialog');
$('#menuToggle').onclick=()=>{menuDialog.showModal();menuDialog.focus({preventScroll:true});document.body.style.overflow='hidden';};
$('#menuClose').onclick=()=>menuDialog.close();
menuDialog.addEventListener('close',()=>{document.body.style.overflow=(whatsappDialog.open||dialog.open)?'hidden':'';});
$('#menuContact').onclick=()=>{menuDialog.close();openWhatsApp();};
$('#searchToggle').onclick=()=>{
 const panel=$('#searchPanel'),opening=panel.hidden;panel.hidden=!opening;$('#searchToggle').setAttribute('aria-expanded',String(opening));
 if(opening){$('#search').focus();}else{$('#search').value='';render();}
};
$('#search').addEventListener('keydown',event=>{if(event.key==='Escape'){$('#searchPanel').hidden=true;$('#searchToggle').setAttribute('aria-expanded','false');$('#search').value='';render();$('#searchToggle').focus();}});

$('#desktopContact').onclick=()=>openWhatsApp();

// Product selection stays in this browser tab; only an explicit link opens WhatsApp.
const selectedCodes=new Set();
function restoreSelection(){
 try{const saved=JSON.parse(sessionStorage.getItem('ajparis-selection')||'[]');if(Array.isArray(saved))saved.forEach(code=>{if(catalog.products.some(p=>p.code===code))selectedCodes.add(code);});}catch{}
}
function selectedProducts(){return [...selectedCodes].map(code=>catalog.products.find(p=>p.code===code)).filter(Boolean);}
function selectionControl(product){
 const label=el('label',null,'selection-toggle'),input=el('input'),text=el('span',selectedCodes.has(product.code)?'Selectat':'Selectează');
 input.type='checkbox';input.dataset.selectCode=product.code;input.checked=selectedCodes.has(product.code);input.setAttribute('aria-label','Selectează '+product.name+' '+product.code);
 input.onchange=()=>{if(input.checked)selectedCodes.add(product.code);else selectedCodes.delete(product.code);updateSelection();$('#selectionStatus').textContent=(input.checked?'Adăugat: ':'Eliminat: ')+product.code+'. '+selectedCodes.size+' modele selectate.';};
 label.append(input,text);return label;
}
function updateSelection(){
 try{sessionStorage.setItem('ajparis-selection',JSON.stringify([...selectedCodes]));}catch{}
 document.querySelectorAll('[data-select-code]').forEach(input=>{input.checked=selectedCodes.has(input.dataset.selectCode);input.nextElementSibling.textContent=input.checked?'Selectat':'Selectează';});
 $('#selectionBar').hidden=!selectedCodes.size;$('#selectionCount').textContent=selectedCodes.size;document.body.classList.toggle('has-selection',!!selectedCodes.size);
 if($('#selectionDialog').open){if(selectedCodes.size)renderSelection();else $('#selectionDialog').close();}
}
function renderSelection(){
 $('#selectionList').replaceChildren(...selectedProducts().map(product=>{
  const row=el('li'),text=el('div'),remove=el('button','Elimină');remove.type='button';remove.setAttribute('aria-label','Elimină '+product.code+' din selecție');
  text.append(el('strong',product.code),el('span',product.name));row.append(photo(product,product.image,'thumb'),text,remove);
  remove.onclick=()=>{const index=[...$('#selectionList').children].indexOf(row);selectedCodes.delete(product.code);updateSelection();$('#selectionStatus').textContent='Eliminat: '+product.code+'. '+selectedCodes.size+' modele selectate.';if($('#selectionDialog').open){const buttons=$('#selectionList').querySelectorAll('button');(buttons[Math.min(index,buttons.length-1)]||$('#selectionSend')).focus();}};return row;
 }));
}
$('#reviewSelection').onclick=()=>{if(!selectedCodes.size)return;renderSelection();$('#selectionDialog').showModal();document.body.style.overflow='hidden';};
$('#selectionClose').onclick=()=>$('#selectionDialog').close();
$('#selectionDialog').addEventListener('close',()=>{document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';if(!selectedCodes.size)$('#searchToggle').focus({preventScroll:true});});
$('#selectionClear').onclick=()=>{selectedCodes.clear();updateSelection();$('#selectionStatus').textContent='Selecția a fost golită.';};
$('#selectionSend').onclick=()=>{const products=selectedProducts();if(products.length)openWhatsApp(products);};

// The viewer enlarges the original file and preserves left/right studio frames.
function galleryPhoto(product,source){const img=photo(product,source);img.classList.add('zoomable-photo');img.onclick=()=>openPhotoViewer(product,source);return img;}
const photoViewer=$('#photoViewer'),photoStage=$('#photoStage'),photoFrame=$('#photoFrame');
let viewerProduct,viewerImages=[],viewerIndex=0,viewerScale=1,viewerX=0,viewerY=0,viewerWidth=0,viewerHeight=0;
const viewerPointers=new Map();
function fitPhotoViewer(){
 if(!photoViewer.open||!viewerProduct)return;
 const source=viewerImages[viewerIndex],meta=viewerProduct.media?.[source],width=meta?.width||1200,height=meta?.height||1600;
 const fit=Math.min((photoStage.clientWidth-24)/width,(photoStage.clientHeight-24)/height,1);
 viewerWidth=width*fit;viewerHeight=height*fit;photoFrame.style.width=viewerWidth+'px';photoFrame.style.height=viewerHeight+'px';resetPhotoZoom();
}
function applyPhotoZoom(){
 const maxX=Math.max(0,(viewerWidth*viewerScale-photoStage.clientWidth)/2),maxY=Math.max(0,(viewerHeight*viewerScale-photoStage.clientHeight)/2);
 viewerX=Math.max(-maxX,Math.min(maxX,viewerX));viewerY=Math.max(-maxY,Math.min(maxY,viewerY));
 photoFrame.style.transform='translate('+viewerX+'px,'+viewerY+'px) scale('+viewerScale+')';
 $('#photoZoomLevel').textContent=Number(viewerScale.toFixed(1))+'×';$('#photoZoomOut').disabled=viewerScale<=1;$('#photoZoomIn').disabled=viewerScale>=4;
 photoStage.classList.toggle('is-zoomed',viewerScale>1);
}
function zoomPhoto(value,clientX,clientY){
 const next=Math.max(1,Math.min(4,value)),rect=photoStage.getBoundingClientRect(),x=clientX===undefined?0:clientX-rect.left-rect.width/2,y=clientY===undefined?0:clientY-rect.top-rect.height/2,ratio=next/viewerScale;
 viewerX=x-(x-viewerX)*ratio;viewerY=y-(y-viewerY)*ratio;viewerScale=next;applyPhotoZoom();
}
function resetPhotoZoom(){viewerScale=1;viewerX=0;viewerY=0;applyPhotoZoom();}
function loadViewerPhoto(){
 const source=viewerImages[viewerIndex],image=photo(viewerProduct,source);image.removeAttribute('srcset');image.removeAttribute('sizes');image.src=source.split('#')[0];image.loading='eager';image.draggable=false;
 photoFrame.replaceChildren(image);$('#photoViewerCode').textContent=viewerProduct.code;$('#photoViewerName').textContent=viewerProduct.name;
 $('#photoPosition').textContent=(viewerIndex+1)+' / '+viewerImages.length;$('#photoPrevious').disabled=viewerIndex===0;$('#photoNext').disabled=viewerIndex===viewerImages.length-1;
 viewerPointers.clear();fitPhotoViewer();
}
function openPhotoViewer(product,source){
 viewerProduct=product;viewerImages=[...new Set([...(product.images||[product.image]),...(product.colorVariantsImage?[product.colorVariantsImage]:[])])];if(!viewerImages.includes(source))viewerImages.push(source);viewerIndex=viewerImages.indexOf(source);
 photoViewer.showModal();document.body.style.overflow='hidden';loadViewerPhoto();
}
$('#photoViewerClose').onclick=()=>photoViewer.close();
photoViewer.addEventListener('close',()=>{viewerPointers.clear();photoFrame.replaceChildren();document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';$('#detail .photo-enlarge')?.focus({preventScroll:true});});
$('#photoZoomIn').onclick=()=>zoomPhoto(viewerScale+.5);$('#photoZoomOut').onclick=()=>zoomPhoto(viewerScale-.5);$('#photoReset').onclick=resetPhotoZoom;
$('#photoPrevious').onclick=()=>{if(viewerIndex>0){viewerIndex--;loadViewerPhoto();}};$('#photoNext').onclick=()=>{if(viewerIndex<viewerImages.length-1){viewerIndex++;loadViewerPhoto();}};
photoStage.addEventListener('wheel',event=>{event.preventDefault();zoomPhoto(viewerScale*Math.exp(-event.deltaY*.002),event.clientX,event.clientY);},{passive:false});
photoStage.addEventListener('dblclick',event=>zoomPhoto(viewerScale>1?1:2.5,event.clientX,event.clientY));
photoStage.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;viewerPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});photoStage.setPointerCapture(event.pointerId);});
photoStage.addEventListener('pointermove',event=>{
 if(!viewerPointers.has(event.pointerId))return;
 const before=[...viewerPointers.values()],old=viewerPointers.get(event.pointerId);viewerPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const after=[...viewerPointers.values()];
 if(after.length===1){viewerX+=event.clientX-old.x;viewerY+=event.clientY-old.y;applyPhotoZoom();}
 else if(after.length===2){const distance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),oldDistance=distance(before),midX=(after[0].x+after[1].x)/2,midY=(after[0].y+after[1].y)/2;
  if(oldDistance>0)zoomPhoto(viewerScale*distance(after)/oldDistance,midX,midY);
  viewerX+=midX-(before[0].x+before[1].x)/2;viewerY+=midY-(before[0].y+before[1].y)/2;applyPhotoZoom();
 }
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])photoStage.addEventListener(type,event=>viewerPointers.delete(event.pointerId));
photoStage.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();viewerX+=event.key==='ArrowLeft'?45:event.key==='ArrowRight'?-45:0;viewerY+=event.key==='ArrowUp'?45:event.key==='ArrowDown'?-45:0;applyPhotoZoom();}else if(event.key==='+'||event.key==='='){event.preventDefault();zoomPhoto(viewerScale+.5);}else if(event.key==='-'){event.preventDefault();zoomPhoto(viewerScale-.5);}else if(event.key==='Home'){event.preventDefault();resetPhotoZoom();}});
window.addEventListener('resize',fitPhotoViewer);
