(function(root){
function costPiece(v, kilnCalculator){
 const positive=['clayPrice','clayKg','clayGrams','glazePrice','glazeKg'];
 const nonnegative=['packaging','glazeAmount'];
 if(positive.some(k=>!Number.isFinite(v[k])||v[k]<=0)||nonnegative.some(k=>!Number.isFinite(v[k])||v[k]<0))
  return {error:'Completá precios, cantidades de los paquetes y peso de arcilla. El consumo de esmalte y el embalaje pueden ser cero.'};
 if(!['percent','grams'].includes(v.glazeMode)||!['percent','minutes'].includes(v.workMode)||!['shared','dedicated'].includes(v.firingMode))
  return {error:'Seleccioná un modo de cálculo válido.'};
 if(!Number.isFinite(v.margin)||v.margin<0||v.margin>=100)return {error:'La ganancia debe ser igual o mayor que 0% y menor que 100%.'};
 if(!Number.isInteger(v.firings)||v.firings<1)return {error:'Ingresá una cantidad entera de horneadas, al menos una.'};
 if(v.glazeMode==='percent'&&v.glazeAmount>100)return {error:'El porcentaje del paquete de esmalte no puede superar 100%.'};
 const k=kilnCalculator({...v,labor:0,markup:0,minimum:0});
 if(k.error)return {error:k.error};
 const clay=v.clayPrice*v.clayGrams/(v.clayKg*1000);
 const glazeGrams=v.glazeMode==='percent'?v.glazeKg*1000*v.glazeAmount/100:v.glazeAmount;
 const glaze=v.glazePrice*glazeGrams/(v.glazeKg*1000);
 const firing=(v.firingMode==='dedicated'?v.kwh*v.rate+v.wear:k.base)*v.firings;
 const subtotal=clay+glaze+firing+v.packaging;
 const workBase=clay+glaze+firing;
 const pending=!Number.isFinite(v.workAmount)||v.workAmount<0||(v.workMode==='minutes'&&(!Number.isFinite(v.hourRate)||v.hourRate<=0));
 const labor=pending?null:(v.workMode==='percent'?workBase*v.workAmount/100:v.workAmount*v.hourRate/60);
 const total=pending?null:subtotal+labor;
 const price=pending?null:Math.ceil(total/(1-v.margin/100));
 const profit=pending?null:price-total;
 if(![clay,glaze,glazeGrams,firing,subtotal,...(pending?[]:[labor,total,price,profit])].every(Number.isFinite))return {error:'Los valores son demasiado grandes. Revisá los importes.'};
 return {clay,glaze,glazeGrams,firing,packaging:v.packaging,subtotal,labor,total,price,profit,pending,minutes:!pending&&Number.isFinite(v.hourRate)&&v.hourRate>0?labor/v.hourRate*60:null};
}
if(typeof module!=='undefined')module.exports={costPiece};else root.costPiece=costPiece;
})(globalThis);
