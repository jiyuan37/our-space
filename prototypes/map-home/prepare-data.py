import json,pathlib,sys
src=json.loads(pathlib.Path(sys.argv[1]).read_text()); water=json.loads(pathlib.Path(sys.argv[2]).read_text())
output=pathlib.Path(sys.argv[3])
features=[]
for e in src['elements']:
 t=e.get('tags',{});g=e.get('geometry',[])
 if not g or t.get('indoor')=='yes' or t.get('tunnel')=='yes' or t.get('access')=='private':continue
 kind='water' if t.get('natural')=='water' else 'park' if t.get('leisure')=='park' else 'building' if 'building' in t else 'road'
 if kind=='road' and t.get('highway') not in ['primary','secondary','tertiary','residential','unclassified','pedestrian','footway','path','living_street']:continue
 features.append({'id':f"way/{e['id']}",'kind':kind,'name':t.get('name',''),'class':t.get('highway',''),'coordinates':[[p['lon'],p['lat']] for p in g]})
for r in water['elements']:
 for role in ['outer','inner']:
  lines=[[[p['lon'],p['lat']] for p in m['geometry']] for m in r['members'] if m['role']==role and m.get('geometry')]
  while lines:
   chain=lines.pop(0)
   while chain[0]!=chain[-1]:
    for i,line in enumerate(lines):
     if chain[-1]==line[0]:chain+=line[1:];lines.pop(i);break
     if chain[-1]==line[-1]:chain+=line[-2::-1];lines.pop(i);break
     if chain[0]==line[-1]:chain=line[:-1]+chain;lines.pop(i);break
     if chain[0]==line[0]:chain=line[:0:-1]+chain;lines.pop(i);break
    else:raise Exception('水域边界不完整，不得假闭合')
   features.append({'id':f"relation/{r['id']}",'kind':'water' if role=='outer' else 'island','name':'River Thames','coordinates':chain})
out={'source':'OpenStreetMap contributors','license':'ODbL-1.0','timestamp':src['osm3s']['timestamp_osm_base'],'bbox':[-.127,51.498,-.109,51.510],'features':features}
output.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print('地理要素',len(features),'字节',output.stat().st_size)
