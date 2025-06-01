import requests


def get_wikipedia_page_title(search_term, lang="de"):
    """
    Sucht den Wikipedia-Seitentitel zu einem Suchbegriff in der gewünschten Sprache.

    Args:
        search_term (str): Begriff, nach dem gesucht wird.
        lang (str): Sprachcode für Wikipedia (Standard: 'de').

    Returns:
        str oder None: Titel der relevantesten Wikipedia-Seite oder None, wenn nichts gefunden.
    """
    url = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": search_term,
        "utf8": 1
    }
    response = requests.get(url, params=params)
    data = response.json()
    # Extrahiere Suchergebnisse
    search_results = data.get("query", {}).get("search", [])
    if search_results:
        # Rückgabe des Titels des ersten Suchtreffers
        return search_results[0]["title"]
    return None


def get_wikipedia_summary(species):
    """
    Holt die Kurzbeschreibung (Summary) einer Art von der deutschsprachigen Wikipedia.

    Args:
        species (str): Name der Art (wissenschaftlich oder deutsch).

    Returns:
        dict: Dictionary mit Zusammenfassung, URL und deutschem Namen.
              Falls nicht gefunden, sind alle Werte None.
    """
    lang = "de"
    title = get_wikipedia_page_title(species, lang)
    if not title:
        return {"summary": None, "url": None, "de_name": None}

    # API für Kurzfassung der Seite
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return {
            "summary": data.get("extract"),
            "url": data.get("content_urls", {}).get("desktop", {}).get("page"),
            "de_name": data.get("title")
        }

    return {"summary": None, "url": None, "de_name": None}


def get_wikipedia_image(title):
    """
    Holt die Originalbild-URL einer Wikipedia-Seite anhand ihres Titels (englische Wikipedia).

    Args:
        title (str): Titel der Wikipedia-Seite.

    Returns:
        str oder None: URL zum Originalbild oder None, wenn kein Bild vorhanden.
    """
    url = f"https://en.wikipedia.org/w/api.php"
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
    """
Versucht, ein Bild zu einer Art zuerst auf der englischsprachigen Wikipedia zu finden.
Falls kein Bild gefunden wird, wird das auch mit dem wissenschaftlichen Namen versucht.

Args:
    sci_name (str): Wissenschaftlicher Name der Art.

Returns:
    str oder None: Bild-URL oder None, falls kein Bild gefunden.
"""
    image_url = get_wikipedia_image(sci_name)
    if image_url:
        return image_url

    title = get_wikipedia_page_title(sci_name, lang="en")
    if title:
        return get_wikipedia_image(title)
    return None
