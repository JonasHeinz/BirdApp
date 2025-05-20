import json


def convert_to_geojson(data):
    features = []

    for sighting in data["data"]["sightings"]:
        for observer in sighting["observers"]:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        float(observer["coord_lon"]),
                        float(observer["coord_lat"]),
                    ],
                },
                "properties": {
                    "species_name": sighting["species"]["name"],
                    "species_latin": sighting["species"]["latin_name"],
                    "rarity": sighting["species"]["rarity"],
                    "observer": observer["name"],
                    "observation_time": observer["timing"]["@ISO8601"],
                    "location": sighting["place"]["name"],
                    "municipality": sighting["place"]["municipality"],
                    "county": sighting["place"]["county"],
                    "altitude": sighting["place"]["altitude"],
                    "count": observer.get("count", "unknown"),
                    "comment": observer.get("comment", ""),
                },
            }
            features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}

    return geojson
