import asyncio
import logging
from backend import AuthenticatedHttpClient, OriginBackendClient

class OriginSync:
    def __init__(self):
        self.http_client = AuthenticatedHttpClient()
        self.backend_client = OriginBackendClient(self.http_client)

    async def sync_playtime(self, cookies):
        try:
            # cookies is a dict of name:value
            await self.http_client.authenticate(cookies)
            user_id, persona_id, user_name = await self.backend_client.get_identity()
            
            # Get entitlements (owned games)
            entitlements = await self.backend_client.get_entitlements(user_id)
            basegame_entitlements = [x for x in entitlements if x["offerType"] == "basegame"]
            
            # Get playtime headers
            last_played_games = await self.backend_client.get_lastplayed_games(user_id)
            
            games_playtime = []
            
            # We need to fetch details in batches or one by one
            # To keep it simple for a CLI tool, we iterate
            for ent in basegame_entitlements:
                offer_id = ent["offerId"]
                # We need the masterTitleId and multiplayerId to get time
                # Normally the plugin caches offers, here we fetch them
                try:
                    offer = await self.backend_client.get_offer(offer_id)
                    master_title_id = offer["masterTitleId"]
                    multiplayer_id = None
                    for game_platform in offer["platforms"]:
                        if game_platform["multiPlayerId"]:
                            multiplayer_id = game_platform["multiPlayerId"]
                            break
                    
                    time_data = await self.backend_client.get_game_time(user_id, master_title_id, multiplayer_id)
                    # time_data is (total_minutes, last_played_timestamp)
                    
                    games_playtime.append({
                        "id": offer_id,
                        "name": offer["i18n"]["displayName"],
                        "playtime_mins": time_data[0],
                        "last_played": time_data[1]
                    })
                except Exception as e:
                    # Skip games that fail
                    continue
            
            return {
                "user_name": user_name,
                "games": games_playtime
            }
        finally:
            await self.http_client.close()
