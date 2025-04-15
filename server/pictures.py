import requests

def get_wikipedia_page_title(search_term):
    """Sucht nach dem passendsten Wikipedia-Titel für den Suchbegriff."""
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": search_term,
        "utf8": 1
    }
    response = requests.get(url, params=params)
    data = response.json()
    search_results = data.get("query", {}).get("search", [])
    if search_results:
        # Nimm den Titel des erstbesten Suchergebnisses
        return search_results[0]["title"]
    return None

def get_wikipedia_image(title):
    """
    Ruft über den Wikipedia-Titel das Bild ab.
    """
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "prop": "pageimages",
        "piprop": "original",
        "titles": title,
        "utf8": 1
    }
    response = requests.get(url, params=params)
    data = response.json()
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        if "original" in page:
            return page["original"]["source"]
    return None

def get_image_for_species(sci_name):
    # Versuche direkt das Bild zu holen
    image_url = get_wikipedia_image(sci_name)
    if image_url:
        return image_url
    # Fallback: Suche nach passendem Artikeltitel
    title = get_wikipedia_page_title(sci_name)
    if title:
        return get_wikipedia_image(title)
    return None

# Beispielanwendung
species_list = [
    "Anas platyrhynchos",        # Stockente
    "Cyanistes caeruleus",       # Blaumeise
    "Turdus merula",             # Amsel
    "Parus major",               # Kohlmeise
    "Buteo buteo",               # Mäusebussard
    "Unknown species"            # Beispiel für keinen Treffer
]

for sci_name in species_list:
    image_url = get_image_for_species(sci_name)
    if image_url:
        print(f"{sci_name} → {image_url}")
    else:
        print(f"{sci_name} → Kein Bild gefunden")
