import asyncio
import logging
from backend import BackendClient

# Mock the plugin class because BackendClient expects it
class MockPlugin:
    def __init__(self):
        self.persistent_cache = {}
    def store_credentials(self, creds):
        pass
    def push_cache(self):
        pass

class UplaySync:
    def __init__(self):
        self.mock_plugin = MockPlugin()
        self.client = BackendClient(self.mock_plugin)

    async def sync_playtime(self, storage_jsons):
        try:
            # storage_jsons is [prodLoginData, prodRememberMe, prodLastProfile]
            user_data = await self.client.authorise_with_local_storage(storage_jsons)
            
            # Get club titles (owned games)
            # The plugin uses GraphQL for this
            data = await self.client.get_club_titles()
            nodes = data['data']['viewer']['ownedGames'].get('nodes', [])
            
            games_playtime = []
            
            for node in nodes:
                try:
                    space_id = node['spaceId']
                    name = node['name']
                    
                    # Fetch stats
                    response = await self.client.get_game_stats(space_id)
                    statscards = response.get('Statscards', None)
                    
                    if not statscards:
                        continue
                        
                    # find_times logic simplified
                    playtime = 0
                    last_played = 0
                    
                    for card in statscards:
                        if card.get('statName') == 'time_played':
                            playtime = int(card.get('value', 0))
                        if card.get('statName') == 'last_played':
                            last_played = int(card.get('value', 0))
                    
                    if playtime > 0:
                        games_playtime.append({
                            "id": space_id,
                            "name": name,
                            "playtime_mins": int(playtime / 60), # Stats usually in seconds
                            "last_played": last_played
                        })
                except Exception as e:
                    continue
            
            return {
                "user_name": user_data['username'],
                "games": games_playtime
            }
        finally:
            await self.client.close()
