const $=id=>document.getElementById(id);
const sections=[
 ['01 · La pieza',[
 ['shape','Forma','round',[['round','Redonda / cilíndrica'],['rect','Rectangular / irregular']]],
 ['h','Alto (cm)',10],['w','Diámetro / ancho (cm)',10],['d','Profundidad, si es rectangular (cm)',10]
 ],'Usá las medidas máximas, incluyendo asas. Para una pieza redonda se usa el diámetro; la profundidad no interviene.'],
 ['02 · Arcilla',[
 ['clayPrice','Precio del paquete ($)',14000],['clayKg','Peso del paquete (kg)',10],['clayGrams','Arcilla utilizada en esta pieza (g)','']
 ],'Precio inicial: $1,40/g. Pesá la arcilla antes de secar, en el mismo estado en que la comprás.'],
 ['03 · Esmalte en polvo',[
 ['glazePrice','Precio del paquete ($)',143000],['glazeKg','Peso del paquete (kg)',25],
 ['glazeMode','Medir consumo en','percent',[['percent','% del paquete de polvo'],['grams','Gramos de polvo']]],
 ['glazeAmount','Consumo de esmalte',1]
 ],'1% del paquete inicial = 250 g = $1.430. Es un supuesto editable, no una recomendación de consumo. No incluye pintura.'],
 ['04 · Horneadas',[
 ['firings','Cantidad de cocciones',2],
 ['firingMode','Tipo de carga','shared',[['shared','Compartida: proporcional al espacio'],['dedicated','Exclusiva: costo completo']]],
 ['kwh','Consumo por horneada (kWh)',42.2],['rate','Costo promedio ($/kWh)',175000/844],
 ['wear','Desgaste y otros gastos por horneada ($)',0],
 ['kw','Diámetro interior del horno (cm)',40],['kh','Alto útil del horno (cm)',35],
 ['gap','Separación extra en cada medida (cm)',2],['usable','Volumen aprovechable (%)',70],['load','Carga habitual (%)',80]
 ],'Referencia: $175.000 y 844 kWh para unas 20 horneadas = $8.750 de electricidad cada una. Se asumen dos cocciones con ese promedio; ajustá la cantidad. Los porcentajes de espacio son supuestos.'],
 ['05 · Mano de obra',[
 ['workMode','Método','percent',[['percent','% de materiales y horneadas'],['minutes','Minutos activos de trabajo']]],
 ['workAmount','Porcentaje de mano de obra (%)',''],['hourRate','Valor de tu hora ($)',8000]
 ],'Pendiente de definir. El porcentaje se aplica a arcilla + esmalte + horneadas, sin embalaje ni ganancia. Los $8.000/h sirven para mostrar a cuántos minutos equivale ese pago. No se cuenta la espera de secado.'],
 ['06 · Embalaje',[
 ['packaging','Embalaje por pieza ($)',1000]
 ],'Actualizá el costo de tu packaging por unidad.']
];
const ids=['margin'];
const options={clayPrice:.01,clayKg:.001,clayGrams:.01,glazePrice:.01,glazeKg:.001,h:.1,w:.1,d:.1,kw:.1,kh:.1,usable:1,load:1,kwh:.01,rate:.01,firings:1};
for(const [title,fields,hint] of sections){
 const section=document.createElement('section'),h=document.createElement('h2');h.textContent=title;section.append(h);
 const group=document.createElement('div');group.className='fields';
 for(const [id,label,value,choices] of fields){
  ids.push(id);const wrap=document.createElement('label'),text=document.createElement('span');text.textContent=label;text.id=id+'Label';wrap.append(text);
  const input=document.createElement(choices?'select':'input');input.id=id;
  if(choices){for(const [val,name] of choices){const option=document.createElement('option');option.value=val;option.textContent=name;input.append(option)}}
  else{input.type='number';input.min=options[id]??0;input.step=id==='firings'?'1':'any';if(['usable','load'].includes(id))input.max='100';if(value==='')input.placeholder='Pendiente';}
  input.value=value;wrap.append(input);group.append(wrap);
 }
 section.append(group);const p=document.createElement('p');p.className='hint';p.textContent=hint;section.append(p);$('inputs').append(section);
}
const storageKey='horno-piece-cost-v1';
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');ids.forEach(id=>{if(typeof saved[id]==='string')$(id).value=saved[id]});$('saved').textContent='Los valores se guardan en este navegador.'}catch{$('saved').textContent='No se pudieron recuperar los valores guardados.'}
const money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
function render(){
 const v=Object.fromEntries(ids.map(id=>[id,$(id).tagName==='SELECT'?$(id).value:($(id).value===''?NaN:Number($(id).value))]));v.kiln='round';
 $('d').disabled=v.shape==='round';
 $('glazeAmountLabel').textContent=v.glazeMode==='percent'?'Consumo (% del paquete de polvo)':'Consumo de polvo (g)';
 $('workAmountLabel').textContent=v.workMode==='percent'?'Porcentaje de mano de obra (%)':'Tiempo activo (minutos)';
 $('glazeAmount').max=v.glazeMode==='percent'?'100':'';
 const r=costPiece(v,calculate);
 $('price').textContent=r.error||r.pending?'—':money(r.price);
 $('message').textContent=r.error||(r.pending?'Falta definir la mano de obra. El subtotal no es un precio de venta.':'Precio estimado por pieza, redondeado hacia arriba al peso.');
 $('breakdown').replaceChildren();
 if(!r.error){
  const rows=[['Arcilla',r.clay],['Esmalte ('+new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(r.glazeGrams)+' g de polvo)',r.glaze],['Horneadas',r.firing],['Embalaje',r.packaging],['Mano de obra',r.labor],[r.pending?'Subtotal sin mano de obra':'Costo total',r.pending?r.subtotal:r.total]];
  if(!r.pending)rows.push(['Ganancia incluida',r.profit]);
  for(const [label,value] of rows){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value===null?'Pendiente':money(value);div.append(dt,dd);$('breakdown').append(div)}
 }
 $('equivalent').textContent=!r.error&&r.minutes!==null&&r.minutes!==undefined?'Mano de obra equivalente a '+r.minutes.toFixed(1)+' minutos a '+money(v.hourRate)+'/hora.':'';
 return r;
}
ids.forEach(id=>$(id).addEventListener('input',()=>{
 if(id==='glazeMode')$('glazeAmount').value='';
 if(id==='workMode')$('workAmount').value='';
 render();
 try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(ids.map(k=>[k,$(k).value]))));$('saved').textContent='Valores guardados en este navegador.'}catch{$('saved').textContent='No se pudieron guardar los valores. Podés seguir calculando.'}
}));
render();

