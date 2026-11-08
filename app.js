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
function detail(p,{fromRoute=false}={}){
 hideSuggestions();
 const c=$('#detailContent'),description=el('div',null,'detail-info'),gallery=el('div',null,'gallery'),images=[...new Set([p.image,...(p.images||[])])];let currentIndex=0;
 const thumbnails=el('div',null,'thumbnails'),position=el('span',null,'gallery-position');gallery.tabIndex=0;gallery.setAttribute('role','group');gallery.setAttribute('aria-label','Fotografii pentru '+p.code+'; săgeți stânga și dreapta pentru schimbare');position.setAttribute('aria-live','polite');
 function mainPhoto(){
  const source=images[currentIndex],img=galleryPhoto(p,source);img.draggable=false;let start;
  img.onclick=null;
  img.addEventListener('pointerdown',event=>{if(!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0)){start=null;return;}start={id:event.pointerId,x:event.clientX,y:event.clientY};img.setPointerCapture(event.pointerId);});
  img.addEventListener('pointerup',event=>{if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;if(images.length>1&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){showImage(currentIndex+(dx<0?1:-1));}});
  img.addEventListener('pointercancel',()=>{start=null;});return img;
 }
 function showImage(index){currentIndex=(index+images.length)%images.length;gallery.firstElementChild.replaceWith(mainPhoto());position.textContent=(currentIndex+1)+' / '+images.length;thumbnails.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===currentIndex)));}
 gallery.append(mainPhoto());
 if(images.length>1){
  const arrows=el('div',null,'gallery-arrows');
  for(const [direction,label,glyph] of [[-1,'Fotografia anterioară','←'],[1,'Fotografia următoare','→']]){const button=el('button',glyph);button.type='button';button.setAttribute('aria-label',label);button.onclick=()=>showImage(currentIndex+direction);arrows.append(button);}
  position.textContent='1 / '+images.length;gallery.append(arrows,position);
  gallery.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showImage(currentIndex+(event.key==='ArrowRight'?1:-1));}});
 }
 const enlarge=el('button','+ Mărește fotografia','photo-enlarge');enlarge.type='button';enlarge.setAttribute('aria-haspopup','dialog');enlarge.setAttribute('aria-controls','photoViewer');enlarge.onclick=()=>openPhotoViewer(p,images[currentIndex]);gallery.append(enlarge);
 if(images.length>1){images.forEach((source,index)=>{const thumb=el('button');thumb.type='button';thumb.setAttribute('aria-label','Fotografia '+(index+1)+' pentru '+p.code);thumb.setAttribute('aria-pressed',String(index===0));thumb.append(photo(p,source,'thumb'));thumb.onclick=()=>showImage(index);thumbnails.append(thumb);});gallery.append(thumbnails);}
 if(p.colorVariantsImage){const variants=galleryPhoto(p,p.colorVariantsImage);variants.classList.add('color-variants');variants.alt='Variante de culoare pentru '+p.name+' · '+p.code;gallery.append(variants);}
 c.replaceChildren(gallery,description);if(p.isNew)description.append(el('span','NEW','new-badge'));info(p,description);description.append(selectionControl(p),el('p','Vânzare exclusiv angro.','wholesale'));
 if(catalog.whatsapp){const link=el('a','Întreabă pe WhatsApp','contact');link.href='https://wa.me/'+catalog.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Bună! Mă interesează modelul '+p.code+'. Îmi confirmați disponibilitatea și condițiile pentru angro?');link.target='_blank';link.rel='noopener';link.setAttribute('aria-haspopup','dialog');link.onclick=event=>{event.preventDefault();openWhatsApp(p);};description.append(link);}
 const share=el('div',null,'product-share'),copy=el('button','Copiază linkul produsului'),status=el('p',null,'share-status'),fallback=el('input');copy.type='button';status.setAttribute('role','status');fallback.type='url';fallback.readOnly=true;fallback.hidden=true;fallback.setAttribute('aria-label','Link direct către '+p.code);fallback.value=productURL(p);copy.onclick=async()=>{try{await navigator.clipboard.writeText(productURL(p));status.textContent='Link copiat. Îl poți trimite mai departe.';fallback.hidden=true;}catch{status.textContent='Selectează și copiază linkul:';fallback.hidden=false;fallback.focus();fallback.select();}};share.append(copy,status,fallback);description.append(share);
 description.querySelector('h2').id='productTitle';$('#detail').dataset.code=p.code;if(!$('#detail').open)$('#detail').showModal();$('#detail').scrollTop=0;document.body.style.overflow='hidden';
 document.title=p.name+' · '+p.code+' · AJ Paris Fashion';
 if(!fromRoute&&new URL(location.href).searchParams.get('produs')!==p.code){const url=new URL(location.href);url.searchParams.set('produs',p.code);history.pushState(null,'',url);}
}
function productURL(p){const url=new URL(location.pathname,location.origin);url.searchParams.set('produs',p.code);return url.href;}
function syncProductRoute(){
 if(!catalog)return;
 const code=new URL(location.href).searchParams.get('produs'),product=catalog.products.find(p=>p.code===code);
 $('#productRouteStatus').hidden=!code||Boolean(product);
 if(product||$('#detail').open)for(const id of ['#photoViewer','#whatsappDialog','#selectionDialog','#menuDialog'])if($(id).open)$(id).close();
 if(product)detail(product,{fromRoute:true});
 else if($('#detail').open)$('#detail').close();
}
window.addEventListener('popstate',syncProductRoute);
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
 hideSuggestions();
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
function searchText(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ro').trim();}
function searchProducts(){const query=searchText($('#search').value);return catalog.products.filter(p=>(!selectedCategory||(selectedCategory===NEW_CATEGORY?p.isNew:p.category===selectedCategory))&&searchText(p.code+' '+p.name+' '+p.colors.join(' ')).includes(query)&&matchesFilters(p));}
function hideSuggestions(){$('#searchSuggestions').hidden=true;}
function updateSuggestions(){
 const panel=$('#searchSuggestions'),query=searchText($('#search').value);panel.replaceChildren();
 if(!catalog||!query||$('#searchPanel').hidden||!$('#searchArea').contains(document.activeElement)){hideSuggestions();return;}
 const products=searchProducts().sort((a,b)=>{const rank=p=>searchText(p.code)===query?0:searchText(p.code).startsWith(query)?1:2;return rank(a)-rank(b);});
 if(!products.length)panel.append(el('p','Niciun produs găsit. Încearcă alt cod sau altă culoare.','suggestion-empty'));
 else{
  const list=el('ul');for(const p of products.slice(0,6)){const item=el('li'),button=el('button',null,'search-suggestion'),text=el('span');button.type='button';button.dataset.code=p.code;text.append(el('strong',p.name),el('small',p.code+' · '+(p.price===null?'Cere preț':p.price+' lei + TVA')));button.append(photo(p,p.image,'thumb'),text);button.onclick=()=>detail(p);item.append(button);list.append(item);}panel.append(list);
  const all=el('button','Vezi toate rezultatele ('+products.length+')','search-all');all.type='button';all.onclick=()=>{hideSuggestions();$('#collectionTitle').focus({preventScroll:true});$('#collectionTitle').scrollIntoView({block:'center',behavior:'instant'});};panel.append(all);
 }
 panel.hidden=false;
}
function render(append=false){
 if(!catalog)return;
 const query=$('#search').value.trim().toLocaleLowerCase('ro');
 const products=searchProducts();
 updateSuggestions();
 if($('#sort').value==='code')products.sort((a,b)=>a.code.localeCompare(b.code,'ro',{numeric:true}));
 syncFilterSummary();
 const overview=!selectedCategory&&!query&&!filtersActive();
 $('#products').classList.toggle('grid',!overview);
 $('#products').classList.toggle('collections-overview',overview);
 $('#collectionNavigation').hidden=overview;
 $('#collectionTitle').textContent=selectedCategory===NEW_CATEGORY?'Noutăți':selectedCategory||(query?'Rezultatele căutării':'Rezultatele filtrării');
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
fetch('catalog.json?v=45').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{catalog={...data,products:discoveryOrder(data.products)};document.title=data.name+' · Catalog';initFilters();restoreSelection();renderCategories();render();updateSelection();syncProductRoute()}).catch(()=>{$('#products').textContent='Catalogul nu s-a putut încărca. Reîncarcă pagina.'});
$('#backToCollections').onclick=()=>openCollection('');
$('#search').addEventListener('input',()=>render());$('#sort').addEventListener('change',()=>render());
$('#loadMore').addEventListener('click',()=>{visibleCount+=PAGE_SIZE;render(true);});
const dialog=$('#detail');
$('#close').onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{if(dialog.open)return;document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';document.title=catalog.name+' · Catalog';const url=new URL(location.href);if(url.searchParams.get('produs')===dialog.dataset.code){url.searchParams.delete('produs');history.replaceState(null,'',url);}});

const whatsappDialog=$('#whatsappDialog');
function openWhatsApp(product,customMessage){
 const message=customMessage||(Array.isArray(product)?selectionMessage(product):product?'Bună! Mă interesează modelul '+product.code+'. Îmi confirmați disponibilitatea și condițiile pentru angro?':'Bună! Mă interesează produsele din catalogul AJ Paris Fashion.');
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
 if(opening){$('#search').focus();}else{$('#search').value='';hideSuggestions();render();}
};
$('#search').addEventListener('focus',updateSuggestions);
$('#searchArea').addEventListener('focusout',event=>{if(!$('#searchArea').contains(event.relatedTarget))hideSuggestions();});
document.addEventListener('click',event=>{if(!$('#searchArea').contains(event.target))hideSuggestions();});
$('#searchArea').addEventListener('keydown',event=>{
 const buttons=[...$('#searchSuggestions').querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
 if(event.key==='Escape'&&!$('#searchSuggestions').hidden){event.preventDefault();hideSuggestions();$('#search').focus();hideSuggestions();return;}
 if(event.key==='ArrowDown'&&buttons.length&&!$('#searchSuggestions').hidden){event.preventDefault();buttons[(index+1)%buttons.length].focus();}
 if(event.key==='ArrowUp'&&index>=0){event.preventDefault();if(index===0)$('#search').focus();else buttons[index-1].focus();}
 if(event.key==='Enter'&&event.target===$('#search')){event.preventDefault();hideSuggestions();$('#search').blur();}
 if(event.key==='Escape'){$('#searchPanel').hidden=true;$('#searchToggle').setAttribute('aria-expanded','false');$('#search').value='';hideSuggestions();render();$('#searchToggle').focus();}
});

$('#desktopContact').onclick=()=>openWhatsApp();

// Product selection stays in this browser tab; only an explicit link opens WhatsApp.
const selectedCodes=new Set(),requestDetails=new Map();
function cleanRequestLine(product,line={}){
 const quantity=String(line?.quantity??'');
 return {color:product.colors.includes(line?.color)?line.color:'',size:product.sizes?.length?(product.sizes.includes(line?.size)?line.size:''):String(line?.size??'').replace(/[\r\n\t]+/g,' ').slice(0,40),quantity:quantity&&Number.isSafeInteger(Number(quantity))&&Number(quantity)>0?String(Number(quantity)):''};
}
function requestLines(product){if(!requestDetails.has(product.code))requestDetails.set(product.code,[cleanRequestLine(product)]);return requestDetails.get(product.code);}
function persistSelection(){
 try{sessionStorage.setItem('ajparis-selection',JSON.stringify([...selectedCodes]));sessionStorage.setItem('ajparis-request-details',JSON.stringify(Object.fromEntries([...selectedCodes].map(code=>[code,requestDetails.get(code)||[]]))));}catch{}
}
function restoreSelection(){
 try{const saved=JSON.parse(sessionStorage.getItem('ajparis-selection')||'[]');if(Array.isArray(saved))saved.forEach(code=>{if(catalog.products.some(p=>p.code===code))selectedCodes.add(code);});}catch{}
 let details;try{details=JSON.parse(sessionStorage.getItem('ajparis-request-details')||'{}');}catch{}
 for(const product of selectedProducts()){const lines=details?.[product.code];requestDetails.set(product.code,Array.isArray(lines)&&lines.length?lines.map(line=>cleanRequestLine(product,line)):[cleanRequestLine(product)]);}
}
function selectedProducts(){return [...selectedCodes].map(code=>catalog.products.find(p=>p.code===code)).filter(Boolean);}
function selectionControl(product){
 const label=el('label',null,'selection-toggle'),input=el('input'),text=el('span',selectedCodes.has(product.code)?'Selectat':'Selectează');
 input.type='checkbox';input.dataset.selectCode=product.code;input.checked=selectedCodes.has(product.code);input.setAttribute('aria-label','Selectează '+product.name+' '+product.code);
 input.onchange=()=>{if(input.checked)selectedCodes.add(product.code);else{selectedCodes.delete(product.code);requestDetails.delete(product.code);}updateSelection();$('#selectionStatus').textContent=(input.checked?'Adăugat: ':'Eliminat: ')+product.code+'. '+selectedCodes.size+' modele selectate.';};
 label.append(input,text);return label;
}
function updateSelection(){
 for(const product of selectedProducts())requestLines(product);persistSelection();
 document.querySelectorAll('[data-select-code]').forEach(input=>{input.checked=selectedCodes.has(input.dataset.selectCode);input.nextElementSibling.textContent=input.checked?'Selectat':'Selectează';});
 $('#selectionBar').hidden=!selectedCodes.size;$('#selectionCount').textContent=selectedCodes.size;document.body.classList.toggle('has-selection',!!selectedCodes.size);
 if($('#selectionDialog').open){if(selectedCodes.size)renderSelection();else $('#selectionDialog').close();}
}
function renderSelection(){
 $('#selectionList').replaceChildren(...selectedProducts().map(product=>{
  const row=el('li'),text=el('div'),remove=el('button','Elimină');remove.type='button';remove.className='remove-product';remove.setAttribute('aria-label','Elimină '+product.code+' din selecție');
  text.append(el('strong',product.code),el('span',product.name));row.append(photo(product,product.image,'thumb'),text,remove,requestEditor(product));
  remove.onclick=()=>{const index=[...$('#selectionList').children].indexOf(row);selectedCodes.delete(product.code);requestDetails.delete(product.code);updateSelection();$('#selectionStatus').textContent='Eliminat: '+product.code+'. '+selectedCodes.size+' modele selectate.';if($('#selectionDialog').open){const buttons=$('#selectionList').querySelectorAll('.remove-product');(buttons[Math.min(index,buttons.length-1)]||$('#selectionSend')).focus();}};return row;
 }));
}
$('#reviewSelection').onclick=()=>{if(!selectedCodes.size)return;renderSelection();$('#selectionDialog').showModal();document.body.style.overflow='hidden';};
$('#selectionClose').onclick=()=>$('#selectionDialog').close();
$('#selectionDialog').addEventListener('close',()=>{document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';if(!selectedCodes.size)$('#searchToggle').focus({preventScroll:true});});
$('#selectionClear').onclick=()=>{selectedCodes.clear();requestDetails.clear();updateSelection();$('#selectionStatus').textContent='Selecția a fost golită.';};
$('#selectionSend').onclick=()=>{const products=selectedProducts();if(products.length&&validateRequest())openWhatsApp(products);};

// The viewer enlarges the original file and preserves left/right studio frames.
function galleryPhoto(product,source){const img=photo(product,source);img.classList.add('zoomable-photo');return img;}
const photoViewer=$('#photoViewer'),photoStage=$('#photoStage'),photoFrame=$('#photoFrame');
let viewerProduct,viewerImages=[],viewerIndex=0,viewerScale=1,viewerX=0,viewerY=0,viewerWidth=0,viewerHeight=0;
const viewerPointers=new Map();let viewerSwipe;
function fitPhotoViewer(){
 if(!photoViewer.open||!viewerProduct)return;
 const viewport=window.visualViewport;photoViewer.style.width=(viewport?.width||innerWidth)+'px';photoViewer.style.height=(viewport?.height||innerHeight)+'px';photoViewer.style.left=(viewport?.offsetLeft||0)+'px';photoViewer.style.top=(viewport?.offsetTop||0)+'px';
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
 $('#photoPosition').textContent=(viewerIndex+1)+' / '+viewerImages.length;$('#photoPrevious').disabled=viewerImages.length<2;$('#photoNext').disabled=viewerImages.length<2;
 viewerPointers.clear();fitPhotoViewer();
}
function openPhotoViewer(product,source){
 viewerProduct=product;viewerImages=[...new Set([...(product.images||[product.image]),...(product.colorVariantsImage?[product.colorVariantsImage]:[])])];if(!viewerImages.includes(source))viewerImages.push(source);viewerIndex=viewerImages.indexOf(source);
 photoViewer.showModal();document.body.style.overflow='hidden';loadViewerPhoto();
}
$('#photoViewerClose').onclick=()=>photoViewer.close();
photoViewer.addEventListener('close',()=>{viewerPointers.clear();viewerSwipe=null;photoFrame.replaceChildren();document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';$('#detail .photo-enlarge')?.focus({preventScroll:true});});
$('#photoZoomIn').onclick=()=>zoomPhoto(viewerScale+.5);$('#photoZoomOut').onclick=()=>zoomPhoto(viewerScale-.5);$('#photoReset').onclick=resetPhotoZoom;
function stepViewerPhoto(direction){if(viewerImages.length>1){viewerIndex=(viewerIndex+direction+viewerImages.length)%viewerImages.length;loadViewerPhoto();}}
$('#photoPrevious').onclick=()=>stepViewerPhoto(-1);$('#photoNext').onclick=()=>stepViewerPhoto(1);
photoStage.addEventListener('wheel',event=>{event.preventDefault();if(viewerScale>1){viewerX-=event.deltaX;viewerY-=event.deltaY;applyPhotoZoom();}},{passive:false});
photoStage.addEventListener('dblclick',event=>event.preventDefault());
photoStage.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;if(viewerPointers.size===0)viewerSwipe={id:event.pointerId,x:event.clientX,y:event.clientY,scale:viewerScale,pinched:false};else if(viewerSwipe)viewerSwipe.pinched=true;viewerPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});photoStage.setPointerCapture(event.pointerId);});
photoStage.addEventListener('pointermove',event=>{
 if(!viewerPointers.has(event.pointerId))return;
 const before=[...viewerPointers.values()],old=viewerPointers.get(event.pointerId);viewerPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const after=[...viewerPointers.values()];
 if(after.length===1){viewerX+=event.clientX-old.x;viewerY+=event.clientY-old.y;applyPhotoZoom();}

});
for(const type of ['pointerup','pointercancel','lostpointercapture'])photoStage.addEventListener(type,event=>viewerPointers.delete(event.pointerId));
photoStage.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();viewerX+=event.key==='ArrowLeft'?45:event.key==='ArrowRight'?-45:0;viewerY+=event.key==='ArrowUp'?45:event.key==='ArrowDown'?-45:0;applyPhotoZoom();}else if(event.key==='Home'){event.preventDefault();resetPhotoZoom();}});
window.addEventListener('resize',fitPhotoViewer);
window.visualViewport?.addEventListener('resize',fitPhotoViewer);
window.visualViewport?.addEventListener('scroll',()=>{if(photoViewer.open){photoViewer.style.left=window.visualViewport.offsetLeft+'px';photoViewer.style.top=window.visualViewport.offsetTop+'px';}});

function requestEditor(product){
 const editor=el('div',null,'request-editor'),lines=requestLines(product);
 lines.forEach((line,index)=>{
  const group=el('fieldset',null,'request-line');group.dataset.code=product.code;group.dataset.variant=String(index);group.append(el('legend','Varianta '+(index+1)));
  function field(title,name,input){const label=el('label',title);input.dataset.requestField=name;input.dataset.requestCode=product.code;input.dataset.variant=String(index);input.setAttribute('aria-label',title+' pentru '+product.code+', varianta '+(index+1));input.value=line[name];label.append(input);group.append(label);input.addEventListener('input',()=>{line[name]=input.value;input.setCustomValidity('');persistSelection();});return input;}
  function select(values,format=value=>value){const input=el('select'),placeholder=el('option','De confirmat');placeholder.value='';input.append(placeholder,...values.map(value=>{const option=el('option',format(value));option.value=value;return option;}));return input;}
  field('Culoare','color',select(product.colors));
  if(product.sizes?.length)field('Mărime','size',select(product.sizes,size=>size==='TU'?'Talie universală (TU)':size));
  else{const input=el('input');input.type='text';input.maxLength=40;input.placeholder='Mărime dorită';field('Mărime solicitată','size',input);}
  const quantity=el('input');quantity.type='number';quantity.min='1';quantity.step='1';quantity.inputMode='numeric';quantity.placeholder='Ex. 10';field('Cantitate dorită','quantity',quantity);
  if(lines.length>1){const remove=el('button','Elimină varianta','remove-variant');remove.type='button';remove.setAttribute('aria-label','Elimină varianta '+(index+1)+' pentru '+product.code);remove.onclick=()=>{lines.splice(index,1);persistSelection();renderSelection();$('#selectionList [data-add-variant="'+product.code+'"]').focus();};group.append(remove);}
  editor.append(group);
 });
 const add=el('button','+ Adaugă altă variantă','add-variant');add.type='button';add.dataset.addVariant=product.code;add.onclick=()=>{lines.push(cleanRequestLine(product));persistSelection();renderSelection();const controls=$('#selectionList').querySelectorAll('[data-request-code="'+product.code+'"][data-request-field="color"]');controls[controls.length-1].focus();};editor.append(add);return editor;
}
function validateRequest(){
 for(const input of $('#selectionList').querySelectorAll('input')){
  input.setCustomValidity('');
  if(input.dataset.requestField==='quantity'&&input.value&&(!Number.isSafeInteger(Number(input.value))||Number(input.value)<1))input.setCustomValidity('Introdu o cantitate întreagă, mai mare decât zero.');
  if(!input.reportValidity())return false;
 }
 return true;
}
function selectionMessage(products){
 const lines=products.map(product=>'- '+product.code+'\n'+requestLines(product).map((line,index)=>'  Varianta '+(index+1)+': culoare '+(line.color||'de confirmat')+'; mărime '+(line.size?(line.size==='TU'?'Talie universală (TU)':line.size).replace(/[\r\n\t]+/g,' '):'de confirmat')+'; cantitate dorită '+(line.quantity?String(Number(line.quantity)):'de precizat')).join('\n'));
 return 'Bună! Mă interesează următoarele modele pentru angro:\n'+lines.join('\n')+'\nÎmi confirmați disponibilitatea variantelor și cantităților solicitate, prețurile și condițiile pentru angro?';
}
function filterValues(){return {size:$('#filterSize').value,color:$('#filterColor').value,price:$('#filterPrice').value,min:$('#filterMin').value,max:$('#filterMax').value,newOnly:$('#filterNew').checked};}
function filtersActive(){const f=filterValues();return !!(f.size||f.color||f.price!=='all'||f.min||f.max||f.newOnly);}
function filterProblem(f){
 if(f.price==='unknown')return '';
 if(!$('#filterMin').validity.valid||!$('#filterMax').validity.valid)return 'Introdu prețuri pozitive sau zero.';
 if(f.min!==''&&f.max!==''&&Number(f.min)>Number(f.max))return 'Prețul maxim trebuie să fie cel puțin egal cu prețul minim.';
 return '';
}
function matchesFilters(product){
 const f=filterValues();if(filterProblem(f))return false;
 if(f.size&&!(product.sizes||[]).includes(f.size))return false;
 if(f.color&&!product.colors.includes(f.color))return false;
 if(f.newOnly&&!product.isNew)return false;
 if(f.price==='unknown')return product.price===null;
 if(f.price==='known'&&product.price===null)return false;
 if(f.min!==''&&(product.price===null||product.price<Number(f.min)))return false;
 if(f.max!==''&&(product.price===null||product.price>Number(f.max)))return false;
 return true;
}
function syncFilterSummary(){
 const f=filterValues(),parts=[];if(f.size)parts.push('Mărime: '+(f.size==='TU'?'Talie universală (TU)':f.size));if(f.color)parts.push('Culoare: '+f.color);
 if(f.price==='unknown')parts.push('Cere preț');else if(f.min||f.max)parts.push('Preț: '+(f.min||'0')+' – '+(f.max||'oricare')+' lei + TVA');else if(f.price==='known')parts.push('Cu preț afișat');
 if(f.newOnly)parts.push('Doar noutăți');$('#filterCount').textContent=parts.length?'('+parts.length+')':'';$('#activeFilters').hidden=!parts.length;$('#filterSummary').textContent=parts.join(' · ');$('#priceRange').hidden=f.price==='unknown';
 const problem=filterProblem(f);$('#filterError').hidden=!problem;$('#filterError').textContent=problem;
}
function initFilters(){
 const sort=values=>[...new Set(values)].sort((a,b)=>a.localeCompare(b,'ro',{numeric:true}));
 for(const [id,values] of [['#filterSize',sort(catalog.products.flatMap(p=>p.sizes||[]))],['#filterColor',sort(catalog.products.flatMap(p=>p.colors))]])for(const value of values){const option=el('option',value==='TU'?'Talie universală (TU)':value);option.value=value;$(id).append(option);}
}
for(const id of ['#filterSize','#filterColor','#filterPrice','#filterNew'])$(id).addEventListener('change',()=>render());
for(const id of ['#filterMin','#filterMax'])$(id).addEventListener('input',()=>render());
$('#clearFilters').onclick=()=>{$('#filterSize').value='';$('#filterColor').value='';$('#filterPrice').value='all';$('#filterMin').value='';$('#filterMax').value='';$('#filterNew').checked=false;render();$('#filterPanel summary').focus({preventScroll:true});};

photoStage.addEventListener('pointerup',event=>{
 const gesture=viewerSwipe;if(!gesture||gesture.id!==event.pointerId)return;viewerSwipe=null;
 const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
 if(!gesture.pinched&&gesture.scale===1&&viewerScale===1&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)stepViewerPhoto(dx<0?1:-1);
});
photoStage.addEventListener('pointercancel',()=>{viewerSwipe=null;});

function syncThemeControls(){const dark=document.documentElement.dataset.theme==='dark';document.querySelectorAll('.theme-toggle').forEach(button=>{button.setAttribute('aria-pressed',String(dark));button.title=dark?'Activează tema albă':'Activează tema neagră';});}
for(const button of document.querySelectorAll('.theme-toggle'))button.onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('ajparis-theme',theme);}catch{}syncThemeControls();};
syncThemeControls();
