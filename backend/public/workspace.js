const niches=['Fashion','Food','Travel','Fitness','Tech','Lifestyle','Beauty','Other'];
const packages={story:'Instagram story',reel:'Instagram reel',post:'Feed post',youtube:'YouTube video'};
function paise(value){if(!/^\d+(\.\d{1,2})?$/.test(value))throw new Error('Enter rates with at most two decimal places');const [whole,fraction='']=value.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));}
const $=id=>document.getElementById(id);
const label=value=>value.replaceAll('_',' ');
const money=paise=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(paise)/100);
function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
export function mountWorkspace({api,user}){
 let creator,selected;
 $('edit-creator').hidden=user.role!=='influencer';
 const nicheSelect=$('creator-form').elements.niche;nicheSelect.replaceChildren();$('filter-niche').replaceChildren(el('option','All niches'));$('filter-niche').firstChild.value='';
 for(const niche of niches){for(const select of [nicheSelect,$('filter-niche')]){const option=el('option',niche);option.value=niche;select.append(option);}}
 $('workspace').hidden=false;$('show-discovery').hidden=user.role!=='brand';
 const run=async fn=>{try{$('workspace-status').textContent='Loading…';await fn();$('workspace-status').textContent='';}catch(e){$('workspace-status').textContent=e.message;}};
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=()=>{b.disabled=true;run(fn).finally(()=>b.disabled=false);};return b;};
 async function list(){
  const rows=await api('/collaborations');$('collaboration-list').replaceChildren();
  if(!rows.length)$('collaboration-list').append(el('p','No collaborations yet. Your proposals will appear here.'));
  for(const row of rows){const card=el('article',undefined,'card');card.append(el('h3',row.title),el('span',label(row.status),'badge'),el('p',money(row.amount_paise)),button('Open workspace',()=>detail(row.id)));$('collaboration-list').append(card);}
 }
 async function discover(){
  $('discovery').hidden=false;
  const query=new URLSearchParams({search:$('search').value,niche:$('filter-niche').value});if($('filter-budget').value)query.set('max_budget_paise',paise($('filter-budget').value));
  const rows=await api('/creators?'+query);$('creators').replaceChildren();
  if(!rows.length)$('creators').append(el('p','No creators found. Creators appear here after creating their profiles.'));
  for(const row of rows){
   const card=el('article',undefined,'card');card.append(el('h3',row.display_name),el('span',row.niche || 'Creator','badge'));
   if(row.location)card.append(el('p',row.location));if(row.bio)card.append(el('p',row.bio,'detail-copy'));
   const propose=async(key)=>{creator=row.id;$('booking').reset();$('booking-title').textContent='Collaborate with '+row.display_name;if(key){$('booking').elements.amount.value=Number(row[key+'_paise'])/100;$('booking').elements.deliverables.value='One '+packages[key];}$('booking-panel').hidden=false;$('booking-panel').scrollIntoView({behavior:'smooth'});};
   for(const [key,name] of Object.entries(packages))if(row[key+'_paise'])card.append(button(name+' · '+money(row[key+'_paise']),()=>propose(key)));
   card.append(button('Custom proposal',()=>propose()));$('creators').append(card);
  }
 }
 async function detail(id){
  selected=id;const row=await api('/collaborations/'+id);const box=$('collaboration-detail');box.hidden=false;box.replaceChildren();
  box.append(el('h2',row.title),el('span',label(row.status),'badge'),el('p',money(row.amount_paise)+' · Due '+row.deadline.slice(0,10)),el('h3','Agreement'),el('p',row.brief,'detail-copy'),el('h3','Usage rights'),el('p',row.usage_rights,'detail-copy'),el('p',`${row.revisions_used} of ${row.revision_limit} revision rounds used`));
  if(row.status==='awaiting_payment')box.append(el('p','Proposal accepted. Work starts once payment is confirmed. Payment collection is being connected.'));
  box.append(el('h3','Deliverables'));
  for(const d of row.deliverables){
   const card=el('div',undefined,'card');card.append(el('p',d.description));
   if(d.submission_url){const a=el('a','View submission');a.href=d.submission_url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
   if(user.role==='influencer' && ['active','revision'].includes(row.status)){
    const form=el('form');const input=el('input');input.type='url';input.required=true;input.placeholder='https://…';input.setAttribute('aria-label','Submission link for '+d.description);input.value=d.submission_url || '';const save=el('button','Save submission');form.append(input,save);
    form.onsubmit=e=>{e.preventDefault();save.disabled=true;run(async()=>{await api(`/collaborations/${id}/deliverables/${d.id}`,'PUT',{url:input.value});await detail(id);}).finally(()=>save.disabled=false);};card.append(form);
   }
   if(d.approved_at)card.append(el('p','Approved'));
   box.append(card);
  }
  const actions=el('div',undefined,'buttons');
  const available=user.role==='brand'?{proposed:['cancel'],review:['request_revision','approve']}:{proposed:['accept','decline'],active:['submit'],revision:['resubmit']};
  const options=[...(available[row.status] || [])];if(['active','review','revision'].includes(row.status))options.push('dispute');
  for(const action of options){if(action==='request_revision'&&row.revisions_used>=row.revision_limit)continue;actions.append(button(label(action),async()=>{await api('/collaborations/'+id+'/actions','POST',{action});await list();await detail(id);}));}
  box.append(actions,el('h3','Activity'));const timeline=el('ol',undefined,'timeline');
  for(const event of row.events){const item=el('li',label(event.action)+' · ');item.append(el('time',new Date(event.created_at).toLocaleString()));timeline.append(item);}box.append(timeline);
  if(row.submissions.length){box.append(el('h3','Submission history'));for(const s of row.submissions){const p=el('p');const a=el('a',new Date(s.created_at).toLocaleString());a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);box.append(p);}}
 }
 $('booking').onsubmit=e=>{e.preventDefault();const submit=e.submitter;submit.disabled=true;run(async()=>{
  const f=new FormData(e.target);const amount=String(f.get('amount'));if(!/^\d+(\.\d{1,2})?$/.test(amount))throw new Error('Enter a fee with at most two decimal places');
  const [rupees,paise='']=amount.split('.');const row=await api('/collaborations','POST',{creator_id:creator,title:f.get('title'),brief:f.get('brief'),amount_paise:Number(rupees)*100+Number(paise.padEnd(2,'0')),deadline:f.get('deadline'),usage_rights:f.get('usage_rights'),revision_limit:Number(f.get('revision_limit')),deliverables:String(f.get('deliverables')).split('\n').map(s=>s.trim()).filter(Boolean)});
  e.target.reset();$('booking-panel').hidden=true;await list();await detail(row.id);$('collaboration-detail').scrollIntoView({behavior:'smooth'});
 }).finally(()=>submit.disabled=false);};
 $('edit-creator').onclick=()=>run(async()=>{
  const data=await api('/creator-profile');const form=$('creator-form');form.reset();$('creator-saved').textContent='';
  if(data){for(const key of ['niche','bio','location'])form.elements[key].value=data[key];form.elements.available.value=String(data.available);for(const key of Object.keys(packages))form.elements[key].value=data[key+'_paise']?Number(data[key+'_paise'])/100:'';}
  $('creator-editor').hidden=false;$('creator-editor').scrollIntoView({behavior:'smooth'});
 });
 $('creator-form').onsubmit=e=>{e.preventDefault();const save=e.submitter;save.disabled=true;run(async()=>{const f=new FormData(e.target);const rates={};for(const key of Object.keys(packages))rates[key]=f.get(key)?paise(String(f.get(key))):null;await api('/creator-profile','PUT',{niche:f.get('niche'),bio:f.get('bio'),location:f.get('location'),available:f.get('available')==='true',rates});$('creator-saved').textContent='Profile saved. Brands can discover your available packages.';}).finally(()=>save.disabled=false);};
 $('filter-niche').onchange=()=>run(discover);$('filter-budget').onchange=()=>run(discover);
 $('close-booking').onclick=()=>$('booking-panel').hidden=true;
 $('show-discovery').onclick=()=>run(discover);
 $('search-form').onsubmit=e=>{e.preventDefault();run(discover);};
 $('show-collaborations').onclick=()=>{$('discovery').hidden=true;run(list);};
 $('refresh').onclick=()=>run(async()=>{await list();if(selected)await detail(selected);});
 $('booking').elements.deadline.min=new Date().toISOString().slice(0,10);
 run(list);
 return ()=>{$('creator-editor').hidden=true;$('creator-form').reset();$('workspace').hidden=true;$('collaboration-detail').hidden=true;$('booking-panel').hidden=true;$('discovery').hidden=true;$('collaboration-list').replaceChildren();$('creators').replaceChildren();$('collaboration-detail').replaceChildren();};
}
