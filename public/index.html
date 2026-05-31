<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<title>סינבון דשבורד</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f0f2f5;direction:rtl}
.header{background:#1B2A4A;color:white;padding:16px 24px;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:20px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:20px 24px 0}
.kpi{background:white;border-radius:10px;padding:16px;border:1px solid #e8eef6}
.kpi-label{font-size:12px;color:#888;margin-bottom:6px}
.kpi-val{font-size:26px;font-weight:bold;color:#1B2A4A}
.green{color:#1A5C38}
.main{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px 24px}
.panel{background:white;border-radius:10px;padding:16px;border:1px solid #e8eef6}
.panel h2{font-size:14px;color:#555;margin-bottom:12px}
.item-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f5f5f5;font-size:13px}
.item-name{flex:1}
.item-qty{color:#888;min-width:50px;text-align:center}
.bar-wrap{width:80px;height:6px;background:#f0f2f5;border-radius:3px}
.bar{height:6px;border-radius:3px}
.item-cost{font-weight:bold;min-width:70px;text-align:left;direction:ltr}
.log-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f5f5f5;font-size:12px}
.log-who{color:#888}
.log-what{font-weight:bold}
.log-cost{color:#1A5C38;font-weight:bold;direction:ltr}
.btn{border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:bold;margin-right:8px}
.empty{color:#aaa;font-size:13px;text-align:center;padding:20px}
.footer{font-size:11px;color:#aaa;text-align:center;padding:12px}
</style>
</head>
<body>
<div class="header">
  <h1>🥐 סינבון באר שבע – דשבורד</h1>
  <div>
    <span id="last-update" style="font-size:13px;opacity:0.7;margin-left:12px">טוען...</span>
    <button class="btn" style="background:#8B1A1A;color:white" onclick="resetData()">אפס חודש 🗑</button>
    <button class="btn" style="background:white;color:#1B2A4A" onclick="loadData()">רענן ↺</button>
  </div>
</div>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">סה"כ הוצאות חודש</div><div class="kpi-val" id="kpi-total">—</div></div>
  <div class="kpi"><div class="kpi-label">אירועים שנרשמו</div><div class="kpi-val green" id="kpi-count">—</div></div>
  <div class="kpi"><div class="kpi-label">פריט יקר ביותר</div><div class="kpi-val" style="font-size:16px" id="kpi-top">—</div></div>
  <div class="kpi"><div class="kpi-label">עדכון אחרון</div><div class="kpi-val" style="font-size:16px" id="kpi-last">—</div></div>
</div>
<div class="main">
  <div class="panel">
    <h2>📦 פירוט לפי פריט</h2>
    <div id="item-list"><div class="empty">אין נתונים עדיין</div></div>
  </div>
  <div class="panel">
    <h2>🕐 לוג אחרון</h2>
    <div id="log-list"><div class="empty">אין נתונים עדיין</div></div>
  </div>
</div>
<div class="footer" id="footer">מתעדכן כל 30 שניות</div>
<script>
var COLORS=['#378ADD','#1D9E75','#D85A30','#D4537E','#639922','#BA7517','#534AB7'];
function fmt(n){return '₪'+Math.round(n).toLocaleString('he-IL');}
function loadData(){
  var t=Date.now();
  Promise.all([
    fetch('/api/summary?t='+t).then(function(r){return r.json();}),
    fetch('/api/log?t='+t).then(function(r){return r.json();})
  ]).then(function(results){
    var summary=results[0], log=results[1];
    var now=new Date();
    document.getElementById('last-update').textContent='עודכן: '+
      String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    var total=0;
    Object.values(summary).forEach(function(v){total+=v.cost;});
    document.getElementById('kpi-total').textContent=fmt(total);
    document.getElementById('kpi-count').textContent=log.length;
    var entries=Object.entries(summary).sort(function(a,b){return b[1].cost-a[1].cost;});
    document.getElementById('kpi-top').textContent=entries.length>0?entries[0][0]:'—';
    if(log.length>0){
      var last=log[log.length-1];
      var lt=new Date(last.time);
      document.getElementById('kpi-last').textContent=
        String(lt.getHours()).padStart(2,'0')+':'+String(lt.getMinutes()).padStart(2,'0');
    }
    var maxCost=entries.length>0?entries[0][1].cost:1;
    document.getElementById('item-list').innerHTML=entries.length>0?
      entries.map(function(e,i){
        var pct=Math.round(e[1].cost/maxCost*100);
        return '<div class="item-row"><span class="item-name">'+e[0]+'</span>'+
          '<span class="item-qty">'+e[1].qty+' יח\'</span>'+
          '<div class="bar-wrap"><div class="bar" style="width:'+pct+'%;background:'+COLORS[i%COLORS.length]+'"></div></div>'+
          '<span class="item-cost">'+fmt(e[1].cost)+'</span></div>';
      }).join(''):'<div class="empty">אין נתונים עדיין</div>';
    document.getElementById('log-list').innerHTML=log.length>0?
      log.slice().reverse().slice(0,10).map(function(l){
        var lt=new Date(l.time);
        var ts=String(lt.getHours()).padStart(2,'0')+':'+String(lt.getMinutes()).padStart(2,'0');
        return '<div class="log-row">'+
          '<span class="log-who">'+l.from.replace('whatsapp:+972','05')+' '+ts+'</span>'+
          '<span class="log-what">'+l.label+' × '+l.qty+'</span>'+
          '<span class="log-cost">'+fmt(l.cost)+'</span></div>';
      }).join(''):'<div class="empty">אין נתונים עדיין</div>';
  }).catch(function(){
    document.getElementById('footer').textContent='שגיאה בטעינה';
  });
}
function resetData(){
  if(!confirm('למחוק את כל הנתונים?'))return;
  fetch('/api/reset',{method:'POST'}).then(function(){loadData();});
}
loadData();
setInterval(loadData,30000);
</script>
</body>
</html>
