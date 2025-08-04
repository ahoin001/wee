from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import time
import random

app = Flask(__name__)
# Allow cross-origin requests from your frontend.
CORS(app)

# A User-Agent header is crucial to mimic a real browser and avoid being blocked.
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def scrape_product_details(url):
    """Scrapes details from a single Amazon product page."""
    try:
        product_response = requests.get(url, headers=headers)
        product_response.raise_for_status()
        product_soup = BeautifulSoup(product_response.text, 'html.parser')
        
        product_name_element = product_soup.find('span', id='productTitle')
        product_name = product_name_element.text.strip() if product_name_element else "Not Found"

        price_whole_element = product_soup.find('span', class_='a-price-whole')
        price_fraction_element = product_soup.find('span', class_='a-price-fraction')
        price_symbol_element = product_soup.find('span', class_='a-price-symbol')

        price_text = "Not Found"
        if price_whole_element and price_fraction_element and price_symbol_element:
            price_text = f"{price_symbol_element.text.strip()}{price_whole_element.text.strip()}{price_fraction_element.text.strip()}"

        rating_element = product_soup.find('i', class_='a-icon-star')
        rating_text = rating_element.text.strip() if rating_element else "Not Found"

        reviews_element = product_soup.find('span', id='acrCustomerReviewText')
        reviews_text = reviews_element.text.strip() if reviews_element else "Not Found"
        
        return {
            "product_name": product_name,
            "price": price_text,
            "rating": rating_text,
            "number_of_reviews": reviews_text
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Error scraping product page: {e}")
        return None

@app.route('/scrape', methods=['POST'])
def scrape_products_api():
    """API endpoint to trigger scraping."""
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400
        
    print(f"Received scraping request for: {url}")

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        html_content = response.text
        
        soup = BeautifulSoup(html_content, 'html.parser')

        product_links = []
        for link in soup.find_all('a', class_='a-link-normal s-no-outline'):
            href = link.get('href')
            if href and "/dp/" in href:
                full_url = f"https://www.amazon.com{href}"
                if full_url not in product_links:
                    product_links.append(full_url)
        
        print(f"Found {len(product_links)} product links. Scraping the first 5...")

        scraped_data = []
        for i, product_url in enumerate(product_links[:5]):
            print(f"Scraping product {i+1}: {product_url}")
            details = scrape_product_details(product_url)
            if details:
                scraped_data.append(details)
            
            wait_time = random.uniform(5, 10)
            print(f"Waiting for {wait_time:.2f} seconds...")
            time.sleep(wait_time)
            
        return jsonify(scraped_data), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch or parse page: {e}"}), 500

if __name__ == '__main__':
    app.run(port=5000)
