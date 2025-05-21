import json
import requests
from bs4 import BeautifulSoup
from langchain_community.tools import tool

@tool
def get_webpage_text(url: str) -> str:
    """Fetches and returns the text content of a web page given its URL."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove scripts and style tags
        for script in soup(["script", "style"]):
            script.decompose()

        text = soup.get_text()
        return '\n'.join(line.strip() for line in text.splitlines() if line.strip())
    except Exception as e:
        return f"Failed to fetch the URL content: {str(e)}"
    
@tool 
def get_time_read(url: str):
    """Estimates the time it would take to read the web page given its URL
    
    Args:
        url (str): URL of the site/blog/article
    """

    wpm = 200
    text = get_webpage_text.invoke(url)

    time = len(text) / wpm

    return json.dumps({"url": url, "time": f"{time} minutes"})