const $=s=>document.querySelector(s);let catalog;
function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
function photo(p){const img=el('img',null,'photo');img.alt=p.name+' · '+p.code;img.loading='lazy';img.src=p.image;img.onerror=()=>{const box=el('div',null,'photo missing');box.append(el('strong',p.code),el('small','Fotografie în curs de adăugare'));img.replaceWith(box)};return img}
function info(p,parent){parent.append(el('p',p.code,'code'),el('h2',p.name),el('p',p.colors.join(' · '),'colors'),el('p',p.price===null?'Preț în curs de completare':p.price+' lei','price'))}
function detail(p){const c=$('#detailContent');c.replaceChildren(photo(p));info(p,c);c.append(el('p','Vânzare exclusiv angro.'));if(catalog.whatsapp){const a=el('a','Întreabă pe WhatsApp','contact');a.href='https://wa.me/'+catalog.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Bună! Mă interesează modelul '+p.code+'. Îmi confirmați prețul și condițiile pentru angro?');a.target='_blank';a.rel='noopener';c.append(a)}c.querySelector('h2').id='productTitle';$('#detail').showModal();$('#detail').scrollTop=0;document.body.style.overflow='hidden'}
function render(){
 $('#products').replaceChildren(...catalog.products.map(p=>{
  const card=el('button',null,'product');card.type='button';card.setAttribute('aria-label','Deschide '+p.name+' '+p.code);
  card.append(photo(p),el('span',p.code,'code'),el('span',p.name,'name'),el('span',p.price===null?'Preț în curs de completare':p.price+' lei','price'));
  card.onclick=()=>detail(p);return card;
 }));
}
fetch('catalog.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{catalog=data;document.title=data.name+' · Catalog angro';$('.brand').textContent=data.name;render()}).catch(()=>{$('#products').textContent='Catalogul nu s-a putut încărca. Reîncarcă pagina.'});
const dialog=$('#detail');
$('#close').onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';});
