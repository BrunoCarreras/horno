(function(root){function calculate(v){
let positive=['h','w','kw','kh','usable','load'];if(v.shape==='rect')positive.push('d');if(v.kiln==='rect')positive.push('kd');
if(positive.some(k=>!Number.isFinite(v[k])||v[k]<=0)||!Number.isFinite(v.gap)||v.gap<0||v.usable>100||v.load>100)return {error:'Revisá las medidas y porcentajes. Los porcentajes deben estar entre 1 y 100.'};
const w=v.w+v.gap,d=(v.shape==='round'?v.w:v.d)+v.gap,h=v.h+v.gap;
const fits=v.kiln==='round'?(v.shape==='round'?w<=v.kw:Math.hypot(w,d)<=v.kw):((w<=v.kw&&d<=v.kd)||(d<=v.kw&&w<=v.kd));
if(!fits||h>v.kh)return {error:'La pieza no entra con la separación indicada. Revisá las medidas interiores y la separación.'};
const capacity=(v.kiln==='round'?Math.PI*(v.kw/2)**2:v.kw*v.kd)*v.kh*v.usable/100*v.load/100;
const volume=w*d*h,share=Math.min(1,volume/capacity),geometry={volume,share};
if(['kwh','rate'].some(k=>!Number.isFinite(v[k])||v[k]<=0))return {...geometry,error:'Ingresá el consumo de una cocción y el precio del kWh para cotizar.'};
if(['labor','wear','markup','minimum'].some(k=>!Number.isFinite(v[k])||v[k]<0))return {...geometry,error:'Completá los costos y el recargo con valores iguales o mayores que cero.'};
const energy=v.kwh*v.rate*share,other=(v.labor+v.wear)*share,base=energy+other,profit=base*v.markup/100,price=Math.ceil(Math.max(v.minimum,base+profit));
if(![volume,share,energy,other,base,profit,price].every(Number.isFinite))return {error:'Los valores son demasiado grandes. Revisá los datos.'};
return {...geometry,energy,other,base,profit,price,minimumApplied:v.minimum>base+profit};}
if(typeof module!=='undefined')module.exports={calculate};else root.calculate=calculate;})(globalThis);
