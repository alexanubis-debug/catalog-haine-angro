const $=s=>document.querySelector(s);let catalog;let selectedCategory="";
function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
function photo(p,src=p.image){const img=el('img',null,'photo');img.alt=p.name+' · '+p.code+((p.aiImages||[]).includes(src)?' · Vizualizare AI':'');img.loading='lazy';img.src=src;img.onerror=()=>{const box=el('div',null,'photo missing');box.append(el('strong',p.code),el('small','Fotografie în curs de adăugare'));img.replaceWith(box)};return img}
function info(p,parent){parent.append(el('p',(p.internalCode?'Cod intern: ':'')+p.code,'code'),el('h2',p.name),el('p',p.colors.join(' · '),'colors'),el('p',p.price===null?'Cere preț':p.price+' lei + TVA','price'))}
function detail(p){
 const c=$('#detailContent'),description=el('div',null,'detail-info'),gallery=el('div',null,'gallery'),mainPhoto=photo(p);gallery.append(mainPhoto);const caption=el('p',null,'image-caption');function updateCaption(src){caption.textContent=(p.aiImages||[]).includes(src)?'Imagine de studio creată cu AI':'Fotografie originală';}const images=p.images||[p.image];if(images.length>1){const thumbs=el('div',null,'thumbnails');images.forEach((src,i)=>{const thumb=el('button');thumb.type='button';thumb.setAttribute('aria-label','Fotografia '+(i+1)+' pentru '+p.code);thumb.setAttribute('aria-pressed',String(i===0));thumb.append(photo(p,src));thumb.onclick=()=>{const next=photo(p,src);gallery.firstElementChild.replaceWith(next);updateCaption(src);thumbs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===thumb)));};thumbs.append(thumb);});gallery.append(thumbs);}c.replaceChildren(gallery,description);info(p,description);description.append(el('p','Vânzare exclusiv angro.','wholesale'));
 if(catalog.whatsapp){const link=el('a','Întreabă pe WhatsApp','contact');link.href='https://wa.me/'+catalog.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Bună! Mă interesează modelul '+p.code+'. Îmi confirmați disponibilitatea și condițiile pentru angro?');link.target='_blank';link.rel='noopener';description.append(link)}
 description.querySelector('h2').id='productTitle';$('#detail').showModal();$('#detail').scrollTop=0;document.body.style.overflow='hidden';
}
function renderCategories(){
 const categories=['','Compleuri','Bluze și tricouri','Pulovere și cardigane','Pantaloni și jeans','Rochii','Fuste','Veste și jachete'];
 $('#categories').replaceChildren(...categories.map(category=>{
  const button=el('button',category||'Toate','category-button');button.type='button';button.setAttribute('aria-pressed',String(category===selectedCategory));
  button.onclick=()=>{selectedCategory=category;$('#categories').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();};return button;
 }));
}
function render(){
 if(!catalog)return;
 const query=$('#search').value.trim().toLocaleLowerCase('ro');
 const products=catalog.products.filter(p=>(!selectedCategory||p.category===selectedCategory)&&(p.code+' '+p.name+' '+p.colors.join(' ')).toLocaleLowerCase('ro').includes(query));
 if($('#sort').value==='code')products.sort((a,b)=>a.code.localeCompare(b.code,'ro',{numeric:true}));
 $('#products').replaceChildren(...products.map(p=>{
  const card=el('button',null,'product');card.type='button';card.setAttribute('aria-label','Deschide '+p.name+' '+p.code);
  const body=el('span',null,'card-info'),bottom=el('span',null,'card-bottom'),arrow=el('span',null,'arrow');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  bottom.append(el('span',p.price===null?'Cere preț':p.price+' lei + TVA','price'),arrow);
  body.append(el('span',(p.internalCode?'Cod intern: ':'')+p.code,'code'),el('span',p.name,'name'),el('span',p.colors.length+' culori','color-count'),bottom);
  card.append(photo(p),body);card.onclick=()=>detail(p);return card;
 }));
 $('#count').replaceChildren(el('strong',String(products.length)),document.createTextNode(' modele'));$('#empty').hidden=products.length!==0;
}
fetch('catalog.json?v=15').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{catalog=data;document.title=data.name+' · Catalog';renderCategories();render()}).catch(()=>{$('#products').textContent='Catalogul nu s-a putut încărca. Reîncarcă pagina.'});
$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);
const dialog=$('#detail');
$('#close').onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';});
