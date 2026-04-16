import os
import re
import json
import geopandas as gpd
import pyogrio
import pandas as pd

jtm_kmz = r'd:\Projek Jar\pln-jarkom\KALABAHI.kmz'
ulp_kmz = r'd:\Projek Jar\pln-jarkom\ULP KALABAHI.kmz'
out_dir = r'd:\Projek Jar\pln-jarkom\public\data'
os.makedirs(out_dir, exist_ok=True)

# Helper function to extract dict from KML description HTML
def parse_description(html_str):
    if not isinstance(html_str, str): return {}
    props = {}
    # find all <tr><td>KEY</td><td>VALUE</td></tr>
    # The html uses <tr><td>KEY</td><td>VALUE</td></tr>
    matches = re.findall(r'<td>(.*?)</td>\s*<td>(.*?)</td>', html_str, re.IGNORECASE | re.DOTALL)
    for k, v in matches:
        k = k.strip()
        v = v.strip()
        if v == '&lt;Null&gt;': v = None
        if k and k != '':
            props[k] = v
    return props

def extract_layer(kmz, layer_name, out_name):
    try:
        print(f"Extracting {layer_name} -> {out_name}.geojson")
        df = pyogrio.read_dataframe(kmz, layer=layer_name)
        if df.empty: return 0
        
        # apply parse_description to each row
        if 'description' in df.columns:
            parsed_df = df['description'].apply(parse_description)
            # convert to dataframe and concat
            parsed_df = pd.json_normalize(parsed_df)
            for c in parsed_df.columns:
                df[c] = parsed_df[c]
            
        # We don't drop columns, just write the rich gdf
        # But we must drop 'description' to save space since it's huge HTML
        if 'description' in df.columns:
            df = df.drop(columns=['description'])
            
        df.to_file(os.path.join(out_dir, f'{out_name}.geojson'), driver='GeoJSON')
        return len(df)
    except Exception as e:
        print(f"Error {layer_name}: {e}")
        return 0

# Extract ALL!
try:
    c_gardu = extract_layer(ulp_kmz, 'TRAF003 selection', 'gardu-arcgis')
    c_jtr = extract_layer(ulp_kmz, 'JARINGAN_TR03 selection', 'jtr-lines')
    c_sr = extract_layer(ulp_kmz, 'SAMBUNGAN_RUMAH03 selection', 'sr-lines')
    c_plat = extract_layer(ulp_kmz, 'PELANGGAN03 selection 2', 'pelanggan')
    c_tiang = extract_layer(ulp_kmz, 'TIANG03 selection 2', 'tiang-arcgis')
    
    # JTM is a bit different since it's split into multiple layers inside JTM KMZ
    print("Extracting JTM Lines...")
    layers = pyogrio.list_layers(jtm_kmz)
    jtm_gdfs = []
    for l_name, _ in layers:
        if l_name == 'KALABAHI': continue
        try:
            df = pyogrio.read_dataframe(jtm_kmz, layer=l_name)
            if not df.empty:
                if 'description' in df.columns:
                    parsed_df = df['description'].apply(parse_description)
                    parsed_df = pd.json_normalize(parsed_df)
                    for c in parsed_df.columns:
                        df[c] = parsed_df[c]
                    df = df.drop(columns=['description'])
                df['Penyulang_KMZ'] = l_name
                jtm_gdfs.append(df)
        except Exception as e:
            pass
            
    c_jtm = 0
    if jtm_gdfs:
        jtm_merged = gpd.GeoDataFrame(pd.concat(jtm_gdfs, ignore_index=True))
        jtm_merged.to_file(os.path.join(out_dir, 'jtm-lines.geojson'), driver='GeoJSON')
        c_jtm = len(jtm_merged)

    # Update metadata
    meta = {
        'gardu': c_gardu,
        'jtr': c_jtr,
        'sr': c_sr,
        'pelanggan': c_plat,
        'tiang_arcgis': c_tiang,
        'jtm': c_jtm
    }
    with open(os.path.join(out_dir, 'metadata.json'), 'w') as f:
        json.dump(meta, f)
        
    print("Done generating rich JSON!")
except Exception as e:
    print(f"Top level error: {e}")
