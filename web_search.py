from ddgs import DDGS
import json
import urllib.request
from bs4 import BeautifulSoup
import re

def search_and_scrape():
    with DDGS() as ddgs:
        results = list(ddgs.text('saas internal tool ui design trends 2025', max_results=15))
        
    for r in results:
        url = r.get('href')
        print(f"Fetching: {url}")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                html = response.read().decode('utf-8')
                soup = BeautifulSoup(html, 'html.parser')
                text = soup.get_text(separator=' ', strip=True)
                # print a snippet
                print(text[:1000])
                print("-" * 40)
        except Exception as e:
            print(f"Error: {e}")

search_and_scrape()
