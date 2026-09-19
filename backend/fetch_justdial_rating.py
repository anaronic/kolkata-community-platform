import sys
import requests
from bs4 import BeautifulSoup

def get_justdial_rating(place_name, city='Kolkata'):
    search_url = f"https://www.justdial.com/{city}/{place_name.replace(' ', '-')}"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(search_url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.text, 'html.parser')
    rating_tag = soup.find('span', {'class': 'green-box'})
    if rating_tag:
        try:
            return float(rating_tag.text.strip())
        except Exception:
            pass
    return None

if __name__ == '__main__':
    place = sys.argv[1]
    city = sys.argv[2] if len(sys.argv) > 2 else 'Kolkata'
    rating = get_justdial_rating(place, city)
    print(rating if rating else 3.0) 