const $=s=>document.querySelector(s);let catalog;let selectedCategory="";const PAGE_SIZE=12;let visibleCount=PAGE_SIZE;
function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
function photo(p,src=p.image,mode='detail'){
 const img=el('img',null,'photo'),media=p.media?.[src];
 img.alt=p.name+' · '+p.code+((p.aiImages||[]).includes(src)?' · Vizualizare AI':'');img.decoding='async';img.loading=mode==='detail'?'eager':'lazy';
 if(media){
  img.width=media.width;img.height=media.height;
  if(mode==='thumb'){img.src=media.small;}
  else if(mode==='card'){img.src=media.card;img.srcset=media.small+' 360w, '+media.card+' 640w';img.sizes='(max-width:700px) calc((100vw - 34px)/2), (max-width:1240px) calc((100vw - 96px)/3), 380px';}
  else{img.src=media.detail;img.srcset=media.card+' 640w, '+media.detail+' 1200w';img.sizes='(max-width:700px) 90vw, 540px';}
 }else{img.src=src;}
 img.onerror=()=>{img.onerror=null;if(media&&img.getAttribute('src')!==src){img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=src;return;}const box=el('div',null,'photo missing');box.append(el('strong',p.code),el('small','Fotografie indisponibilă'));img.replaceWith(box);};return img;
}
function info(p,parent){parent.append(el('p',(p.internalCode?'Cod intern: ':'')+p.code,'code'),el('h2',p.name),el('p',p.colors.join(' · '),'colors'),el('p',p.price===null?'Cere preț':p.price+' lei + TVA','price'))}
function detail(p){
 const c=$('#detailContent'),description=el('div',null,'detail-info'),gallery=el('div',null,'gallery'),mainPhoto=photo(p);gallery.append(mainPhoto);const caption=el('p',null,'image-caption');function updateCaption(src){caption.textContent=(p.aiImages||[]).includes(src)?'Imagine de studio creată cu AI':'Fotografie originală';}const images=p.images||[p.image];if(images.length>1){const thumbs=el('div',null,'thumbnails');images.forEach((src,i)=>{const thumb=el('button');thumb.type='button';thumb.setAttribute('aria-label','Fotografia '+(i+1)+' pentru '+p.code);thumb.setAttribute('aria-pressed',String(i===0));thumb.append(photo(p,src,'thumb'));thumb.onclick=()=>{const next=photo(p,src);gallery.firstElementChild.replaceWith(next);updateCaption(src);thumbs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===thumb)));};thumbs.append(thumb);});gallery.append(thumbs);}c.replaceChildren(gallery,description);info(p,description);description.append(el('p','Vânzare exclusiv angro.','wholesale'));
 if(catalog.whatsapp){const link=el('a','Întreabă pe WhatsApp','contact');link.href='https://wa.me/'+catalog.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Bună! Mă interesează modelul '+p.code+'. Îmi confirmați disponibilitatea și condițiile pentru angro?');link.target='_blank';link.rel='noopener';link.setAttribute('aria-haspopup','dialog');link.onclick=event=>{event.preventDefault();openWhatsApp(p);};description.append(link)}
 description.querySelector('h2').id='productTitle';$('#detail').showModal();$('#detail').scrollTop=0;document.body.style.overflow='hidden';
}
function renderCategories(){
 const categories=['','Compleuri','Bluze și tricouri','Pulovere și cardigane','Pantaloni și jeans','Rochii','Fuste','Veste și jachete'];
 const shortNames={'Bluze și tricouri':'Bluze și tricouri','Pulovere și cardigane':'Pulovere','Pantaloni și jeans':'Pantaloni','Veste și jachete':'Veste și jachete'};
 for(const target of ['#categories','#desktopCategories']){
  $(target).replaceChildren(...categories.map(category=>{
   const button=el('button',target==='#desktopCategories'?(shortNames[category]||category||'Toate'):(category||'Toate'),'category-button');button.type='button';button.dataset.category=category;button.setAttribute('aria-label',category||'Toate');button.setAttribute('aria-pressed',String(category===selectedCategory));
   button.onclick=()=>{selectedCategory=category;if($('#menuDialog').open)$('#menuDialog').close();document.querySelectorAll('#categories button,#desktopCategories button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));render();};return button;
  }));
 }
}
function render(append=false){
 if(!catalog)return;
 const query=$('#search').value.trim().toLocaleLowerCase('ro');
 const products=catalog.products.filter(p=>(!selectedCategory||p.category===selectedCategory)&&(p.code+' '+p.name+' '+p.colors.join(' ')).toLocaleLowerCase('ro').includes(query));
 if($('#sort').value==='code')products.sort((a,b)=>a.code.localeCompare(b.code,'ro',{numeric:true}));
 if(!append){visibleCount=PAGE_SIZE;$('#products').replaceChildren();}
 const start=append?$('#products').children.length:0;
 const batch=products.slice(start,visibleCount);
 $('#products').append(...batch.map((p,index)=>{
  const card=el('button',null,'product');card.type='button';card.setAttribute('aria-label','Deschide '+p.name+' '+p.code);
  const body=el('span',null,'card-info'),bottom=el('span',null,'card-bottom'),arrow=el('span',null,'arrow');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  bottom.append(el('span',p.price===null?'Cere preț':p.price+' lei + TVA','price'),arrow);
  body.append(el('span',(p.internalCode?'Cod intern: ':'')+p.code,'code'),el('span',p.name,'name'),el('span',p.colors.length+' culori','color-count'),bottom);
  const image=photo(p,p.image,'card');if(start===0&&index<2){image.loading='eager';image.fetchPriority='high';}card.append(image,body);card.onclick=()=>detail(p);return card;
 }));
 $('#count').replaceChildren(el('strong',String(products.length)),document.createTextNode(' modele'));$('#empty').hidden=products.length!==0;
 const shown=Math.min(visibleCount,products.length),remaining=products.length-shown;$('#loadMore').hidden=remaining===0;$('#loadMore').textContent='Vezi încă '+Math.min(PAGE_SIZE,remaining)+' produse →';$('#pageStatus').textContent=products.length?'Afișate '+shown+' din '+products.length+' produse':'';
 if(append&&remaining===0&&batch.length){$('#products').children[start].focus({preventScroll:true});}
}
fetch('catalog.json?v=30').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{catalog=data;document.title=data.name+' · Catalog';renderCategories();render()}).catch(()=>{$('#products').textContent='Catalogul nu s-a putut încărca. Reîncarcă pagina.'});
$('#search').addEventListener('input',()=>render());$('#sort').addEventListener('change',()=>render());
$('#loadMore').addEventListener('click',()=>{visibleCount+=PAGE_SIZE;render(true);});
const dialog=$('#detail');
$('#close').onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';});

const whatsappDialog=$('#whatsappDialog');
function openWhatsApp(product){
 const message=product?'Bună! Mă interesează modelul '+product.code+'. Îmi confirmați disponibilitatea și condițiile pentru angro?':'Bună! Mă interesează produsele din catalogul AJ Paris Fashion.';
 whatsappDialog.querySelectorAll('.contact-list a').forEach(link=>{link.href='https://wa.me/'+link.dataset.phone+'?text='+encodeURIComponent(message);});
 whatsappDialog.showModal();document.body.style.overflow='hidden';
}
$('.header-contact').onclick=event=>{event.preventDefault();openWhatsApp();};
$('#whatsappClose').onclick=()=>whatsappDialog.close();
whatsappDialog.addEventListener('close',()=>{document.body.style.overflow=dialog.open?'hidden':'';});
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
