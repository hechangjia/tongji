import urllib.request
from bs4 import BeautifulSoup
from ddgs import DDGS

def search_and_scrape():
    with DDGS() as ddgs:
        results = list(ddgs.text('Stripe Retool Vercel internal dashboard UI UX design layout', max_results=5))
        
    for r in results:
        url = r.get('href')
        print(f"Fetching: {url}")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                html = response.read().decode('utf-8')
                soup = BeautifulSoup(html, 'html.parser')
                print(soup.get_text(separator=' ', strip=True)[:1000])
        except Exception as e:
            print(f"Error: {e}")

search_and_scrape()
