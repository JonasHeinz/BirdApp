import requests

def get_wikipedia_page_title(search_term, lang="de"):
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
    search_results = data.get("query", {}).get("search", [])
    if search_results:
        return search_results[0]["title"]
    return None


def get_wikipedia_summary(species):
    lang = "de"
    title = get_wikipedia_page_title(species, lang)
    if not title:
        return {"summary": None, "url": None, "de_name": None}

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
    image_url = get_wikipedia_image(sci_name)
    if image_url:
        return image_url

    title = get_wikipedia_page_title(sci_name, lang="en")
    if title:
        return get_wikipedia_image(title)
    return None
