import requests
import time

# ThingSpeak channel details (replace with actual values)
CHANNEL_ID = "2890599"
READ_API_KEY = "YOUR_READ_API_KEY"  # Optional if channel is public
BASE_URL = f"https://api.thingspeak.com/channels/{CHANNEL_ID}/feeds.json"

# Query params (fetch in batches)
params = {
    "api_key": READ_API_KEY,  # Remove if channel is public
    "results": 5  # Number of entries to fetch per call
}

# Keep track of the latest entry ID we’ve seen
last_entry_id = None

def get_channel_info():
    """Fetch and display channel/project details once."""
    try:
        url = f"https://api.thingspeak.com/channels/{CHANNEL_ID}.json"
        response = requests.get(url, params={"api_key": READ_API_KEY}, timeout=10)
        if response.status_code == 200:
            channel = response.json()
            print("\n📡 Project Details (Fetched Once)")
            print("Channel Name :", channel.get("name"))
            print("Description  :", channel.get("description"))
            print("Created At   :", channel.get("created_at"))
            print("Updated At   :", channel.get("updated_at"))
            print("Fields       :", [channel.get(f"field{i}") for i in range(1, 9) if channel.get(f"field{i}")])
            print("-" * 60)
        else:
            print("Error fetching channel info:", response.text)
    except Exception as e:
        print("Exception fetching channel info:", e)

def fetch_new_data():
    """Fetch and display only new feed entries."""
    global last_entry_id
    try:
        response = requests.get(BASE_URL, params=params, timeout=10)

        # Print status and headers
        print("\n--- API Response ---")
        print("Status Code:", response.status_code)
        for header, value in response.headers.items():
            print(f"{header}: {value}")

        if response.status_code == 200:
            data = response.json()
            feeds = data.get("feeds", [])

            new_feeds = []
            for feed in feeds:
                entry_id = feed.get("entry_id")
                if last_entry_id is None or entry_id > last_entry_id:
                    new_feeds.append(feed)

            if new_feeds:
                print("\n🆕 New Data Rows:")
                for feed in new_feeds:
                    print(feed)
                last_entry_id = new_feeds[-1]["entry_id"]
            else:
                print("\n(No new data since last check)")
        else:
            print("Error fetching feeds:", response.text)

    except Exception as e:
        print("Exception occurred:", e)

# Main runner
if __name__ == "__main__":
    get_channel_info()
    while True:
        fetch_new_data()
        time.sleep(10)  # Check every 10 seconds
