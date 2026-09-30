/* Live OpenStreetMap view: wells from the coordinate workbook and optional device GPS. */
(function(){
  let liveMapInstance,wellMarkers={},userMarker,userAccuracy,userWatchId=null;
  const coords=()=>window.WELL_COORDINATES||{};
  const stopLocation=()=>{if(userWatchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(userWatchId);userWatchId=null}};
  const oldGo=go;
  go=function(next){if(next!=='map')stopLocation();return oldGo(next)};
  const userIcon=()=>L.divIcon({className:'',html:'<div class="user-location-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]});
  function initLiveMap(){
    const host=document.querySelector('#liveMap');if(!host||!window.L)return;
    liveMapInstance=L.map(host,{zoomControl:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(liveMapInstance);
    const entries=Object.entries(coords());
    entries.forEach(([well,point])=>{const marker=L.circleMarker([point.lat,point.lng],{radius:7,color:'#075985',weight:2,fillColor:'#22c55e',fillOpacity:.95}).addTo(liveMapInstance);marker.bindPopup(`<b>№${esc(well)}</b><br><button onclick="openWell('${esc(well)}')">Паспортты ашу</button>`);wellMarkers[well]=marker});
    if(entries.length)liveMapInstance.fitBounds(L.latLngBounds(entries.map(([,p])=>[p.lat,p.lng])).pad(.12));
    window.searchLiveMap(mapSearch||'');
  }
  map=function(){
    const count=Object.keys(coords()).length;
    shell(`<h1>GPS карта</h1><p class="muted">ТҚ-93 · ${count} скважина координатасы. Телефонның GPS-і тек сіз рұқсат бергенде көрсетіледі.</p><section class="card"><div class="map-tools"><input id="liveMapSearch" value="${esc(mapSearch)}" oninput="searchLiveMap(this.value)" placeholder="Скважина № іздеу, мысалы 6604" /><button class="secondary map-gps" onclick="startLiveLocation()">◎ Менің орным</button></div><div id="liveMapStatus" class="map-status">Скважина нөмірін жазыңыз немесе GPS батырмасын басыңыз.</div></section><div id="liveMap" class="live-map"></div><button class="secondary wide" style="margin-top:12px" onclick="openRouteMapImage()">Маршруттық карта-схеманы ашу</button><p class="section-note" style="margin:16px 4px 34px;line-height:1.5">Нүктені бассаңыз, скважина паспорты ашылады. GPS дерегі серверге жазылмайды.</p>`);
    setTimeout(initLiveMap,0);
  };
  window.searchLiveMap=function(value){
    mapSearch=String(value||'');const query=mapSearch.trim().toLowerCase();const matches=Object.entries(wellMarkers).filter(([well])=>well.toLowerCase().includes(query));
    Object.entries(wellMarkers).forEach(([well,marker])=>{const matched=!query||well.toLowerCase().includes(query);marker.setStyle({opacity:matched?1:.18,fillOpacity:matched?.95:.08})});
    const status=document.querySelector('#liveMapStatus');if(status)status.textContent=query?(matches.length?`${matches.length} скважина табылды. Нүкте картада ерекшеленді.`:'Координаталардан бұл нөмір табылмады.'):'Скважина нөмірін жазыңыз немесе GPS батырмасын басыңыз.';
    if(query&&matches.length&&liveMapInstance){const [well,marker]=matches[0];liveMapInstance.setView(marker.getLatLng(),16);marker.openPopup()}
  };
  window.startLiveLocation=function(){
    if(!navigator.geolocation){alert('Бұл құрылғы GPS-ті қолдамайды.');return}
    const status=document.querySelector('#liveMapStatus');if(status)status.textContent='GPS рұқсатын растаңыз…';stopLocation();
    userWatchId=navigator.geolocation.watchPosition(position=>{const latlng=[position.coords.latitude,position.coords.longitude];if(!liveMapInstance)return;if(!userMarker){userMarker=L.marker(latlng,{icon:userIcon()}).addTo(liveMapInstance).bindPopup('Сіздің орныңыз');userAccuracy=L.circle(latlng,{radius:position.coords.accuracy,color:'#237cff',fillColor:'#237cff',fillOpacity:.1,weight:1}).addTo(liveMapInstance);liveMapInstance.setView(latlng,16)}else{userMarker.setLatLng(latlng);userAccuracy.setLatLng(latlng).setRadius(position.coords.accuracy)}if(status)status.textContent=`GPS қосылды · дәлдігі шамамен ${Math.round(position.coords.accuracy)} м`;},{enableHighAccuracy:true,maximumAge:10000,timeout:15000},error=>{if(status)status.textContent=error.code===1?'GPS рұқсаты берілмеді.':'GPS орнын анықтау мүмкін болмады.'});
  };
  window.openRouteMapImage=function(){stopLocation();shell(`<button class="secondary" onclick="go('map')">← GPS карта</button><h1>Маршруттық карта-схема</h1><div class="map-viewport"><div class="route-map-canvas" style="width:920px"><img src="assets/maps/route-map-1.png" alt="ТҚ-93 маршруттық картасы"/></div></div><p class="section-note" style="margin:16px 4px 34px;line-height:1.5">Сызбаны саусақпен жылжытып толық қарап шығыңыз.</p>`)};
})();
