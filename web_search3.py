import urllib.request
from bs4 import BeautifulSoup

urls = [
    "https://blog.logrocket.com/ux-design/linear-design/",
    "https://www.browserlondon.com/blog/2025/05/05/best-dashboard-designs-and-trends-in-2025/"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            # Extract paragraphs
            paragraphs = soup.find_all(['p', 'h2', 'h3', 'li'])
            text = ' '.join([p.get_text() for p in paragraphs])
            print(f"--- {url} ---")
            print(text[:3000])
    except Exception as e:
        print(f"Error: {e}")
